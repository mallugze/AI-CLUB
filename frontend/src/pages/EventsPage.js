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
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const fetchEvents = async () => {
    try {
      const res = await eventsAPI.getAll();
      setEvents(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEvents(); }, []);

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

  return (
    <>
      <Navbar />
      <div className="scanline" />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>
        {/* Header */}
        <div className="flex items-center justify-between fade-in" style={{ marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', color: 'var(--accent)', letterSpacing: '0.05em' }}>Events</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {events.length} event{events.length !== 1 ? 's' : ''} available
            </p>
          </div>
          {isAdmin && (
            <button className="btn btn-primary" onClick={openCreate}>
              + New Event
            </button>
          )}
        </div>

        {/* Events grid */}
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '4rem' }}>Loading events...</div>
        ) : events.length === 0 ? (
          <div className="empty-state fade-in">
            <div className="empty-icon">📅</div>
            <h3 style={{ marginBottom: '0.5rem' }}>No events yet</h3>
            <p>{isAdmin ? 'Create your first event!' : 'Check back soon!'}</p>
          </div>
        ) : (
          <div className="grid-2">
            {events.map((ev, i) => (
              <div key={ev.id} className="card fade-in" style={{ animationDelay: `${i * 0.08}s`, cursor: 'pointer' }}
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
                    <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                      onClick={() => openEdit(ev)}>Edit</button>
                    <button className="btn btn-danger" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                      onClick={() => handleDelete(ev.id)}>Delete</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'Orbitron', fontSize: '1.1rem', color: 'var(--accent)', marginBottom: '1.5rem' }}>
              {editEvent ? 'Edit Event' : 'Create New Event'}
            </h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="label">Event Title *</label>
                <input className="input" placeholder="e.g. Hackathon 2025" value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input" placeholder="What's this event about?" value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  style={{ minHeight: 80, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="label">Date *</label>
                  <input className="input" type="date" value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="upcoming">Upcoming</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Venue</label>
                <input className="input" placeholder="e.g. Lab 302" value={form.venue}
                  onChange={(e) => setForm({ ...form, venue: e.target.value })} />
              </div>
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
