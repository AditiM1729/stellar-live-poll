// usePoll.js — Uses raw JSON-RPC fetch to avoid all SDK version issues
// This approach works regardless of stellar-sdk version

import { useState, useEffect, useCallback, useRef } from 'react';
import * as StellarSdk from '@stellar/stellar-sdk';

const {
  TransactionBuilder,
  Networks,
  BASE_FEE,
  Contract,
  Address,
  nativeToScVal,
  scValToNative,
} = StellarSdk;

// Get rpc from either location depending on SDK version
const SorobanRpc = StellarSdk.rpc || StellarSdk.SorobanRpc;

const RPC_URL      = 'https://soroban-testnet.stellar.org';
const NETWORK_PASS = Networks.TESTNET;

export const CONTRACT_ID =
  import.meta.env.VITE_CONTRACT_ID ||
  'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM';

const POLL_QUESTION = "What is the most important Stellar use case in 2025?";
const POLL_OPTIONS = [
  'Cross-border Payments',
  'RWA Tokenization',
  'DeFi Protocols',
  'NFT Platforms',
];

// ── Raw JSON-RPC helpers — no SDK parsing issues ─────────────────────────────
async function rpcCall(method, params) {
  const res = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message || JSON.stringify(json.error));
  return json.result;
}

async function simulateTx(txXdr) {
  return rpcCall('simulateTransaction', { transaction: txXdr });
}

async function sendTx(txXdr) {
  return rpcCall('sendTransaction', { transaction: txXdr });
}

async function getTx(hash) {
  return rpcCall('getTransaction', { hash });
}

async function getLatestLedger() {
  return rpcCall('getLatestLedger', {});
}

// ── Build a transaction using Soroban RPC for account sequence ───────────────
async function getAccountSequence(address) {
  const result = await rpcCall('getLedgerEntries', {
    keys: [
      StellarSdk.xdr.LedgerKey.account(
        new StellarSdk.xdr.LedgerKeyAccount({
          accountID: StellarSdk.xdr.AccountID.publicKeyTypeEd25519(
            StellarSdk.StrKey.decodeEd25519PublicKey(address)
          ),
        })
      ).toXDR('base64')
    ]
  });
  if (!result.entries?.length) throw new Error('Account not found. Fund your wallet at friendbot.stellar.org');
  const entry = StellarSdk.xdr.LedgerEntryData.fromXDR(result.entries[0].xdr, 'base64');
  const seqNum = entry.account().seqNum().toString();
  return seqNum;
}

function parseVoteMap(retval) {
  try {
    const native = scValToNative(retval);
    const newVotes = [0, 0, 0, 0];
    if (native instanceof Map) {
      for (const [k, v] of native) {
        const idx = Number(k);
        if (idx >= 0 && idx <= 3) newVotes[idx] = Number(v);
      }
    } else if (typeof native === 'object' && native !== null) {
      for (const [k, v] of Object.entries(native)) {
        const idx = Number(k);
        if (idx >= 0 && idx <= 3) newVotes[idx] = Number(v);
      }
    }
    return newVotes;
  } catch (e) {
    console.warn('parseVoteMap:', e.message);
    return [0, 0, 0, 0];
  }
}

function parseBool(retval) {
  try { return Boolean(scValToNative(retval)); }
  catch { return false; }
}

export function usePoll(signTx, walletAddress) {
  const [votes, setVotes]         = useState([0, 0, 0, 0]);
  const [hasVoted, setHasVoted]   = useState(false);
  const [txStatus, setTxStatus]   = useState({ status: 'idle' });
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents]       = useState([]);
  const intervalRef               = useRef(null);

  // ── Build a tx using the RPC Server for account (most reliable) ──────────
  async function buildTx(operations, timeoutSecs = 300) {
    // Use SDK's rpc.Server just for getAccount — most reliable way
    const server = new SorobanRpc.Server(RPC_URL, { allowHttp: false });
    const account = await server.getAccount(walletAddress);
    const builder = new TransactionBuilder(account, {
      fee: String(1000000), // 0.1 XLM max fee — high enough to never fail
      networkPassphrase: NETWORK_PASS,
    });
    for (const op of operations) builder.addOperation(op);
    return builder.setTimeout(timeoutSecs).build();
  }

  // ── Fetch vote counts ────────────────────────────────────────────────────
  const fetchResults = useCallback(async () => {
    if (!CONTRACT_ID || CONTRACT_ID.includes('AAAAAAA') || !walletAddress) return;
    setIsLoading(true);
    try {
      const contract = new Contract(CONTRACT_ID);
      const tx = await buildTx([contract.call('get_results')]);
      const sim = await simulateTx(tx.toXDR());

      if (sim.results?.[0]?.xdr) {
        const retval = StellarSdk.xdr.ScVal.fromXDR(sim.results[0].xdr, 'base64');
        setVotes(parseVoteMap(retval));
      }
    } catch (e) { console.warn('fetchResults:', e.message); }
    finally { setIsLoading(false); }
  }, [walletAddress]);

  // ── Check has voted ──────────────────────────────────────────────────────
  const checkHasVoted = useCallback(async () => {
    if (!walletAddress || CONTRACT_ID.includes('AAAAAAA')) return;
    try {
      const contract = new Contract(CONTRACT_ID);
      const tx = await buildTx([
        contract.call('has_voted', Address.fromString(walletAddress).toScVal())
      ]);
      const sim = await simulateTx(tx.toXDR());
      if (sim.results?.[0]?.xdr) {
        const retval = StellarSdk.xdr.ScVal.fromXDR(sim.results[0].xdr, 'base64');
        setHasVoted(parseBool(retval));
      }
    } catch (e) { console.warn('checkHasVoted:', e.message); }
  }, [walletAddress]);

  useEffect(() => {
    if (!walletAddress) return;
    fetchResults();
    checkHasVoted();
    intervalRef.current = setInterval(fetchResults, 8000);
    return () => clearInterval(intervalRef.current);
  }, [walletAddress, fetchResults, checkHasVoted]);

  // ── Cast vote ────────────────────────────────────────────────────────────
  const castVote = useCallback(async (optionIndex) => {
    if (!walletAddress || !signTx) return;
    setTxStatus({ status: 'pending' });

    try {
      const contract = new Contract(CONTRACT_ID);

      // 1. Build raw tx
      const rawTx = await buildTx([
        contract.call(
          'vote',
          Address.fromString(walletAddress).toScVal(),
          nativeToScVal(optionIndex, { type: 'u32' }),
        )
      ]);

      // 2. Simulate via raw RPC
      const simResult = await simulateTx(rawTx.toXDR());
      console.log('sim result:', simResult);

      if (simResult.error) {
        const e = simResult.error;
        if (e.includes('Already voted') || e.includes('already voted')) {
          setTxStatus({ status: 'error', error: 'You have already voted with this wallet.' });
          setHasVoted(true);
          return;
        }
        throw new Error('Simulation failed: ' + e);
      }

      // 3. Inject soroban data from simulation into the transaction
      const assembleTransaction = SorobanRpc.assembleTransaction
        || StellarSdk.assembleTransaction;

      if (!assembleTransaction) {
        throw new Error('assembleTransaction not found in SDK. Please check your stellar-sdk version.');
      }

      const preparedTx = assembleTransaction(rawTx, simResult).build();
      console.log('prepared tx XDR length:', preparedTx.toXDR().length);

      // 4. Sign — signTx returns the signed XDR string
      const signedXdr = await signTx(preparedTx.toXDR());
      console.log('signed XDR type:', typeof signedXdr, 'length:', signedXdr?.length);

      if (!signedXdr || typeof signedXdr !== 'string') {
        throw new Error('Wallet did not return a signed transaction.');
      }

      // 5. Submit signed XDR directly via raw RPC — no re-parsing!
      const sendResult = await sendTx(signedXdr);
      console.log('send result:', sendResult);

      if (sendResult.status === 'ERROR') {
        throw new Error('Submit failed: ' + (sendResult.errorResultXdr || sendResult.status));
      }

      const txHash = sendResult.hash;
      console.log('tx hash:', txHash);

      // 6. Poll for confirmation
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const check = await getTx(txHash);
        console.log(`poll ${i + 1}/30: ${check.status}`);

        if (check.status === 'SUCCESS') {
          setTxStatus({ status: 'success', hash: txHash });
          setHasVoted(true);
          setVotes(prev => {
            const next = [...prev];
            next[optionIndex] = (next[optionIndex] || 0) + 1;
            return next;
          });
          setEvents(prev => [{
            type: 'vote',
            option: POLL_OPTIONS[optionIndex],
            voter: walletAddress.slice(0, 6) + '...' + walletAddress.slice(-4),
            hash: txHash,
            time: new Date().toLocaleTimeString(),
          }, ...prev.slice(0, 19)]);
          setTimeout(fetchResults, 2000);
          return;
        }

        if (check.status === 'FAILED') {
          throw new Error('Transaction failed on-chain. Result: ' + (check.resultXdr || ''));
        }
        // NOT_FOUND = still pending
      }

      // Timed out but tx might still confirm
      setTxStatus({
        status: 'success',
        hash: txHash,
        note: 'Submitted! Confirming on chain...'
      });

    } catch (err) {
      const msg = err?.message || '';
      console.error('castVote error:', msg, err);

      if (msg.includes('not installed') || msg.includes('extension')) {
        setTxStatus({ status: 'error', error: 'Wallet not found. Please install Freighter.' });
      } else if (
        err.type === 'REJECTED' ||
        msg.toLowerCase().includes('reject') ||
        msg.toLowerCase().includes('cancel') ||
        msg.toLowerCase().includes('denied') ||
        msg.toLowerCase().includes('declined')
      ) {
        setTxStatus({ status: 'error', error: 'Transaction rejected by user.' });
      } else if (msg.toLowerCase().includes('insufficient')) {
        setTxStatus({ status: 'error', error: 'Insufficient XLM. Fund at friendbot.stellar.org' });
      } else if (msg.includes('Already voted') || msg.includes('already voted')) {
        setTxStatus({ status: 'error', error: 'You have already voted with this wallet.' });
        setHasVoted(true);
      } else {
        setTxStatus({ status: 'error', error: msg || 'Transaction failed.' });
      }
    }
  }, [walletAddress, signTx, fetchResults]);

  const clearTxStatus = useCallback(() => setTxStatus({ status: 'idle' }), []);
  const totalVotes = votes.reduce((a, b) => a + b, 0);

  return {
    votes, hasVoted, txStatus, isLoading,
    events, totalVotes, castVote, clearTxStatus,
    POLL_QUESTION, POLL_OPTIONS,
  };
}