import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsAPI, announcementsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import logoBase64 from '../logo';

const SUPER_ADMIN_EMAIL = 'mallug@gmail.com';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', date: '', venue: '', status: 'upcoming', registration_deadline: '' });
  const [annForm, setAnnForm] = useState({ title: '', content: '', type: 'info' });
  const [error, setError] = useState('');
  const [introPhase, setIntroPhase] = useState('logo');
  const { isAdmin, user } = useAuth();
  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;
  const navigate = useNavigate();

  const fetchAll = async () => {
    try {
      const [evRes, annRes] = await Promise.all([eventsAPI.getAll(), announcementsAPI.getAll()]);
      setEvents(evRes.data);
      setAnnouncements(annRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchAll();
    const t = setTimeout(() => setIntroPhase('events'), 2200);
    return () => clearTimeout(t);
  }, []);

  const openCreate = () => { setEditEvent(null); setForm({ title: '', description: '', date: '', venue: '', status: 'upcoming', registration_deadline: '' }); setShowModal(true); };
  const openEdit = (ev) => { setEditEvent(ev); setForm({ title: ev.title, description: ev.description || '', date: ev.date, venue: ev.venue || '', status: ev.status, registration_deadline: ev.registration_deadline || '' }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    try {
      if (editEvent) await eventsAPI.update(editEvent.id, form);
      else await eventsAPI.create(form);
      setShowModal(false); fetchAll();
    } catch (err) { setError(err.response?.data?.error || 'Error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    await eventsAPI.delete(id); fetchAll();
  };

  const handleAnnSubmit = async (e) => {
    e.preventDefault();
    try {
      await announcementsAPI.create(annForm);
      setShowAnnModal(false); setAnnForm({ title: '', content: '', type: 'info' }); fetchAll();
    } catch (err) { console.error(err); }
  };

  const deleteAnn = async (id) => {
    await announcementsAPI.delete(id); fetchAll();
  };

  const isDeadlinePassed = (deadline) => deadline && new Date(deadline) < new Date();
  const statusColor = { upcoming: 'cyan', active: 'green', completed: 'purple' };
  const annColor = { info: 'cyan', warning: 'red', success: 'green' };
  const annIcon  = { info: '📢', warning: '⚠️', success: '🎉' };

  // LOADING
  if (loading) return (
    <>
      <Navbar />
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`@keyframes robotBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}} @keyframes dotBlink{0%,100%{opacity:0.2}50%{opacity:1}} @keyframes wireFlow{0%{stroke-dashoffset:100}100%{stroke-dashoffset:0}}`}</style>
        <div style={{ animation: 'robotBob 1.5s ease-in-out infinite' }}>
          <svg width="110" height="130" viewBox="0 0 120 140">
            <rect x="30" y="10" width="60" height="50" rx="8" fill="#0a1628" stroke="#00d4ff" strokeWidth="2"/>
            <circle cx="47" cy="32" r="8" fill="#00d4ff" opacity="0.9"/>
            <circle cx="73" cy="32" r="8" fill="#7c3aed" opacity="0.9"/>
            <circle cx="47" cy="32" r="4" fill="#000"/><circle cx="73" cy="32" r="4" fill="#000"/>
            <rect x="42" y="48" width="36" height="6" rx="3" fill="#00d4ff" opacity="0.6"/>
            <line x1="60" y1="10" x2="60" y2="0" stroke="#00d4ff" strokeWidth="2"/>
            <circle cx="60" cy="0" r="4" fill="#00d4ff" style={{animation:'dotBlink 1s infinite'}}/>
            <rect x="25" y="65" width="70" height="55" rx="8" fill="#0a1628" stroke="#00d4ff" strokeWidth="2"/>
            <rect x="40" y="78" width="40" height="28" rx="4" fill="#050f1f" stroke="#7c3aed" strokeWidth="1"/>
            <circle cx="60" cy="92" r="8" fill="none" stroke="#00d4ff" strokeWidth="1.5" strokeDasharray="4 2"/>
            <circle cx="60" cy="92" r="4" fill="#00d4ff" opacity="0.8"/>
            <rect x="0" y="68" width="22" height="10" rx="5" fill="#0a1628" stroke="#00d4ff" strokeWidth="1.5"/>
            <rect x="98" y="68" width="22" height="10" rx="5" fill="#0a1628" stroke="#00d4ff" strokeWidth="1.5"/>
            <path d="M22 73 Q30 90 25 110" fill="none" stroke="#00d4ff" strokeWidth="2" strokeDasharray="5 3"/>
            <path d="M98 73 Q90 90 95 110" fill="none" stroke="#7c3aed" strokeWidth="2" strokeDasharray="5 3"/>
            <rect x="35" y="120" width="20" height="18" rx="4" fill="#0a1628" stroke="#00d4ff" strokeWidth="1.5"/>
            <rect x="65" y="120" width="20" height="18" rx="4" fill="#0a1628" stroke="#00d4ff" strokeWidth="1.5"/>
          </svg>
        </div>
        <div style={{ marginTop: '1.5rem', fontFamily: 'Orbitron', color: 'var(--accent)', fontSize: '0.9rem', letterSpacing: '0.1em' }}>CONNECTING TO SERVER</div>
        <div style={{ display: 'flex', gap: 6, marginTop: '0.75rem' }}>
          {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', animation: `dotBlink 1s ease-in-out ${i*0.3}s infinite` }} />)}
        </div>
      </div>
    </>
  );

  // INTRO LOGO
  if (introPhase === 'logo') return (
    <>
      <Navbar />
      <style>{`@keyframes logoAppear{0%{opacity:0;transform:scale(0.3) rotate(-10deg)}60%{transform:scale(1.1) rotate(2deg)}100%{opacity:1;transform:scale(1) rotate(0deg)}} @keyframes neuralDraw{0%{stroke-dashoffset:500;opacity:0}100%{stroke-dashoffset:0;opacity:1}} @keyframes dotBlink{0%,100%{opacity:0.2}50%{opacity:1}}`}</style>
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <svg style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.12 }} viewBox="0 0 800 600">
          {[[100,100],[300,150],[500,100],[700,150],[200,300],[400,280],[600,300],[150,450],[350,480],[550,450]].map((pt, i, arr) =>
            arr.slice(i+1, i+3).map((pt2, j) => (
              <line key={`${i}-${j}`} x1={pt[0]} y1={pt[1]} x2={pt2[0]} y2={pt2[1]} stroke="#00d4ff" strokeWidth="1" strokeDasharray="500" style={{animation:`neuralDraw 2s ease ${i*0.1}s both`}}/>
            ))
          )}
          {[[100,100],[300,150],[500,100],[700,150],[200,300],[400,280],[600,300],[150,450],[350,480],[550,450]].map((pt, i) => (
            <circle key={i} cx={pt[0]} cy={pt[1]} r="5" fill="#00d4ff" opacity="0.8" style={{animation:`dotBlink ${1+i*0.1}s ease-in-out infinite`}}/>
          ))}
        </svg>
        <div style={{ animation: 'logoAppear 0.8s cubic-bezier(0.34,1.56,0.64,1) both', position: 'relative', zIndex: 2 }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <svg style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 0 }} width="220" height="220" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="50" fill="none" stroke="#00d4ff" strokeWidth="2" opacity="0.6"><animate attributeName="r" from="50" to="105" dur="1.5s" repeatCount="indefinite"/><animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite"/></circle>
              <circle cx="100" cy="100" r="50" fill="none" stroke="#7c3aed" strokeWidth="2" opacity="0.6"><animate attributeName="r" from="50" to="105" dur="1.5s" begin="0.5s" repeatCount="indefinite"/><animate attributeName="opacity" from="0.6" to="0" dur="1.5s" begin="0.5s" repeatCount="indefinite"/></circle>
            </svg>
            <img src={logoBase64} alt="AI Yuga" style={{ width: 160, height: 160, borderRadius: '50%', objectFit: 'cover', position: 'relative', zIndex: 1, boxShadow: '0 0 40px rgba(0,212,255,0.7)' }} />
          </div>
        </div>
        <div style={{ animation: 'fadeInUp 0.6s ease 0.8s both', textAlign: 'center', marginTop: '1.5rem', zIndex: 2 }}>
          <h1 className="shimmer-text" style={{ fontFamily: 'Orbitron', fontSize: '2.5rem', letterSpacing: '0.2em' }}>AI YUGA</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', letterSpacing: '0.1em', marginTop: '0.25rem' }}>DEPT. OF AI & MACHINE LEARNING</p>
        </div>
      </div>
    </>
  );

  // MAIN PAGE
  return (
    <>
      <Navbar />
      <div className="scanline" />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>

        {/* Announcements */}
        {announcements.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            {announcements.map((ann, i) => (
              <div key={ann.id} className="fade-in" style={{
                animationDelay: `${i*0.08}s`,
                display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                padding: '0.875rem 1.25rem', marginBottom: '0.5rem',
                background: 'var(--surface)', borderRadius: 10,
                borderLeft: `3px solid ${ann.type === 'warning' ? 'var(--danger)' : ann.type === 'success' ? 'var(--accent3)' : 'var(--accent)'}`,
                border: `1px solid ${ann.type === 'warning' ? 'rgba(239,68,68,0.2)' : ann.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(0,212,255,0.2)'}`,
                borderLeft: `3px solid ${ann.type === 'warning' ? 'var(--danger)' : ann.type === 'success' ? 'var(--accent3)' : 'var(--accent)'}`,
              }}>
                <span style={{ fontSize: '1.1rem' }}>{annIcon[ann.type] || '📢'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.2rem' }}>{ann.title}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{ann.content}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {new Date(ann.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                  {isSuperAdmin && (
                    <button onClick={() => deleteAnn(ann.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem', padding: '0 4px' }}>✕</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between" style={{ marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', color: 'var(--accent)', letterSpacing: '0.05em', animation: 'fadeInUp 0.5s ease both' }}>Events</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', animation: 'fadeInUp 0.5s ease 0.1s both' }}>{events.length} event{events.length !== 1 ? 's' : ''} available</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', animation: 'fadeInUp 0.5s ease 0.2s both' }}>
            {isSuperAdmin && <button className="btn btn-secondary" onClick={() => setShowAnnModal(true)}>📢 Announce</button>}
            {isAdmin && <button className="btn btn-primary" onClick={openCreate}>+ New Event</button>}
          </div>
        </div>

        {events.length === 0 ? (
          <div className="empty-state fade-in"><div className="empty-icon">📅</div><h3>No events yet</h3><p>{isAdmin ? 'Create your first event!' : 'Check back soon!'}</p></div>
        ) : (
          <div className="grid-2">
            {events.map((ev, i) => {
              const deadlinePassed = isDeadlinePassed(ev.registration_deadline);
              return (
                <div key={ev.id} className="card fade-in" style={{ animationDelay: `${i * 0.1}s`, cursor: 'pointer' }} onClick={() => navigate(`/events/${ev.id}`)}>
                  <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)', transform: 'translate(30%,-30%)' }} />
                  <div className="flex items-center justify-between" style={{ marginBottom: '0.75rem' }}>
                    <span className={`badge badge-${statusColor[ev.status] || 'cyan'}`}>{ev.status}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(ev.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <h2 style={{ fontSize: '1.05rem', marginBottom: '0.5rem', fontFamily: 'Orbitron' }}>{ev.title}</h2>
                  {ev.description && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.75rem', lineHeight: 1.5 }}>{ev.description.substring(0, 100)}{ev.description.length > 100 ? '...' : ''}</p>}
                  <div className="flex items-center gap-1" style={{ flexWrap: 'wrap' }}>
                    {ev.venue && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>📍 {ev.venue}</span>}
                    {ev.registration_deadline && (
                      <span style={{ fontSize: '0.75rem', color: deadlinePassed ? 'var(--danger)' : '#fbbf24', background: deadlinePassed ? 'rgba(239,68,68,0.1)' : 'rgba(251,191,36,0.1)', padding: '0.15rem 0.5rem', borderRadius: 6 }}>
                        {deadlinePassed ? '🔒 Reg. Closed' : `⏰ Reg. until ${new Date(ev.registration_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                      </span>
                    )}
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>👥 {ev.team_count} teams</span>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
                      <button className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }} onClick={() => openEdit(ev)}>Edit</button>
                      <button className="btn btn-danger" style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }} onClick={() => handleDelete(ev.id)}>Delete</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Event Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'Orbitron', fontSize: '1rem', color: 'var(--accent)', marginBottom: '1.5rem' }}>{editEvent ? 'Edit Event' : 'Create New Event'}</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div><label className="label">Event Title *</label><input className="input" placeholder="e.g. Hackathon 2025" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required /></div>
              <div><label className="label">Description</label><textarea className="input" placeholder="What's this event about?" value={form.description} onChange={e => setForm({...form, description: e.target.value})} style={{ minHeight: 80, resize: 'vertical' }} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><label className="label">Event Date *</label><input className="input" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required /></div>
                <div><label className="label">Status</label>
                  <select className="input" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                    <option value="upcoming">Upcoming</option><option value="active">Active</option><option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><label className="label">Venue</label><input className="input" placeholder="e.g. Lab 302" value={form.venue} onChange={e => setForm({...form, venue: e.target.value})} /></div>
                <div><label className="label">Registration Deadline</label><input className="input" type="date" value={form.registration_deadline} onChange={e => setForm({...form, registration_deadline: e.target.value})} /></div>
              </div>
              <div className="flex gap-1" style={{ marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ marginLeft: 'auto' }}>{editEvent ? 'Update' : 'Create Event'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Announcement Modal */}
      {showAnnModal && (
        <div className="modal-overlay" onClick={() => setShowAnnModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'Orbitron', fontSize: '1rem', color: 'var(--accent)', marginBottom: '1.5rem' }}>📢 New Announcement</h2>
            <form onSubmit={handleAnnSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div><label className="label">Title *</label><input className="input" placeholder="Announcement title" value={annForm.title} onChange={e => setAnnForm({...annForm, title: e.target.value})} required /></div>
              <div><label className="label">Message *</label><textarea className="input" placeholder="Write your announcement..." value={annForm.content} onChange={e => setAnnForm({...annForm, content: e.target.value})} style={{ minHeight: 100, resize: 'vertical' }} required /></div>
              <div><label className="label">Type</label>
                <select className="input" value={annForm.type} onChange={e => setAnnForm({...annForm, type: e.target.value})}>
                  <option value="info">📢 Info</option><option value="warning">⚠️ Warning</option><option value="success">🎉 Success</option>
                </select>
              </div>
              <div className="flex gap-1" style={{ marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAnnModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ marginLeft: 'auto' }}>Post Announcement</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}