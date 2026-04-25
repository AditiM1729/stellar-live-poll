// App.jsx — StellarPoll Level 2 dApp
// Features: StellarWalletsKit multi-wallet, Soroban contract, real-time events,
//           3 error types, transaction status tracking

import { WalletBar }    from './components/WalletBar.jsx';
import { PollCard }     from './components/PollCard.jsx';
import { TxToast }      from './components/TxToast.jsx';
import { ActivityFeed } from './components/ActivityFeed.jsx';
import { useWallet }    from './hooks/useWallet.js';
import { usePoll, CONTRACT_ID } from './hooks/usePoll.js';

export default function App() {
  const {
    address, walletId, isConnecting, error: walletError,
    setError: setWalletError, openModal, signTx, disconnect,
  } = useWallet();

  const {
    votes, hasVoted, txStatus, isLoading, events,
    totalVotes, castVote, clearTxStatus,
    POLL_QUESTION, POLL_OPTIONS,
  } = usePoll(signTx, address);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Top wallet bar */}
      <WalletBar
        address={address}
        walletId={walletId}
        isConnecting={isConnecting}
        error={walletError}
        onConnect={openModal}
        onDisconnect={disconnect}
      />

      {/* Hero section */}
      <div style={{ textAlign: 'center', padding: '48px 24px 32px', maxWidth: 640,
                    margin: '0 auto', width: '100%' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)',
                      textTransform: 'uppercase', letterSpacing: '.14em',
                      fontFamily: 'DM Mono, monospace', marginBottom: 14 }}>
          On-Chain · Soroban · Testnet
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--text)', margin: '0 0 12px',
                     letterSpacing: '-0.04em', lineHeight: 1.15 }}>
          Live Stellar Poll
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 15, margin: 0, lineHeight: 1.6 }}>
          Every vote is a real Soroban transaction on Stellar Testnet.
          <br />Connect any wallet and cast your vote.
        </p>
      </div>

      {/* Main layout */}
      <main style={{ flex: 1, padding: '0 24px 64px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex',
                      gap: 24, alignItems: 'flex-start', flexWrap: 'wrap',
                      justifyContent: 'center' }}>

          {/* Left column: Poll + TX toast */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16,
                        flex: '1 1 480px', maxWidth: 560 }}>

            <PollCard
              question={POLL_QUESTION}
              options={POLL_OPTIONS}
              votes={votes}
              totalVotes={totalVotes}
              hasVoted={hasVoted}
              txStatus={txStatus}
              onVote={castVote}
              walletAddress={address}
            />

            <TxToast txStatus={txStatus} onClose={clearTxStatus} />

            {/* Error cards for 3 error types */}
            {txStatus.status === 'error' && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
                            borderRadius: 14, padding: '16px 20px', fontSize: 13 }}>
                <div style={{ color: 'var(--muted)', marginBottom: 8, fontSize: 11,
                              textTransform: 'uppercase', letterSpacing: '.07em',
                              fontFamily: 'DM Mono, monospace' }}>
                  Error Handled
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <ErrorTypeRow
                    active={txStatus.error?.toLowerCase().includes('reject')}
                    label="User Rejected"
                    desc="Wallet popup was dismissed or denied" />
                  <ErrorTypeRow
                    active={txStatus.error?.toLowerCase().includes('insufficient') || txStatus.error?.toLowerCase().includes('balance')}
                    label="Insufficient Balance"
                    desc="Not enough XLM for fees" />
                  <ErrorTypeRow
                    active={txStatus.error && !txStatus.error?.toLowerCase().includes('reject') && !txStatus.error?.toLowerCase().includes('insufficient')}
                    label="Network / Contract Error"
                    desc="RPC failure or contract panic" />
                </div>
              </div>
            )}
          </div>

          {/* Right column: Activity feed */}
          <div style={{ flex: '1 1 300px', maxWidth: 380 }}>
            <ActivityFeed events={events} contractId={CONTRACT_ID} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '20px 24px',
                       textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)', fontFamily: 'DM Mono, monospace' }}>
          Stellar Level 2 — Multi-wallet · Soroban · Real-time Events
          {' · '}
          <a href="https://github.com/YOUR_USERNAME/stellar-live-poll"
             target="_blank" rel="noopener noreferrer"
             style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}

function ErrorTypeRow({ active, label, desc }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10,
                  opacity: active ? 1 : 0.35 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, marginTop: 5,
                     background: active ? 'var(--error)' : 'var(--muted)',
                     display: 'inline-block' }} />
      <div>
        <span style={{ fontSize: 12, fontWeight: 600, color: active ? 'var(--error)' : 'var(--muted)' }}>
          {label}
        </span>
        <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 6 }}>{desc}</span>
      </div>
    </div>
  );
}
