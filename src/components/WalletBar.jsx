// WalletBar.jsx — Multi-wallet connect bar
import { useState } from 'react';

const WALLET_ICONS = {
  freighter: '🔒',
  xbull: '🐂',
  albedo: '🌐',
  default: '👛',
};

export function WalletBar({ address, walletId, isConnecting, error, onConnect, onDisconnect }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const short = addr => addr ? `${addr.slice(0, 6)}...${addr.slice(-6)}` : '';

  return (
    <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}
         className="px-6 py-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">

        {/* Brand */}
        <div className="flex items-center gap-3">
          <div style={{ background: 'var(--accent)', borderRadius: 8, width: 32, height: 32 }}
               className="flex items-center justify-center text-sm font-bold text-white">S</div>
          <span style={{ color: 'var(--text)', fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em' }}>
            StellarPoll
          </span>
          <span style={{ background: 'var(--surface2)', color: 'var(--accent)', fontSize: 10,
                         padding: '2px 7px', borderRadius: 20, border: '1px solid var(--border)',
                         fontFamily: 'DM Mono, monospace', fontWeight: 500 }}>
            TESTNET
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {address ? (
            <>
              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)',
                           borderRadius: 10, padding: '6px 14px' }}
                   className="flex items-center gap-2">
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)',
                               display: 'inline-block', animation: 'pulse-dot 2s ease infinite' }} />
                <span className="mono" style={{ fontSize: 13, color: 'var(--text)' }}>
                  {short(address)}
                </span>
                <button onClick={copy}
                        style={{ color: 'var(--muted)', fontSize: 11, cursor: 'pointer',
                                 background: 'none', border: 'none', padding: 0, transition: 'color .15s' }}
                        onMouseEnter={e => e.target.style.color = 'var(--text)'}
                        onMouseLeave={e => e.target.style.color = 'var(--muted)'}>
                  {copied ? '✓' : '⎘'}
                </button>
              </div>
              <button onClick={onDisconnect}
                      style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--muted)',
                               borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer',
                               transition: 'all .15s' }}
                      onMouseEnter={e => { e.target.style.borderColor = 'var(--error)'; e.target.style.color = 'var(--error)'; }}
                      onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--muted)'; }}>
                Disconnect
              </button>
            </>
          ) : (
            <button onClick={onConnect} disabled={isConnecting}
                    style={{ background: 'var(--accent)', color: '#fff', border: 'none',
                             borderRadius: 10, padding: '8px 20px', fontSize: 13, fontWeight: 600,
                             cursor: isConnecting ? 'wait' : 'pointer', fontFamily: 'Syne, sans-serif',
                             opacity: isConnecting ? 0.7 : 1, transition: 'opacity .15s',
                             letterSpacing: '-0.01em' }}>
              {isConnecting ? 'Connecting…' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{ maxWidth: 896, margin: '12px auto 0', background: 'rgba(248,113,113,0.08)',
                      border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8,
                      padding: '10px 16px', fontSize: 13 }}
             className="flex items-start gap-3 animate-slide-up">
          <span style={{ color: 'var(--error)', fontWeight: 600, marginTop: 1 }}>⚠</span>
          <div>
            <span style={{ color: 'var(--error)', fontWeight: 600, fontSize: 11,
                           textTransform: 'uppercase', letterSpacing: '.06em', display: 'block' }}>
              {error.type === 'NOT_FOUND' ? 'Wallet Not Found' :
               error.type === 'REJECTED' ? 'Connection Rejected' : 'Error'}
            </span>
            <span style={{ color: '#fca5a5' }}>{error.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
