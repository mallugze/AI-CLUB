import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsAPI, teamsAPI, scoresAPI, leaderboardAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [event, setEvent] = useState(null);
  const [teams, setTeams] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [scoreTeam, setScoreTeam] = useState(null);
  const [teamForm, setTeamForm] = useState({ name: '', memberNames: [''] });
  const [scoreForm, setScoreForm] = useState({ score: '', note: '' });
  const [error, setError] = useState('');
  const [tab, setTab] = useState('teams');
  const [historyTeam, setHistoryTeam] = useState(null);
  const [teamHistory, setTeamHistory] = useState([]);

  const fetchAll = useCallback(async () => {
    try {
      const [evRes, teamsRes, lbRes] = await Promise.all([
        eventsAPI.getAll(),
        teamsAPI.getByEvent(id),
        leaderboardAPI.event(id),
      ]);
      setEvent(evRes.data.find(e => e.id === parseInt(id)));
      setTeams(teamsRes.data);
      setLeaderboard(lbRes.data);
    } catch (e) { console.error(e); }
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setError('');
    const filledNames = teamForm.memberNames.filter(m => m.trim() !== '');
    if (filledNames.length < 1) return setError('Add at least 1 more member name (min 2 including you)');
    if (filledNames.length > 3) return setError('Maximum 3 additional members (4 total including you)');
    try {
      await teamsAPI.create(id, { name: teamForm.name, memberNames: filledNames });
      setShowTeamModal(false);
      setTeamForm({ name: '', memberNames: [''] });
      fetchAll();
    } catch (err) { setError(err.response?.data?.error || 'Error'); }
  };

  const handleAssignScore = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await scoresAPI.assign({ teamId: scoreTeam.id, eventId: parseInt(id), score: parseFloat(scoreForm.score), note: scoreForm.note });
      setShowScoreModal(false);
      setScoreForm({ score: '', note: '' });
      fetchAll();
    } catch (err) { setError(err.response?.data?.error || 'Error'); }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm('Delete this team?')) return;
    await teamsAPI.delete(teamId);
    fetchAll();
  };

  const loadTeamHistory = async (team) => {
    const res = await leaderboardAPI.teamHistory(team.id);
    setTeamHistory(res.data);
    setHistoryTeam(team);
  };

  const addMemberField = () => {
    if (teamForm.memberNames.length < 3) {
      setTeamForm(prev => ({ ...prev, memberNames: [...prev.memberNames, ''] }));
    }
  };

  const removeMemberField = (index) => {
    setTeamForm(prev => ({ ...prev, memberNames: prev.memberNames.filter((_, i) => i !== index) }));
  };

  const updateMemberName = (index, value) => {
    setTeamForm(prev => {
      const updated = [...prev.memberNames];
      updated[index] = value;
      return { ...prev, memberNames: updated };
    });
  };

  const filledCount = teamForm.memberNames.filter(m => m.trim() !== '').length;
  const totalMembers = filledCount + 1;

  if (!event) return (
    <>
      <Navbar />
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Loading...</div>
    </>
  );

  const statusColor = { upcoming: 'cyan', active: 'green', completed: 'purple' };

  return (
    <>
      <Navbar />
      <div className="scanline" />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>
        <button onClick={() => navigate('/events')} className="btn btn-secondary" style={{ marginBottom: '1.5rem', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
          ← Back to Events
        </button>

        <div className="card fade-in" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%)' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
          <div className="flex items-center gap-2" style={{ marginBottom: '0.75rem' }}>
            <span className={`badge badge-${statusColor[event.status] || 'cyan'}`}>{event.status}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {new Date(event.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <h1 style={{ fontSize: '2rem', fontFamily: 'Orbitron', marginBottom: '0.75rem' }}>{event.title}</h1>
          {event.description && <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 700 }}>{event.description}</p>}
          <div className="flex gap-2" style={{ marginTop: '1rem', flexWrap: 'wrap' }}>
            {event.venue && <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>📍 {event.venue}</span>}
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>👥 {teams.length} teams registered</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
          {['teams', 'leaderboard'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '0.5rem 1.5rem', border: 'none', borderRadius: 8, cursor: 'pointer',
              fontFamily: 'Exo 2', fontWeight: 600, fontSize: '0.875rem',
              background: tab === t ? 'var(--surface2)' : 'transparent',
              color: tab === t ? 'var(--accent)' : 'var(--text-muted)',
              transition: 'all 0.2s',
            }}>{t === 'leaderboard' ? '🏆 Leaderboard' : '👥 Teams'}</button>
          ))}
        </div>

        {tab === 'teams' && (
          <>
            <div className="flex items-center justify-between fade-in" style={{ marginBottom: '1rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Teams can have 2–4 members</p>
              {!isAdmin && (
                <button className="btn btn-primary" onClick={() => { setShowTeamModal(true); setError(''); }}>
                  + Register Team
                </button>
              )}
            </div>

            {teams.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h3>No teams yet</h3>
                <p>{isAdmin ? 'Waiting for members to register teams!' : 'Be the first to register a team!'}</p>
              </div>
            ) : (
              <div className="grid-2">
                {teams.map((team, i) => (
                  <div key={team.id} className="card fade-in" style={{ animationDelay: `${i * 0.06}s` }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: '0.75rem' }}>
                      <h3 style={{ fontFamily: 'Orbitron', fontSize: '1rem' }}>{team.name}</h3>
                      {team.score != null && (
                        <span style={{ fontFamily: 'Orbitron', fontSize: '1.1rem', color: 'var(--accent)', fontWeight: 700 }}>{team.score}/10</span>
                      )}
                    </div>
                    {team.score != null && (
                      <div className="score-bar"><div className="score-fill" style={{ width: `${(team.score / 10) * 100}%` }} /></div>
                    )}
                    <div style={{ marginTop: '0.75rem' }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Members:</p>
                      <div className="flex flex-wrap gap-1">
                        {(team.member_names || '').split('|').filter(Boolean).map((name, j) => (
                          <span key={j} className="badge badge-cyan">{name}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-1" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                      <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem' }} onClick={() => loadTeamHistory(team)}>History</button>
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                        {isAdmin && (
                          <button className="btn btn-purple" style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem' }}
                            onClick={() => { setScoreTeam(team); setScoreForm({ score: team.score ?? '', note: '' }); setShowScoreModal(true); }}>
                            Score
                          </button>
                        )}
                        {(isAdmin || team.created_by === user.id) && (
                          <button className="btn btn-danger" style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem' }} onClick={() => handleDeleteTeam(team.id)}>Delete</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'leaderboard' && (
          <div className="fade-in">
            {leaderboard.filter(t => t.score != null).length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🏆</div>
                <h3>No scores yet</h3>
                <p>Scores will appear here once assigned by the committee</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {leaderboard.filter(t => t.score != null).map((team, i) => (
                  <div key={team.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1rem 1.5rem' }}>
                    <div style={{ fontSize: '1.5rem', fontFamily: 'Orbitron', fontWeight: 900, minWidth: 40, textAlign: 'center' }}
                      className={i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : ''}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'Orbitron', fontWeight: 700, marginBottom: '0.25rem' }}>{team.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {(team.members || '').split(', ').map((m, j) => (
                          <span key={j} className="badge badge-cyan" style={{ marginRight: '0.25rem' }}>{m}</span>
                        ))}
                      </div>
                      {team.note && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontStyle: 'italic' }}>"{team.note}"</div>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'Orbitron', fontSize: '1.5rem', color: i === 0 ? '#fbbf24' : 'var(--accent)', fontWeight: 900 }}>{team.score}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/ 10</div>
                      <div className="score-bar" style={{ width: 80, marginLeft: 'auto', marginTop: '0.5rem' }}>
                        <div className="score-fill" style={{ width: `${(team.score / 10) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showTeamModal && (
        <div className="modal-overlay" onClick={() => setShowTeamModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'Orbitron', fontSize: '1rem', color: 'var(--accent)', marginBottom: '0.5rem' }}>Register Your Team</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
              You are automatically added. Type in your teammates' names below.
            </p>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleCreateTeam} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="label">Team Name *</label>
                <input className="input" placeholder="e.g. Team Nexus" value={teamForm.name}
                  onChange={e => setTeamForm({ ...teamForm, name: e.target.value })} required />
              </div>

              <div>
                <label className="label">Member 1 (You)</label>
                <input className="input" value={user.name} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
              </div>

              {teamForm.memberNames.map((name, index) => (
                <div key={index}>
                  <label className="label">Member {index + 2}</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input className="input" placeholder={`Teammate name`}
                      value={name} onChange={e => updateMemberName(index, e.target.value)} />
                    {teamForm.memberNames.length > 1 && (
                      <button type="button" className="btn btn-danger" style={{ padding: '0.5rem 0.75rem', flexShrink: 0 }}
                        onClick={() => removeMemberField(index)}>✕</button>
                    )}
                  </div>
                </div>
              ))}

              {teamForm.memberNames.length < 3 && (
                <button type="button" className="btn btn-secondary" onClick={addMemberField} style={{ fontSize: '0.8rem' }}>
                  + Add Another Member
                </button>
              )}

              <div style={{ fontSize: '0.8rem', color: totalMembers >= 2 ? 'var(--accent3)' : 'var(--text-muted)', background: 'var(--bg)', borderRadius: 8, padding: '0.5rem 0.75rem' }}>
                Team size: {totalMembers}/4 {totalMembers < 2 ? '— need at least 2' : '✓ Good to go!'}
              </div>

              <div className="flex gap-1" style={{ marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTeamModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ marginLeft: 'auto' }}>Register Team</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showScoreModal && scoreTeam && (
        <div className="modal-overlay" onClick={() => setShowScoreModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'Orbitron', fontSize: '1rem', color: 'var(--accent)', marginBottom: '0.5rem' }}>Assign Score</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Team: {scoreTeam.name}</p>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleAssignScore} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="label">Score (0–10) *</label>
                <input className="input" type="number" min="0" max="10" step="0.1" placeholder="8.5"
                  value={scoreForm.score} onChange={e => setScoreForm({ ...scoreForm, score: e.target.value })} required />
              </div>
              <div>
                <label className="label">Note / Feedback</label>
                <textarea className="input" placeholder="Great teamwork!" value={scoreForm.note}
                  onChange={e => setScoreForm({ ...scoreForm, note: e.target.value })}
                  style={{ minHeight: 70, resize: 'vertical' }} />
              </div>
              <div className="flex gap-1" style={{ marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowScoreModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-purple" style={{ marginLeft: 'auto' }}>Assign Score</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {historyTeam && (
        <div className="modal-overlay" onClick={() => setHistoryTeam(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'Orbitron', fontSize: '1rem', color: 'var(--accent)', marginBottom: '0.25rem' }}>Team History</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>{historyTeam.name}</p>
            {teamHistory.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No scores recorded yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {teamHistory.map((h, i) => (
                  <div key={i} style={{ background: 'var(--bg)', borderRadius: 10, padding: '1rem', border: '1px solid var(--border)' }}>
                    <div className="flex items-center justify-between">
                      <span style={{ fontWeight: 600 }}>{h.event_title}</span>
                      <span style={{ fontFamily: 'Orbitron', color: 'var(--accent)', fontWeight: 700 }}>{h.score}/10</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      {new Date(h.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    {h.note && <div style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--text-muted)', marginTop: '0.5rem' }}>"{h.note}"</div>}
                    <div className="score-bar" style={{ marginTop: '0.75rem' }}>
                      <div className="score-fill" style={{ width: `${(h.score / 10) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button className="btn btn-secondary" style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }} onClick={() => setHistoryTeam(null)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}