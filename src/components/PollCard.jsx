// PollCard.jsx — Live voting UI

const OPTION_COLORS = ['#7c6af7', '#f7c66a', '#4ade80', '#f87171'];
const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export function PollCard({ question, options, votes, totalVotes, hasVoted, txStatus, onVote, walletAddress }) {

  const pct = (v) => totalVotes === 0 ? 0 : Math.round((v / totalVotes) * 100);

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 20, padding: '32px', maxWidth: 560, width: '100%' }}
         className="animate-slide-up">

      {/* Question */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80',
                         display: 'inline-block', animation: 'pulse-dot 2s ease infinite' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: '#4ade80', textTransform: 'uppercase',
                         letterSpacing: '.1em', fontFamily: 'DM Mono, monospace' }}>Live Poll</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)',
                         fontFamily: 'DM Mono, monospace' }}>
            {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
          </span>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: 0,
                     lineHeight: 1.35, letterSpacing: '-0.02em' }}>
          {question}
        </h2>
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {options.map((opt, i) => {
          const p = pct(votes[i]);
          const isLeading = votes[i] === Math.max(...votes) && totalVotes > 0;
          const canVote = !!walletAddress && !hasVoted && txStatus.status !== 'pending';

          return (
            <button key={i} onClick={() => canVote && onVote(i)}
                    disabled={!canVote}
                    style={{
                      background: hasVoted ? 'var(--surface2)' : 'var(--surface2)',
                      border: `1px solid ${hasVoted && isLeading ? OPTION_COLORS[i] + '60' : 'var(--border)'}`,
                      borderRadius: 12,
                      padding: '14px 16px',
                      cursor: canVote ? 'pointer' : 'default',
                      textAlign: 'left',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'border-color .2s, transform .1s',
                      transform: 'scale(1)',
                    }}
                    onMouseEnter={e => { if (canVote) { e.currentTarget.style.borderColor = OPTION_COLORS[i] + '80'; e.currentTarget.style.transform = 'scale(1.01)'; }}}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = hasVoted && isLeading ? OPTION_COLORS[i] + '60' : 'var(--border)'; e.currentTarget.style.transform = 'scale(1)'; }}>

              {/* Progress fill */}
              {hasVoted && (
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  width: `${p}%`,
                  background: OPTION_COLORS[i] + '18',
                  animation: 'bar-grow 0.8s ease',
                  transition: 'width 0.6s ease',
                  borderRadius: 12,
                }} />
              )}

              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Label badge */}
                <div style={{ width: 28, height: 28, borderRadius: 8, background: OPTION_COLORS[i] + '22',
                              border: `1px solid ${OPTION_COLORS[i]}44`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 11, fontWeight: 700, color: OPTION_COLORS[i],
                              fontFamily: 'DM Mono, monospace', flexShrink: 0 }}>
                  {OPTION_LABELS[i]}
                </div>

                {/* Option text */}
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', flex: 1 }}>
                  {opt}
                </span>

                {/* Percentage */}
                {hasVoted && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isLeading && <span style={{ fontSize: 10 }}>👑</span>}
                    <span style={{ fontSize: 13, fontWeight: 700, color: OPTION_COLORS[i],
                                   fontFamily: 'DM Mono, monospace' }}>
                      {p}%
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'DM Mono, monospace' }}>
                      ({votes[i]})
                    </span>
                  </div>
                )}

                {/* Pending spinner */}
                {txStatus.status === 'pending' && !hasVoted && (
                  <div style={{ width: 14, height: 14, border: '2px solid var(--border)',
                                borderTopColor: 'var(--accent)', borderRadius: '50%',
                                animation: 'spin 0.7s linear infinite' }} />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Not connected hint */}
      {!walletAddress && (
        <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, marginTop: 20 }}>
          Connect your wallet to vote
        </p>
      )}

      {/* Already voted */}
      {hasVoted && (
        <p style={{ textAlign: 'center', color: 'var(--success)', fontSize: 13, marginTop: 20,
                    fontWeight: 500 }}>
          ✓ You've voted — results update live
        </p>
      )}
    </div>
  );
}
