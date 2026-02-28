import React, { useState, useEffect, useRef } from 'react';
import { leaderboardAPI } from '../api';
import Navbar from '../components/Navbar';

export default function LeaderboardPage() {
  const [overall, setOverall] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState([]);
  const [rocketLaunch, setRocketLaunch] = useState(false);
  const [firstPlaceLanded, setFirstPlaceLanded] = useState(false);
  const timerRef = useRef([]);

  useEffect(() => {
    leaderboardAPI.overall().then(r => {
      setOverall(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && overall.length > 0) {
      const sorted = [...overall].sort((a, b) => a.score - b.score); // lowest first
      sorted.forEach((_, i) => {
        const t = setTimeout(() => {
          setRevealed(prev => [...prev, i]);
        }, i * 600 + 300);
        timerRef.current.push(t);
      });
      // Rocket launch for 1st place (last to appear)
      const rocketDelay = sorted.length * 600 + 400;
      const t2 = setTimeout(() => setRocketLaunch(true), rocketDelay);
      const t3 = setTimeout(() => setFirstPlaceLanded(true), rocketDelay + 1800);
      timerRef.current.push(t2, t3);
    }
    return () => timerRef.current.forEach(clearTimeout);
  }, [loading, overall]);

  const byEvent = overall.reduce((acc, item) => {
    const key = item.event_title;
    if (!acc[key]) acc[key] = { title: key, date: item.event_date, teams: [] };
    acc[key].teams.push(item);
    return acc;
  }, {});

  // Sort lowest to highest for animation reveal
  const sortedOverall = [...overall].sort((a, b) => a.score - b.score);

  return (
    <>
      <Navbar />
      <div className="scanline" />
      <style>{`
        @keyframes stackIn {
          0% { opacity: 0; transform: translateX(-60px) scale(0.85); }
          60% { transform: translateX(8px) scale(1.02); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes rocketLeft {
          0% { transform: translate(-200px, 100px) rotate(-30deg); opacity: 0; }
          30% { opacity: 1; }
          70% { transform: translate(-20px, -10px) rotate(-5deg); opacity: 1; }
          100% { transform: translate(0px, 0px) rotate(0deg); opacity: 1; }
        }
        @keyframes rocketRight {
          0% { transform: translate(200px, 100px) rotate(30deg); opacity: 0; }
          30% { opacity: 1; }
          70% { transform: translate(20px, -10px) rotate(5deg); opacity: 1; }
          100% { transform: translate(0px, 0px) rotate(0deg); opacity: 1; }
        }
        @keyframes liftUp {
          0% { transform: translateY(200px); opacity: 0; }
          40% { opacity: 1; }
          70% { transform: translateY(-20px); }
          85% { transform: translateY(5px); }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes landOnTop {
          0% { transform: translateY(0); }
          30% { transform: translateY(-8px); }
          60% { transform: translateY(3px); }
          100% { transform: translateY(0); }
        }
        @keyframes goldPulse {
          0%,100% { box-shadow: 0 0 20px rgba(251,191,36,0.4), 0 0 40px rgba(251,191,36,0.2); }
          50% { box-shadow: 0 0 40px rgba(251,191,36,0.8), 0 0 80px rgba(251,191,36,0.4); }
        }
        @keyframes exhaustFlame {
          0%,100% { transform: scaleY(1) scaleX(1); opacity: 0.9; }
          50% { transform: scaleY(1.4) scaleX(0.7); opacity: 0.6; }
        }
        @keyframes sparkle {
          0% { transform: translate(0,0) scale(1); opacity: 1; }
          100% { transform: translate(var(--sx), var(--sy)) scale(0); opacity: 0; }
        }
        .stack-item { animation: stackIn 0.7s cubic-bezier(0.34,1.3,0.64,1) both; }
        .rocket-left { animation: rocketLeft 1.8s cubic-bezier(0.25,0.46,0.45,0.94) both; }
        .rocket-right { animation: rocketRight 1.8s cubic-bezier(0.25,0.46,0.45,0.94) both; }
        .lift-up { animation: liftUp 1.8s cubic-bezier(0.34,1.1,0.64,1) both; }
        .land-on-top { animation: landOnTop 0.6s ease both; }
        .gold-pulse { animation: goldPulse 2s ease-in-out infinite; }
      `}</style>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem' }}>
        <div style={{ marginBottom: '2rem', animation: 'fadeInUp 0.5s ease both' }}>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--accent)', letterSpacing: '0.05em' }}>🏆 Club Leaderboard</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Overall performance across all events</p>
        </div>

        {/* Overall animated leaderboard */}
        {overall.length > 0 && (
          <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(0,212,255,0.05))', overflow: 'visible', animation: 'fadeInUp 0.5s ease 0.2s both' }}>
            <h2 style={{ fontFamily: 'Orbitron', fontSize: '1rem', color: 'var(--accent2)', marginBottom: '1.5rem' }}>⚡ Rankings</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', position: 'relative' }}>
              {/* Render lowest to 2nd place first (stacking animation) */}
              {sortedOverall.slice(0, -1).map((team, i) => (
                revealed.includes(i) ? (
                  <div key={i} className="stack-item" style={{ animationDelay: '0s', display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
                    <span style={{ fontFamily: 'Orbitron', fontWeight: 900, minWidth: 32, color: i === sortedOverall.length - 2 ? '#94a3b8' : 'var(--text-muted)' }}>
                      #{sortedOverall.length - i}
                    </span>
                    {/* Mini robot icon */}
                    <svg width="24" height="24" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                      <rect x="6" y="4" width="12" height="10" rx="2" fill="#0a1628" stroke="#7c3aed" strokeWidth="1.5"/>
                      <circle cx="9" cy="9" r="1.5" fill="#7c3aed"/>
                      <circle cx="15" cy="9" r="1.5" fill="#00d4ff"/>
                      <rect x="8" y="14" width="8" height="7" rx="1" fill="#0a1628" stroke="#7c3aed" strokeWidth="1.5"/>
                      <rect x="4" y="15" width="3" height="5" rx="1" fill="#0a1628" stroke="#7c3aed" strokeWidth="1"/>
                      <rect x="17" y="15" width="3" height="5" rx="1" fill="#0a1628" stroke="#7c3aed" strokeWidth="1"/>
                    </svg>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{team.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{team.event_title}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 60, height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(team.score/10)*100}%`, background: 'linear-gradient(90deg, var(--accent2), var(--accent))', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontFamily: 'Orbitron', color: 'var(--accent)', fontWeight: 700, minWidth: 36 }}>{team.score}</span>
                    </div>
                  </div>
                ) : null
              ))}

              {/* FIRST PLACE — rocket animation */}
              {sortedOverall.length > 0 && (() => {
                const first = sortedOverall[sortedOverall.length - 1];
                return (
                  <div style={{ position: 'relative', marginTop: '0.5rem' }}>
                    {/* Rockets */}
                    {rocketLaunch && !firstPlaceLanded && (
                      <>
                        {/* Left rocket */}
                        <div className="rocket-left" style={{ position: 'absolute', left: -60, top: '50%', transform: 'translateY(-50%)', zIndex: 10, fontSize: '2rem' }}>
                          🚀
                          <div style={{ position: 'absolute', right: -8, top: '50%', transform: 'translateY(-50%) rotate(90deg)', animation: 'exhaustFlame 0.2s ease-in-out infinite' }}>
                            🔥
                          </div>
                        </div>
                        {/* Right rocket */}
                        <div className="rocket-right" style={{ position: 'absolute', right: -60, top: '50%', transform: 'translateY(-50%) scaleX(-1)', zIndex: 10, fontSize: '2rem' }}>
                          🚀
                          <div style={{ position: 'absolute', right: -8, top: '50%', transform: 'translateY(-50%) rotate(90deg)', animation: 'exhaustFlame 0.2s ease-in-out infinite 0.1s' }}>
                            🔥
                          </div>
                        </div>
                      </>
                    )}

                    {/* First place card */}
                    {revealed.includes(sortedOverall.length - 2) && (
                      <div className={rocketLaunch ? (firstPlaceLanded ? 'land-on-top gold-pulse' : 'lift-up') : ''} style={{
                        display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem',
                        background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,191,36,0.05))',
                        borderRadius: 12, border: '2px solid rgba(251,191,36,0.5)',
                        position: 'relative', overflow: 'hidden',
                      }}>
                        {/* Gold shimmer */}
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(251,191,36,0.1) 50%, transparent 100%)', animation: 'scanline 3s linear infinite' }} />

                        <span style={{ fontFamily: 'Orbitron', fontWeight: 900, fontSize: '1.5rem' }}>🥇</span>
                        {/* Champion robot */}
                        <svg width="32" height="32" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                          <rect x="5" y="3" width="14" height="11" rx="2" fill="#0a1628" stroke="#fbbf24" strokeWidth="1.5"/>
                          <circle cx="9" cy="8" r="2" fill="#fbbf24"/>
                          <circle cx="15" cy="8" r="2" fill="#fbbf24"/>
                          <circle cx="9" cy="8" r="0.8" fill="#000"/>
                          <circle cx="15" cy="8" r="0.8" fill="#000"/>
                          <rect x="8" y="14" width="8" height="7" rx="1" fill="#0a1628" stroke="#fbbf24" strokeWidth="1.5"/>
                          <rect x="3" y="15" width="4" height="5" rx="1" fill="#0a1628" stroke="#fbbf24" strokeWidth="1"/>
                          <rect x="17" y="15" width="4" height="5" rx="1" fill="#0a1628" stroke="#fbbf24" strokeWidth="1"/>
                          <line x1="12" y1="3" x2="12" y2="0" stroke="#fbbf24" strokeWidth="1.5"/>
                          <polygon points="12,0 10,3 14,3" fill="#fbbf24"/>
                        </svg>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: 'Orbitron', fontWeight: 900, fontSize: '1rem', color: '#fbbf24' }}>{first.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{first.event_title} • {first.members}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontFamily: 'Orbitron', fontSize: '1.75rem', color: '#fbbf24', fontWeight: 900 }}>{first.score}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/ 10</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Per event breakdown */}
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '4rem' }}>Loading...</div>
        ) : Object.keys(byEvent).length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏆</div>
            <h3>No scores yet</h3>
            <p>Scores will appear here once committee assigns them</p>
          </div>
        ) : (
          Object.values(byEvent).map((group, gi) => (
            <div key={gi} className="card fade-in" style={{ marginBottom: '1.5rem', animationDelay: `${gi * 0.1}s` }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
                <h2 style={{ fontFamily: 'Orbitron', fontSize: '1rem' }}>{group.title}</h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {new Date(group.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {group.teams.map((team, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.6rem 0.75rem', background: 'var(--bg)', borderRadius: 8 }}>
                    <span style={{ fontFamily: 'Orbitron', fontWeight: 700, minWidth: 28, fontSize: '0.9rem' }}
                      className={i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : ''}>
                      #{i + 1}
                    </span>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 600 }}>{team.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{team.members}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="score-bar" style={{ width: 80 }}>
                        <div className="score-fill" style={{ width: `${(team.score / 10) * 100}%` }} />
                      </div>
                      <span style={{ fontFamily: 'Orbitron', color: 'var(--accent)', fontWeight: 700, minWidth: 40, textAlign: 'right' }}>{team.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}