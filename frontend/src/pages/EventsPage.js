import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', date: '', venue: '', status: 'upcoming' });
  const [error, setError] = useState('');
  const [introPhase, setIntroPhase] = useState('logo'); // 'logo' | 'events'
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const fetchEvents = async () => {
    try {
      const res = await eventsAPI.getAll();
      setEvents(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchEvents();
    // Logo shows for 2s then transitions to events
    const t1 = setTimeout(() => setIntroPhase('events'), 2200);
    return () => clearTimeout(t1);
  }, []);

  const openCreate = () => { setEditEvent(null); setForm({ title: '', description: '', date: '', venue: '', status: 'upcoming' }); setShowModal(true); };
  const openEdit = (ev) => { setEditEvent(ev); setForm({ title: ev.title, description: ev.description || '', date: ev.date, venue: ev.venue || '', status: ev.status }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editEvent) await eventsAPI.update(editEvent.id, form);
      else await eventsAPI.create(form);
      setShowModal(false);
      fetchEvents();
    } catch (err) { setError(err.response?.data?.error || 'Error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    await eventsAPI.delete(id);
    fetchEvents();
  };

  const statusColor = { upcoming: 'cyan', active: 'green', completed: 'purple' };

  // LOADING SCREEN — Robot connecting wires
  if (loading) return (
    <>
      <Navbar />
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`
          @keyframes robotBob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
          @keyframes wirePulse { 0%{stroke-dashoffset:100} 100%{stroke-dashoffset:0} }
          @keyframes dotBlink { 0%,100%{opacity:0.2} 50%{opacity:1} }
          @keyframes circuitFlow { 0%{stroke-dashoffset:200} 100%{stroke-dashoffset:0} }
        `}</style>
        <div style={{ animation: 'robotBob 1.5s ease-in-out infinite' }}>
          <svg width="120" height="140" viewBox="0 0 120 140">
            {/* Robot head */}
            <rect x="30" y="10" width="60" height="50" rx="8" fill="#0a1628" stroke="#00d4ff" strokeWidth="2"/>
            {/* Eyes */}
            <circle cx="47" cy="32" r="8" fill="#00d4ff" opacity="0.9"/>
            <circle cx="73" cy="32" r="8" fill="#7c3aed" opacity="0.9"/>
            <circle cx="47" cy="32" r="4" fill="#000"/>
            <circle cx="73" cy="32" r="4" fill="#000"/>
            {/* Mouth */}
            <rect x="42" y="48" width="36" height="6" rx="3" fill="#00d4ff" opacity="0.6"/>
            {/* Antenna */}
            <line x1="60" y1="10" x2="60" y2="0" stroke="#00d4ff" strokeWidth="2"/>
            <circle cx="60" cy="0" r="4" fill="#00d4ff" style={{animation:'dotBlink 1s infinite'}}/>
            {/* Body */}
            <rect x="25" y="65" width="70" height="55" rx="8" fill="#0a1628" stroke="#00d4ff" strokeWidth="2"/>
            {/* Chest circuit */}
            <rect x="40" y="78" width="40" height="28" rx="4" fill="#050f1f" stroke="#7c3aed" strokeWidth="1"/>
            <circle cx="60" cy="92" r="8" fill="none" stroke="#00d4ff" strokeWidth="1.5" strokeDasharray="4 2" style={{animation:'robotBob 2s linear infinite'}}/>
            <circle cx="60" cy="92" r="4" fill="#00d4ff" opacity="0.8"/>
            {/* Arms */}
            <rect x="0" y="68" width="22" height="10" rx="5" fill="#0a1628" stroke="#00d4ff" strokeWidth="1.5"/>
            <rect x="98" y="68" width="22" height="10" rx="5" fill="#0a1628" stroke="#00d4ff" strokeWidth="1.5"/>
            {/* Wire from left arm */}
            <path d="M22 73 Q30 90 25 110" fill="none" stroke="#00d4ff" strokeWidth="2" strokeDasharray="5 3" style={{strokeDashoffset:0, animation:'circuitFlow 2s linear infinite'}}/>
            {/* Wire from right arm */}
            <path d="M98 73 Q90 90 95 110" fill="none" stroke="#7c3aed" strokeWidth="2" strokeDasharray="5 3" style={{animation:'circuitFlow 2s linear infinite reverse'}}/>
            {/* Legs */}
            <rect x="35" y="120" width="20" height="18" rx="4" fill="#0a1628" stroke="#00d4ff" strokeWidth="1.5"/>
            <rect x="65" y="120" width="20" height="18" rx="4" fill="#0a1628" stroke="#00d4ff" strokeWidth="1.5"/>
          </svg>
        </div>
        <div style={{ marginTop: '1.5rem', fontFamily: 'Orbitron', color: 'var(--accent)', fontSize: '0.9rem', letterSpacing: '0.1em' }}>
          CONNECTING TO SERVER
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: '0.75rem' }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', animation: `dotBlink 1s ease-in-out ${i*0.3}s infinite` }} />
          ))}
        </div>
      </div>
    </>
  );

  // INTRO LOGO PHASE
  if (introPhase === 'logo') return (
    <>
      <Navbar />
      <style>{`
        @keyframes logoAppear { 0%{opacity:0;transform:scale(0.3) rotate(-10deg)} 60%{transform:scale(1.1) rotate(2deg)} 100%{opacity:1;transform:scale(1) rotate(0deg)} }
        @keyframes ringExpand { 0%{r:50;opacity:1} 100%{r:120;opacity:0} }
        @keyframes neuralDraw { 0%{stroke-dashoffset:500} 100%{stroke-dashoffset:0} }
        @keyframes particleFloat { 0%{transform:translate(0,0) scale(0);opacity:0} 30%{opacity:1;transform:translate(var(--tx),var(--ty)) scale(1)} 100%{transform:translate(var(--tx2),var(--ty2)) scale(0);opacity:0} }
      `}</style>
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {/* Neural network background SVG */}
        <svg style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.15 }} viewBox="0 0 800 600">
          {[[100,100],[300,150],[500,100],[700,150],[200,300],[400,280],[600,300],[150,450],[350,480],[550,450],[700,400]].map((pt, i) =>
            [[100,100],[300,150],[500,100],[700,150],[200,300],[400,280],[600,300],[150,450],[350,480],[550,450],[700,400]].slice(i+1, i+3).map((pt2, j) => (
              <line key={`${i}-${j}`} x1={pt[0]} y1={pt[1]} x2={pt2[0]} y2={pt2[1]} stroke="#00d4ff" strokeWidth="1" strokeDasharray="500" style={{animation:`neuralDraw 2s ease ${i*0.1}s both`}}/>
            ))
          )}
          {[[100,100],[300,150],[500,100],[700,150],[200,300],[400,280],[600,300],[150,450],[350,480],[550,450],[700,400]].map((pt, i) => (
            <circle key={i} cx={pt[0]} cy={pt[1]} r="5" fill="#00d4ff" opacity="0.8" style={{animation:`dotBlink ${1+i*0.1}s ease-in-out infinite`}}/>
          ))}
        </svg>

        {/* Logo */}
        <div style={{ animation: 'logoAppear 0.8s cubic-bezier(0.34,1.56,0.64,1) both', position: 'relative', zIndex: 2 }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <svg style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 0 }} width="200" height="200" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="50" fill="none" stroke="#00d4ff" strokeWidth="2" opacity="0.6">
                <animate attributeName="r" from="50" to="100" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite" />
              </circle>
              <circle cx="100" cy="100" r="50" fill="none" stroke="#7c3aed" strokeWidth="2" opacity="0.6">
                <animate attributeName="r" from="50" to="100" dur="1.5s" begin="0.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" begin="0.5s" repeatCount="indefinite" />
              </circle>
            </svg>
            <img src="/logo.png" alt="AI Yuga" style={{
              width: 140, height: 140, borderRadius: '50%',
              border: '3px solid var(--accent)',
              boxShadow: '0 0 40px rgba(0,212,255,0.7), 0 0 80px rgba(0,212,255,0.3)',
              position: 'relative', zIndex: 1,
              objectFit: 'cover',
              imageRendering: 'high-quality',
            }} />
          </div>
        </div>
        <div style={{ animation: 'fadeInUp 0.6s ease 0.8s both', textAlign: 'center', marginTop: '1.5rem', zIndex: 2 }}>
          <h1 style={{ fontFamily: 'Orbitron', fontSize: '2.5rem', color: 'var(--accent)', letterSpacing: '0.2em' }}>AI YUGA</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', letterSpacing: '0.1em', marginTop: '0.25rem' }}>DEPT. OF AI & MACHINE LEARNING</p>
        </div>
      </div>
    </>
  );

  // MAIN EVENTS PAGE
  return (
    <>
      <Navbar />
      <div className="scanline" />
      <style>{`
        @keyframes cardBeam { 0%{opacity:0;transform:translateY(40px) scale(0.95)} 100%{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes glitchIn { 0%{clip-path:inset(40% 0 60% 0);transform:translate(-4px,0)} 20%{clip-path:inset(10% 0 85% 0);transform:translate(4px,0)} 40%{clip-path:inset(50% 0 30% 0);transform:translate(-2px,0)} 60%{clip-path:inset(20% 0 50% 0);transform:translate(2px,0)} 80%{clip-path:inset(0% 0 0% 0);transform:translate(0,0)} 100%{clip-path:none;transform:translate(0,0)} }
        .event-card-enter { animation: cardBeam 0.6s cubic-bezier(0.34,1.2,0.64,1) both; }
        .page-title-glitch { animation: glitchIn 0.5s ease both; }
      `}</style>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: '2rem' }}>
          <div>
            <h1 className="page-title-glitch" style={{ fontSize: '1.75rem', color: 'var(--accent)', letterSpacing: '0.05em' }}>Events</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', animation: 'fadeInUp 0.5s ease 0.3s both' }}>
              {events.length} event{events.length !== 1 ? 's' : ''} available
            </p>
          </div>
          {isAdmin && (
            <button className="btn btn-primary" onClick={openCreate} style={{ animation: 'fadeInUp 0.5s ease 0.4s both' }}>
              + New Event
            </button>
          )}
        </div>

        {events.length === 0 ? (
          <div className="empty-state fade-in">
            <div className="empty-icon">📅</div>
            <h3>No events yet</h3>
            <p>{isAdmin ? 'Create your first event!' : 'Check back soon!'}</p>
          </div>
        ) : (
          <div className="grid-2">
            {events.map((ev, i) => (
              <div key={ev.id} className="card event-card-enter" style={{ animationDelay: `${i * 0.12}s`, cursor: 'pointer' }}
                onClick={() => navigate(`/events/${ev.id}`)}>
                <div style={{ position: 'absolute', top: 0, right: 0, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,255,0.05) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
                <div className="flex items-center justify-between" style={{ marginBottom: '0.75rem' }}>
                  <span className={`badge badge-${statusColor[ev.status] || 'cyan'}`}>{ev.status}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(ev.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', fontFamily: 'Orbitron' }}>{ev.title}</h2>
                {ev.description && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem', lineHeight: 1.5 }}>
                    {ev.description.substring(0, 100)}{ev.description.length > 100 ? '...' : ''}
                  </p>
                )}
                <div className="flex items-center gap-1" style={{ flexWrap: 'wrap' }}>
                  {ev.venue && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📍 {ev.venue}</span>}
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                    👥 {ev.team_count} team{ev.team_count !== 1 ? 's' : ''}
                  </span>
                </div>
                {isAdmin && (
                  <div className="flex gap-1" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}
                    onClick={(e) => e.stopPropagation()}>
                    <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }} onClick={() => openEdit(ev)}>Edit</button>
                    <button className="btn btn-danger" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }} onClick={() => handleDelete(ev.id)}>Delete</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'Orbitron', fontSize: '1.1rem', color: 'var(--accent)', marginBottom: '1.5rem' }}>
              {editEvent ? 'Edit Event' : 'Create New Event'}
            </h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div><label className="label">Event Title *</label>
                <input className="input" placeholder="e.g. Hackathon 2025" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
              <div><label className="label">Description</label>
                <textarea className="input" placeholder="What's this event about?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ minHeight: 80, resize: 'vertical' }} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><label className="label">Date *</label>
                  <input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></div>
                <div><label className="label">Status</label>
                  <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="upcoming">Upcoming</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select></div>
              </div>
              <div><label className="label">Venue</label>
                <input className="input" placeholder="e.g. Lab 302" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} /></div>
              <div className="flex gap-1" style={{ marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ marginLeft: 'auto' }}>
                  {editEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}