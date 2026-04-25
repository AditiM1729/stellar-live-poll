// TxToast.jsx — Transaction status: pending / success / error

export function TxToast({ txStatus, onClose }) {
  if (txStatus.status === 'idle') return null;

  const configs = {
    pending: {
      bg: 'rgba(124,106,247,0.1)',
      border: 'rgba(124,106,247,0.4)',
      icon: (
        <div style={{ width: 18, height: 18, border: '2px solid rgba(124,106,247,0.3)',
                      borderTopColor: '#7c6af7', borderRadius: '50%',
                      animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
      ),
      title: 'Transaction Pending',
      body: 'Waiting for wallet signature and network confirmation…',
      titleColor: '#a89cf7',
    },
    success: {
      bg: 'rgba(74,222,128,0.08)',
      border: 'rgba(74,222,128,0.35)',
      icon: <span style={{ fontSize: 18, flexShrink: 0 }}>✓</span>,
      title: 'Transaction Confirmed',
      titleColor: '#4ade80',
      body: null,
    },
    error: {
      bg: 'rgba(248,113,113,0.08)',
      border: 'rgba(248,113,113,0.35)',
      icon: <span style={{ fontSize: 18, flexShrink: 0 }}>✗</span>,
      title: txStatus.error?.includes('rejected') || txStatus.error?.includes('Rejected')
        ? 'Transaction Rejected'
        : txStatus.error?.includes('Insufficient') || txStatus.error?.includes('insufficient')
        ? 'Insufficient Balance'
        : 'Transaction Failed',
      titleColor: '#f87171',
      body: txStatus.error,
    },
  };

  const c = configs[txStatus.status];
  if (!c) return null;

  return (
    <div className="tx-toast"
         style={{ background: c.bg, border: `1px solid ${c.border}`,
                  borderRadius: 14, padding: '16px 18px', maxWidth: 560,
                  width: '100%', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>

        {/* Icon */}
        <div style={{ color: c.titleColor, marginTop: 2 }}>{c.icon}</div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: c.titleColor,
                        textTransform: 'uppercase', letterSpacing: '.06em',
                        fontFamily: 'DM Mono, monospace', marginBottom: 4 }}>
            {c.title}
          </div>

          {txStatus.status === 'pending' && (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>{c.body}</p>
          )}

          {txStatus.status === 'success' && txStatus.hash && (
            <div>
              <p style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--muted)' }}>
                Your vote is recorded on-chain.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>TX:</span>
                <code style={{ fontFamily: 'DM Mono, monospace', fontSize: 11,
                               color: '#a89cf7', wordBreak: 'break-all' }}>
                  {txStatus.hash}
                </code>
              </div>
              <a href={`https://stellar.expert/explorer/testnet/tx/${txStatus.hash}`}
                 target="_blank" rel="noopener noreferrer"
                 style={{ display: 'inline-block', marginTop: 8, fontSize: 12,
                          color: '#7c6af7', textDecoration: 'none', fontWeight: 500 }}>
                View on Stellar Expert →
              </a>
            </div>
          )}

          {txStatus.status === 'error' && (
            <p style={{ margin: 0, fontSize: 13, color: '#fca5a5' }}>{c.body}</p>
          )}
        </div>

        {/* Close — not on pending */}
        {txStatus.status !== 'pending' && (
          <button onClick={onClose}
                  style={{ background: 'none', border: 'none', color: 'var(--muted)',
                           cursor: 'pointer', fontSize: 16, padding: 0, lineHeight: 1,
                           flexShrink: 0, marginTop: 1, transition: 'color .15s' }}
                  onMouseEnter={e => e.target.style.color = 'var(--text)'}
                  onMouseLeave={e => e.target.style.color = 'var(--muted)'}>
            ×
          </button>
        )}
      </div>
    </div>
  );
}
