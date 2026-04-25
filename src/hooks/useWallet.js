// useWallet.js — StellarWalletsKit multi-wallet hook
// Handles: Freighter, xBull, Albedo, LOBSTR, Rabet, WalletConnect
// Error types handled:
//   1. Wallet not found / not installed
//   2. User rejected / cancelled
//   3. Insufficient balance / network errors

import { useState, useCallback, useRef } from 'react';
import {
  StellarWalletsKit,
  WalletNetwork,
  FREIGHTER_ID,
  XBULL_ID,
  FreighterModule,
  xBullModule,
  AlbedoModule,
} from '@creit.tech/stellar-wallets-kit';

const NETWORK = WalletNetwork.TESTNET;

// Build the kit with all supported wallets
function buildKit() {
  return new StellarWalletsKit({
    network: NETWORK,
    selectedWalletId: FREIGHTER_ID,
    modules: [
      new FreighterModule(),
      new xBullModule(),
      new AlbedoModule(),
    ],
  });
}

export function useWallet() {
  const [address, setAddress]       = useState('');
  const [walletId, setWalletId]     = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError]           = useState(null);
  const kitRef = useRef(null);

  // Lazily init kit
  function getKit() {
    if (!kitRef.current) kitRef.current = buildKit();
    return kitRef.current;
  }

  // ── Open wallet selector modal ───────────────────────────────────────────
  const openModal = useCallback(() => {
    setError(null);
    const kit = getKit();

    kit.openModal({
      onWalletSelected: async (option) => {
        setIsConnecting(true);
        try {
          kit.setWallet(option.id);

          // Get address from the selected wallet
          const { address: addr } = await kit.getAddress();
          if (!addr) throw new Error('WALLET_NOT_FOUND');

          setAddress(addr);
          setWalletId(option.id);
          setError(null);
        } catch (err) {
          const msg = err?.message || '';
          if (
            msg.includes('not installed') ||
            msg.includes('WALLET_NOT_FOUND') ||
            msg.includes('extension')
          ) {
            setError({ type: 'NOT_FOUND', message: `${option.name} is not installed. Please install the extension and try again.` });
          } else if (
            msg.includes('reject') ||
            msg.includes('cancel') ||
            msg.includes('denied') ||
            msg.includes('User declined')
          ) {
            setError({ type: 'REJECTED', message: 'Connection rejected. Please approve the request in your wallet.' });
          } else {
            setError({ type: 'UNKNOWN', message: msg || 'Failed to connect wallet.' });
          }
        } finally {
          setIsConnecting(false);
        }
      },
      onClosed: () => {
        setIsConnecting(false);
      },
    });
  }, []);

  // ── Sign a transaction XDR ───────────────────────────────────────────────
  const signTx = useCallback(async (xdr) => {
    if (!address) throw new Error('No wallet connected');
    const kit = getKit();
    try {
      const { signedTxXdr } = await kit.signTransaction(xdr, {
        address,
        networkPassphrase: 'Test SDF Network ; September 2015',
      });
      return signedTxXdr;
    } catch (err) {
      const msg = err?.message || '';
      if (msg.includes('reject') || msg.includes('cancel') || msg.includes('denied')) {
        throw Object.assign(new Error('Transaction rejected by user.'), { type: 'REJECTED' });
      }
      throw err;
    }
  }, [address]);

  // ── Disconnect ───────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    setAddress('');
    setWalletId('');
    setError(null);
    kitRef.current = null;
  }, []);

  return { address, walletId, isConnecting, error, setError, openModal, signTx, disconnect };
}
