import React, { useState, useEffect } from 'react';
import { leaderboardAPI } from '../api';
import Navbar from '../components/Navbar';

export default function LeaderboardPage() {
  const [overall, setOverall] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    leaderboardAPI.overall().then(r => {
      setOverall(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Group by event
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
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem' }}>
        <div className="fade-in" style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--accent)', letterSpacing: '0.05em' }}>🏆 Club Leaderboard</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Overall performance across all events</p>
        </div>

        {/* Overall top performers */}
        {overall.length > 0 && (
          <div className="card fade-in-1" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(0,212,255,0.05))' }}>
            <h2 style={{ fontFamily: 'Orbitron', fontSize: '1rem', color: 'var(--accent2)', marginBottom: '1rem' }}>⚡ Top Teams Overall</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[...overall].sort((a, b) => b.score - a.score).slice(0, 5).map((team, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <span style={{ fontFamily: 'Orbitron', fontWeight: 900, minWidth: 32, fontSize: '1.1rem' }}
                    className={i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : ''}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{team.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{team.event_title} • {team.members}</div>
                  </div>
                  <span style={{ fontFamily: 'Orbitron', color: 'var(--accent)', fontWeight: 700 }}>{team.score}/10</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Per event */}
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
                      <span style={{ fontFamily: 'Orbitron', color: 'var(--accent)', fontWeight: 700, minWidth: 40, textAlign: 'right' }}>
                        {team.score}
                      </span>
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
