import React, { useState, useEffect, useRef } from 'react';
import { leaderboardAPI } from '../api';
import Navbar from '../components/Navbar';

export default function LeaderboardPage() {
  const [overall, setOverall] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revealedCount, setRevealedCount] = useState(0);
  const [rocketLaunch, setRocketLaunch] = useState(false);
  const [firstLanded, setFirstLanded] = useState(false);
  const timerRef = useRef([]);

  useEffect(() => {
    leaderboardAPI.overall().then(r => {
      setOverall(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // overall is already sorted highest first from backend
  // We want to show: last place first, then 2nd last... then 2nd place
  // Then 1st rockets up
  useEffect(() => {
    if (!loading && overall.length > 0) {
      const nonFirst = overall.slice(1); // 2nd place onwards (index 1,2,3...)
      // Reveal from last place going up to 2nd place
      nonFirst.forEach((_, i) => {
        const t = setTimeout(() => {
          setRevealedCount(prev => prev + 1);
        }, (nonFirst.length - i) * 600); // reverse order timing: last revealed first
        timerRef.current.push(t);
      });

      // After all non-first revealed, launch rockets
      const totalDelay = nonFirst.length * 600 + 500;
      const t2 = setTimeout(() => setRocketLaunch(true), totalDelay);
      const t3 = setTimeout(() => setFirstLanded(true), totalDelay + 2000);
      timerRef.current.push(t2, t3);
    }
    return () => timerRef.current.forEach(clearTimeout);
  }, [loading, overall]);

  // overall[0] = 1st place (highest score)
  // overall[1] = 2nd place
  // overall[n] = last place
  // We want to display in order: 2nd, 3rd, 4th... (visually top to bottom)
  // But reveal them from last→2nd
  // So display array = overall.slice(1) in normal order (2nd, 3rd, 4th...)
  // But reveal from bottom: last item revealed first, then second-last, etc.

  const nonFirstTeams = overall.slice(1); // [2nd, 3rd, 4th, ...]
  const firstPlace = overall[0];

  // Which teams to show: we reveal from last index going up
  // revealedCount=1 means last team shown, revealedCount=2 means last two shown, etc.
  const visibleNonFirst = nonFirstTeams.filter((_, i) => {
    // i=0 is 2nd place, i=last is last place
    // Show from last: index >= nonFirstTeams.length - revealedCount
    return i >= nonFirstTeams.length - revealedCount;
  });

  const byEvent = overall.reduce((acc, item) => {
    const key = item.event_title;
    if (!acc[key]) acc[key] = { title: key, date: item.event_date, teams: [] };
    acc[key].teams.push(item);
    return acc;
  }, {});

  return (
    <>
      <Navbar />
      <div className="scanline" />
      <style>{`
        @keyframes stackIn {
          0% { opacity: 0; transform: translateX(-80px) scale(0.88); }
          65% { transform: translateX(6px) scale(1.02); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes rocketFromLeft {
          0% { transform: translate(-300px, 120px) rotate(-25deg); opacity: 0; }
          20% { opacity: 1; }
          75% { transform: translate(-15px, -5px) rotate(-3deg); }
          100% { transform: translate(0px, 0px) rotate(0deg); opacity: 1; }
        }
        @keyframes rocketFromRight {
          0% { transform: translate(300px, 120px) rotate(25deg) scaleX(-1); opacity: 0; }
          20% { opacity: 1; }
          75% { transform: translate(15px, -5px) rotate(3deg) scaleX(-1); }
          100% { transform: translate(0px, 0px) rotate(0deg) scaleX(-1); opacity: 1; }
        }
        @keyframes riseFromBottom {
          0% { opacity: 0; transform: translateY(300px) scale(0.9); }
          50% { opacity: 1; transform: translateY(-25px) scale(1.03); }
          70% { transform: translateY(8px) scale(0.99); }
          85% { transform: translateY(-5px) scale(1.01); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes goldShine {
          0%,100% { box-shadow: 0 0 20px rgba(251,191,36,0.3), 0 0 40px rgba(251,191,36,0.1); }
          50% { box-shadow: 0 0 50px rgba(251,191,36,0.8), 0 0 100px rgba(251,191,36,0.3); }
        }
        @keyframes exhaustFlame {
          0%,100% { transform: scaleY(1); opacity: 0.9; }
          50% { transform: scaleY(1.5) scaleX(0.7); opacity: 0.5; }
        }
        @keyframes dotBlink {
          0%,100% { opacity: 0.2; } 50% { opacity: 1; }
        }
        .stack-in { animation: stackIn 0.65s cubic-bezier(0.34,1.3,0.64,1) both; }
        .rocket-left { animation: rocketFromLeft 2s cubic-bezier(0.25,0.46,0.45,0.94) both; }
        .rocket-right { animation: rocketFromRight 2s cubic-bezier(0.25,0.46,0.45,0.94) both; }
        .rise-up { animation: riseFromBottom 2s cubic-bezier(0.34,1.1,0.64,1) both; }
        .gold-shine { animation: goldShine 2.5s ease-in-out infinite; }
        .flame { animation: exhaustFlame 0.15s ease-in-out infinite; }
      `}</style>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem' }}>
        <div style={{ marginBottom: '2rem', animation: 'fadeInUp 0.5s ease both' }}>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--accent)', letterSpacing: '0.05em' }}>🏆 Club Leaderboard</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Overall performance across all events</p>
        </div>

        {overall.length > 0 && (
          <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(0,212,255,0.04))', overflow: 'visible', padding: '1.5rem' }}>
            <h2 style={{ fontFamily: 'Orbitron', fontSize: '1rem', color: 'var(--accent2)', marginBottom: '1.5rem' }}>⚡ Rankings</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', position: 'relative' }}>

              {/* 1ST PLACE — appears last, rises from bottom with rockets */}
              {rocketLaunch && firstPlace && (
                <div style={{ position: 'relative', marginBottom: '0.4rem' }}>


                  {/* First place card */}
                  <div className={`rise-up ${firstLanded ? 'gold-shine' : ''}`} style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '1rem 1.25rem',
                    background: 'linear-gradient(135deg, rgba(251,191,36,0.18), rgba(251,191,36,0.06))',
                    borderRadius: 14, border: '2px solid rgba(251,191,36,0.6)',
                    position: 'relative', overflow: 'hidden',
                  }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(251,191,36,0.07), transparent)', backgroundSize: '200% 100%', animation: 'shimmer 2s linear infinite' }} />
                    <span style={{ fontSize: '1.75rem' }}>🥇</span>
                    <svg width="34" height="34" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
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
                      <div style={{ fontFamily: 'Orbitron', fontWeight: 900, fontSize: '1rem', color: '#fbbf24' }}>{firstPlace.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{firstPlace.event_title} • {firstPlace.members}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'Orbitron', fontSize: '2rem', color: '#fbbf24', fontWeight: 900, lineHeight: 1 }}>{firstPlace.score}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/ 10</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2ND, 3RD... revealed from bottom upwards */}
              {visibleNonFirst.map((team, i) => {
                const actualRank = overall.indexOf(team) + 1; // 2, 3, 4...
                const rankIcon = actualRank === 2 ? '🥈' : actualRank === 3 ? '🥉' : `#${actualRank}`;
                return (
                  <div key={team.name + i} className="stack-in" style={{ animationDelay: '0s', display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', background: 'var(--bg)', borderRadius: 10, border: `1px solid ${actualRank === 2 ? 'rgba(148,163,184,0.4)' : 'var(--border)'}` }}>
                    <span style={{ fontFamily: 'Orbitron', fontWeight: 900, minWidth: 32, fontSize: actualRank <= 3 ? '1.2rem' : '0.9rem' }}>
                      {rankIcon}
                    </span>
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
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{team.event_title} • {team.members}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 70, height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(team.score / 10) * 100}%`, background: 'linear-gradient(90deg, var(--accent2), var(--accent))', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontFamily: 'Orbitron', color: 'var(--accent)', fontWeight: 700, minWidth: 36, textAlign: 'right' }}>{team.score}</span>
                    </div>
                  </div>
                );
              })}
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
            <p>Scores will appear once the committee assigns them</p>
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
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
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