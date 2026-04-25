// ActivityFeed.jsx — Real-time contract event stream

const TYPE_COLORS = { vote: '#7c6af7', system: '#f7c66a' };

export function ActivityFeed({ events, contractId }) {
  const short = (id) => id ? `${id.slice(0, 8)}...${id.slice(-6)}` : '—';

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 20, padding: '24px', width: '100%', maxWidth: 360 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f7c66a',
                       display: 'inline-block', animation: 'pulse-dot 1.5s ease infinite' }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)',
                       textTransform: 'uppercase', letterSpacing: '.1em' }}>
          Live Activity
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted)',
                       fontFamily: 'DM Mono, monospace' }}>
          {events.length} events
        </span>
      </div>

      {/* Contract info */}
      <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)',
                    borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase',
                      letterSpacing: '.08em', marginBottom: 4 }}>Contract ID</div>
        <code style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#a89cf7',
                       wordBreak: 'break-all', lineHeight: 1.5 }}>
          {contractId}
        </code>
        <div style={{ marginTop: 8 }}>
          <a href={`https://stellar.expert/explorer/testnet/contract/${contractId}`}
             target="_blank" rel="noopener noreferrer"
             style={{ fontSize: 11, color: 'var(--muted)', textDecoration: 'none',
                      transition: 'color .15s' }}
             onMouseEnter={e => e.target.style.color = '#7c6af7'}
             onMouseLeave={e => e.target.style.color = 'var(--muted)'}>
            View on Explorer →
          </a>
        </div>
      </div>

      {/* Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8,
                    maxHeight: 320, overflowY: 'auto' }}>
        {events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0',
                        color: 'var(--muted)', fontSize: 13 }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>📡</div>
            Listening for events…
          </div>
        ) : (
          events.map((ev, i) => (
            <div key={i}
                 style={{ background: 'var(--surface2)', border: '1px solid var(--border)',
                          borderRadius: 10, padding: '10px 12px',
                          animation: i === 0 ? 'slide-up 0.3s ease both' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%',
                               background: TYPE_COLORS[ev.type] || 'var(--muted)',
                               display: 'inline-block' }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: TYPE_COLORS[ev.type],
                               textTransform: 'uppercase', letterSpacing: '.07em',
                               fontFamily: 'DM Mono, monospace' }}>
                  {ev.type}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--muted)',
                               fontFamily: 'DM Mono, monospace' }}>
                  {ev.time}
                </span>
              </div>

              <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>
                <span style={{ color: 'var(--muted)' }}>{ev.voter}</span>
                {' voted for '}
                <span style={{ color: '#a89cf7', fontWeight: 600 }}>{ev.option}</span>
              </div>

              {ev.hash && (
                <a href={`https://stellar.expert/explorer/testnet/tx/${ev.hash}`}
                   target="_blank" rel="noopener noreferrer"
                   style={{ fontSize: 10, color: 'var(--muted)', textDecoration: 'none',
                            fontFamily: 'DM Mono, monospace', display: 'block', marginTop: 4 }}
                   onMouseEnter={e => e.target.style.color = '#7c6af7'}
                   onMouseLeave={e => e.target.style.color = 'var(--muted)'}>
                  {ev.hash.slice(0, 16)}…
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
