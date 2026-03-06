import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsAPI, teamsAPI, scoresAPI, leaderboardAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const SUPER_ADMIN_EMAIL = 'mallug@gmail.com';

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;

  const [event, setEvent] = useState(null);
  const [teams, setTeams] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [summary, setSummary] = useState(null);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [showEditTeamModal, setShowEditTeamModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [scoreTeam, setScoreTeam] = useState(null);
  const [editingTeam, setEditingTeam] = useState(null);
  const [teamForm, setTeamForm] = useState({ name: '', memberNames: [''] });
  const [editTeamForm, setEditTeamForm] = useState({ name: '', memberNames: [] });
  const [scoreForm, setScoreForm] = useState({ score: '', note: '' });
  const [bulkScores, setBulkScores] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tab, setTab] = useState('teams');
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [countdown, setCountdown] = useState('');

  const fetchAll = useCallback(async () => {
    try {
      const [evRes, teamsRes, lbRes] = await Promise.all([
        eventsAPI.getAll(),
        teamsAPI.getByEvent(id),
        leaderboardAPI.event(id),
      ]);
      const ev = evRes.data.find(e => e.id === parseInt(id));
      setEvent(ev);
      setTeams(teamsRes.data);
      setLeaderboard(lbRes.data);
    } catch (e) { console.error(e); }
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Countdown timer
  useEffect(() => {
    if (!event) return;
    const tick = () => {
      const now = new Date();
      const eventDate = new Date(event.date);
      const diff = eventDate - now;
      if (diff <= 0) { setCountdown('Event started!'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setCountdown(d > 0 ? `${d}d ${h}h ${m}m` : h > 0 ? `${h}h ${m}m` : `${m}m`);
    };
    tick();
    const t = setInterval(tick, 60000);
    return () => clearInterval(t);
  }, [event]);

  const showMsg = (msg, isError = false) => {
    if (isError) setError(msg); else setSuccess(msg);
    setTimeout(() => { setError(''); setSuccess(''); }, 4000);
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
    const filledNames = teamForm.memberNames.filter(m => m.trim() !== '');
    if (filledNames.length < 1) return setError('Add at least 1 more member name (min 2 including you)');
    if (filledNames.length > 3) return setError('Maximum 3 additional members (4 total including you)');
    setSubmitting(true);
    try {
      await teamsAPI.create(id, { name: teamForm.name, memberNames: filledNames });
      setShowTeamModal(false);
      setTeamForm({ name: '', memberNames: [''] });
      setRegistered(true);
      fetchAll();
    } catch (err) { setError(err.response?.data?.error || 'Registration failed'); }
    setSubmitting(false);
  };

  const handleEditTeam = async (e) => {
    e.preventDefault();
    try {
      const extra = editTeamForm.memberNames.filter(m => m.trim());
      await teamsAPI.update(editingTeam.id, { name: editTeamForm.name, memberNames: extra });
      setShowEditTeamModal(false);
      showMsg('✅ Team updated!');
      fetchAll();
    } catch (err) { showMsg(err.response?.data?.error || 'Update failed', true); }
  };

  const handleAssignScore = async (e) => {
    e.preventDefault(); setError('');
    try {
      await scoresAPI.assign({ teamId: scoreTeam.id, eventId: parseInt(id), score: parseFloat(scoreForm.score), note: scoreForm.note });
      setShowScoreModal(false);
      setScoreForm({ score: '', note: '' });
      showMsg('✅ Score assigned!');
      fetchAll();
    } catch (err) { setError(err.response?.data?.error || 'Error'); }
  };

  const handleBulkScore = async () => {
    try {
      await scoresAPI.bulk(bulkScores.map(b => ({ teamId: b.id, eventId: parseInt(id), score: b.score, note: b.note || '' })));
      setShowBulkModal(false);
      showMsg('✅ All scores saved!');
      fetchAll();
    } catch (err) { showMsg('Error saving scores', true); }
  };

  const openBulkScores = () => {
    setBulkScores(teams.map(t => ({ id: t.id, name: t.name, score: t.score ?? '', note: '' })));
    setShowBulkModal(true);
  };

  const openSummary = async () => {
    try {
      const res = await eventsAPI.summary(id);
      setSummary(res.data);
      setShowSummaryModal(true);
    } catch (e) { showMsg('Error loading summary', true); }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm('Delete this team?')) return;
    await teamsAPI.delete(teamId);
    fetchAll();
  };

  const openEditTeam = (team) => {
    const members = (team.member_names || '').split('|').filter(Boolean);
    const allExceptFirst = members.slice(1);
    setEditingTeam(team);
    setEditTeamForm({ name: team.name, memberNames: allExceptFirst.length ? allExceptFirst : [''] });
    setShowEditTeamModal(true);
  };

  const isDeadlinePassed = event?.registration_deadline && new Date(event.registration_deadline) < new Date();
  const userTeam = teams.find(t => t.created_by === user?.id);

  if (!event) return (<><Navbar /><div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Loading...</div></>);

  const statusColor = { upcoming: 'cyan', active: 'green', completed: 'purple' };

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem' }}>

        {success && <div className="alert alert-success fade-in">{success}</div>}
        {error && <div className="alert alert-error fade-in">{error}</div>}

        {/* Registration success screen */}
        {registered && (
          <div className="card fade-in" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(5,150,105,0.08), rgba(0,102,204,0.05))', border: '1px solid rgba(5,150,105,0.3)', textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎉</div>
            <h2 style={{ fontFamily: 'Orbitron', color: '#047857', fontSize: '1.1rem', marginBottom: '0.5rem' }}>You're Registered!</h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Your team has been successfully registered for <strong>{event.title}</strong>.</p>
            <button className="btn btn-secondary" style={{ marginTop: '1rem', fontSize: '0.8rem' }} onClick={() => setRegistered(false)}>Got it</button>
          </div>
        )}

        <button onClick={() => navigate('/events')} className="btn btn-secondary" style={{ marginBottom: '1.5rem', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>← Back</button>

        {/* Event header */}
        <div className="card fade-in" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                <span className={`badge badge-${statusColor[event.status] || 'cyan'}`}>{event.status}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  {new Date(event.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                {isDeadlinePassed
                  ? <span style={{ fontSize: '0.75rem', color: 'var(--danger)', background: 'rgba(220,38,38,0.08)', padding: '0.15rem 0.5rem', borderRadius: 6 }}>🔒 Reg. Closed</span>
                  : event.registration_deadline
                  ? <span style={{ fontSize: '0.75rem', color: '#d97706', background: 'rgba(217,119,6,0.08)', padding: '0.15rem 0.5rem', borderRadius: 6 }}>⏰ Reg. until {new Date(event.registration_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  : null
                }
              </div>
              <h1 style={{ fontSize: '1.75rem', fontFamily: 'Orbitron', marginBottom: '0.5rem', color: 'var(--text)' }}>{event.title}</h1>
              {event.description && <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 640, fontSize: '0.9rem' }}>{event.description}</p>}
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                {event.venue && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>📍 {event.venue}</span>}
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>👥 {teams.length} teams</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>👤 {teams.reduce((a, t) => a + ((t.member_names || '').split('|').filter(Boolean).length), 0)} participants</span>
              </div>
            </div>

            {/* Countdown */}
            {event.status !== 'completed' && countdown && (
              <div style={{ textAlign: 'center', background: 'rgba(0,102,204,0.06)', border: '1px solid rgba(0,102,204,0.15)', borderRadius: 12, padding: '1rem 1.5rem', flexShrink: 0 }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>Event In</div>
                <div style={{ fontFamily: 'Orbitron', fontSize: '1.3rem', color: 'var(--accent)', fontWeight: 700 }}>{countdown}</div>
              </div>
            )}
          </div>

          {/* Admin actions */}
          {isAdmin && (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
              <button className="btn btn-purple" style={{ fontSize: '0.78rem' }} onClick={openBulkScores}>📊 Bulk Scores</button>
              <button className="btn btn-secondary" style={{ fontSize: '0.78rem' }} onClick={openSummary}>📋 Event Summary</button>
              <a className="btn btn-secondary" style={{ fontSize: '0.78rem', textDecoration: 'none' }}
                href={`${eventsAPI.exportCSV(id)}?token=${localStorage.getItem('token')}`} download>
                ⬇️ Export CSV
              </a>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
          {['teams', 'leaderboard'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '0.5rem 1.25rem', border: 'none', borderRadius: 8, cursor: 'pointer',
              fontFamily: 'Inter', fontWeight: 600, fontSize: '0.875rem',
              background: tab === t ? 'var(--bg)' : 'transparent',
              color: tab === t ? 'var(--accent)' : 'var(--text-muted)',
              transition: 'all 0.2s',
            }}>{t === 'leaderboard' ? '🏆 Leaderboard' : '👥 Teams'}</button>
          ))}
        </div>

        {/* Teams tab */}
        {tab === 'teams' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Teams can have 2–4 members</p>
              {!isAdmin && !userTeam && !isDeadlinePassed && event.status !== 'completed' && (
                <button className="btn btn-primary" onClick={() => { setShowTeamModal(true); setError(''); }}>+ Register Team</button>
              )}
              {userTeam && !isAdmin && (
                <span style={{ fontSize: '0.85rem', color: '#047857', background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.2)', padding: '0.3rem 0.75rem', borderRadius: 8 }}>
                  ✅ You're registered: <strong>{userTeam.name}</strong>
                </span>
              )}
            </div>

            {teams.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">👥</div><h3>No teams yet</h3><p>{isAdmin ? 'Waiting for teams to register!' : 'Be the first!'}</p></div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {teams.map((team, i) => (
                  <div key={team.id} className="card fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <h3 style={{ fontFamily: 'Orbitron', fontSize: '0.9rem', color: 'var(--text)' }}>{team.name}</h3>
                      {team.score != null && <span style={{ fontFamily: 'Orbitron', fontSize: '1rem', color: 'var(--accent)', fontWeight: 700 }}>{team.score}/10</span>}
                    </div>
                    {team.score != null && <div className="score-bar"><div className="score-fill" style={{ width: `${(team.score/10)*100}%` }} /></div>}
                    <div style={{ marginTop: '0.75rem' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Members:</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                        {(team.member_names || '').split('|').filter(Boolean).map((name, j) => (
                          <span key={j} className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>{name}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
                      {(isAdmin || isSuperAdmin || team.created_by === user?.id) && (
                        <button className="btn btn-secondary" style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }} onClick={() => openEditTeam(team)}>✏️ Edit</button>
                      )}
                      {isAdmin && (
                        <button className="btn btn-purple" style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}
                          onClick={() => { setScoreTeam(team); setScoreForm({ score: team.score ?? '', note: '' }); setShowScoreModal(true); }}>
                          🎯 Score
                        </button>
                      )}
                      {(isAdmin || team.created_by === user?.id) && (
                        <button className="btn btn-danger" style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }} onClick={() => handleDeleteTeam(team.id)}>🗑</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Leaderboard tab */}
        {tab === 'leaderboard' && (
          <div className="fade-in">
            {leaderboard.filter(t => t.score != null).length === 0 ? (
              <div className="empty-state"><div className="empty-icon">🏆</div><h3>No scores yet</h3><p>Scores will appear once assigned</p></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {leaderboard.filter(t => t.score != null).map((team, i) => (
                  <div key={team.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: '1.4rem', fontFamily: 'Orbitron', fontWeight: 900, minWidth: 36 }}
                      className={i===0?'rank-1':i===1?'rank-2':i===2?'rank-3':''}>
                      {i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}
                    </div>
                    <div style={{ flex: 1, minWidth: 140 }}>
                      <div style={{ fontFamily: 'Orbitron', fontWeight: 700, marginBottom: '0.25rem', fontSize: '0.9rem' }}>{team.name}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {(team.members || '').split(', ').map((m, j) => <span key={j} className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>{m}</span>)}
                      </div>
                      {team.note && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontStyle: 'italic' }}>"{team.note}"</div>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'Orbitron', fontSize: '1.5rem', color: i===0?'#fbbf24':'var(--accent)', fontWeight: 900 }}>{team.score}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/ 10</div>
                      <div className="score-bar" style={{ width: 80, marginLeft: 'auto', marginTop: '0.4rem' }}>
                        <div className="score-fill" style={{ width: `${(team.score/10)*100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Register team modal */}
      {showTeamModal && (
        <div className="modal-overlay" onClick={() => setShowTeamModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'Orbitron', fontSize: '1rem', color: 'var(--accent)', marginBottom: '0.5rem' }}>Register Your Team</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>You're automatically added as Member 1.</p>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleCreateTeam} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="label">Team Name *</label>
                <input className="input" placeholder="e.g. Team Nexus" value={teamForm.name} onChange={e => setTeamForm({...teamForm, name: e.target.value})} required />
              </div>
              <div>
                <label className="label">Member 1 (You)</label>
                <input className="input" value={user.name} disabled style={{ opacity: 0.5 }} />
              </div>
              {teamForm.memberNames.map((name, index) => (
                <div key={index}>
                  <label className="label">Member {index + 2}</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input className="input" placeholder="Teammate name" value={name} onChange={e => { const u = [...teamForm.memberNames]; u[index] = e.target.value; setTeamForm({...teamForm, memberNames: u}); }} />
                    {teamForm.memberNames.length > 1 && (
                      <button type="button" className="btn btn-danger" style={{ padding: '0.5rem 0.75rem', flexShrink: 0 }}
                        onClick={() => setTeamForm({...teamForm, memberNames: teamForm.memberNames.filter((_,i) => i !== index)})}>✕</button>
                    )}
                  </div>
                </div>
              ))}
              {teamForm.memberNames.length < 3 && (
                <button type="button" className="btn btn-secondary" style={{ fontSize: '0.8rem' }}
                  onClick={() => setTeamForm({...teamForm, memberNames: [...teamForm.memberNames, '']})}>+ Add Member</button>
              )}
              <div style={{ fontSize: '0.8rem', color: 'var(--accent3)', background: 'var(--bg)', borderRadius: 8, padding: '0.5rem 0.75rem' }}>
                Team size: {teamForm.memberNames.filter(m=>m.trim()).length + 1}/4
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTeamModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ marginLeft: 'auto' }} disabled={submitting}>
                  {submitting ? 'Registering...' : 'Register Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit team modal */}
      {showEditTeamModal && editingTeam && (
        <div className="modal-overlay" onClick={() => setShowEditTeamModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'Orbitron', fontSize: '1rem', color: 'var(--accent)', marginBottom: '1.5rem' }}>✏️ Edit Team</h2>
            <form onSubmit={handleEditTeam} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="label">Team Name</label>
                <input className="input" value={editTeamForm.name} onChange={e => setEditTeamForm({...editTeamForm, name: e.target.value})} required />
              </div>
              {editTeamForm.memberNames.map((name, i) => (
                <div key={i}>
                  <label className="label">Member {i + 2}</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input className="input" value={name} onChange={e => { const u = [...editTeamForm.memberNames]; u[i] = e.target.value; setEditTeamForm({...editTeamForm, memberNames: u}); }} />
                    <button type="button" className="btn btn-danger" style={{ padding: '0.5rem 0.75rem', flexShrink: 0 }}
                      onClick={() => setEditTeamForm({...editTeamForm, memberNames: editTeamForm.memberNames.filter((_,j) => j !== i)})}>✕</button>
                  </div>
                </div>
              ))}
              {editTeamForm.memberNames.length < 3 && (
                <button type="button" className="btn btn-secondary" style={{ fontSize: '0.8rem' }}
                  onClick={() => setEditTeamForm({...editTeamForm, memberNames: [...editTeamForm.memberNames, '']})}>+ Add Member</button>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditTeamModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ marginLeft: 'auto' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Score modal */}
      {showScoreModal && scoreTeam && (
        <div className="modal-overlay" onClick={() => setShowScoreModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'Orbitron', fontSize: '1rem', color: 'var(--accent)', marginBottom: '0.5rem' }}>🎯 Assign Score</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Team: <strong>{scoreTeam.name}</strong></p>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleAssignScore} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="label">Score (0–10) *</label>
                <input className="input" type="number" min="0" max="10" step="0.1" placeholder="8.5"
                  value={scoreForm.score} onChange={e => setScoreForm({...scoreForm, score: e.target.value})} required />
              </div>
              <div>
                <label className="label">Feedback / Note</label>
                <textarea className="input" placeholder="Great teamwork!" value={scoreForm.note}
                  onChange={e => setScoreForm({...scoreForm, note: e.target.value})} style={{ minHeight: 70, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowScoreModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-purple" style={{ marginLeft: 'auto' }}>Assign Score</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk scores modal */}
      {showBulkModal && (
        <div className="modal-overlay" onClick={() => setShowBulkModal(false)}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'Orbitron', fontSize: '1rem', color: 'var(--accent)', marginBottom: '0.5rem' }}>📊 Bulk Score Entry</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>Enter scores for all teams at once</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: 400, overflowY: 'auto' }}>
              {bulkScores.map((bs, i) => (
                <div key={bs.id} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 1fr', gap: '0.5rem', alignItems: 'center', padding: '0.75rem', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{bs.name}</div>
                  <input className="input" type="number" min="0" max="10" step="0.1" placeholder="Score"
                    style={{ textAlign: 'center', padding: '0.5rem' }}
                    value={bs.score}
                    onChange={e => { const u = [...bulkScores]; u[i].score = e.target.value; setBulkScores(u); }} />
                  <input className="input" placeholder="Note (optional)" style={{ padding: '0.5rem', fontSize: '0.8rem' }}
                    value={bs.note}
                    onChange={e => { const u = [...bulkScores]; u[i].note = e.target.value; setBulkScores(u); }} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowBulkModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={handleBulkScore}>💾 Save All Scores</button>
            </div>
          </div>
        </div>
      )}

      {/* Event summary modal */}
      {showSummaryModal && summary && (
        <div className="modal-overlay" onClick={() => setShowSummaryModal(false)}>
          <div className="modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'Orbitron', fontSize: '1rem', color: 'var(--accent)', marginBottom: '1.5rem' }}>📋 Event Summary</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'Total Teams', value: summary.totalTeams },
                { label: 'Participants', value: summary.totalParticipants },
                { label: 'Avg Score', value: summary.avgScore || '—' },
              ].map((s, i) => (
                <div key={i} style={{ background: 'var(--bg)', borderRadius: 10, padding: '1rem', textAlign: 'center', border: '1px solid var(--border)' }}>
                  <div style={{ fontFamily: 'Orbitron', fontSize: '1.5rem', color: 'var(--accent)', fontWeight: 700 }}>{s.value}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{s.label}</div>
                </div>
              ))}
            </div>
            {summary.winner && (
              <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 10, padding: '1rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🏆</div>
                <div style={{ fontFamily: 'Orbitron', color: '#d97706', fontWeight: 700 }}>Winner: {summary.winner.team_name}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Score: {summary.winner.score}/10</div>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 240, overflowY: 'auto' }}>
              {summary.teams.map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.75rem', background: 'var(--bg)', borderRadius: 8 }}>
                  <span style={{ fontFamily: 'Orbitron', fontSize: '0.8rem', minWidth: 28 }}>{i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{t.team_name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t.members}</div>
                  </div>
                  <span style={{ fontFamily: 'Orbitron', color: 'var(--accent)', fontWeight: 700, fontSize: '0.9rem' }}>{t.score != null ? `${t.score}/10` : '—'}</span>
                </div>
              ))}
            </div>
            <button className="btn btn-secondary" style={{ marginTop: '1.5rem', width: '100%', justifyContent: 'center' }} onClick={() => setShowSummaryModal(false)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}