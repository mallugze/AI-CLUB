import React, { useState, useEffect } from 'react';
import { activitiesAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const SUPER_ADMIN_EMAIL = 'mallug@gmail.com';

export default function ActivitiesPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [editActivity, setEditActivity] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', date: '', venue: '', total_seats: '', status: 'open' });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchActivities = async () => {
    try {
      const res = await activitiesAPI.getAll();
      setActivities(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchActivities(); }, []);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editActivity) await activitiesAPI.update(editActivity.id, form);
      else await activitiesAPI.create(form);
      setShowModal(false);
      fetchActivities();
      showSuccess(editActivity ? 'Activity updated!' : 'Activity created!');
    } catch (err) { setError(err.response?.data?.error || 'Error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this activity?')) return;
    await activitiesAPI.delete(id);
    fetchActivities();
  };

  const handleBook = async (activity) => {
    try {
      await activitiesAPI.book(activity.id);
      fetchActivities();
      showSuccess('🎉 Seat booked successfully!');
    } catch (err) { showSuccess('❌ ' + (err.response?.data?.error || 'Booking failed')); }
  };

  const handleCancelBook = async (activity) => {
    try {
      await activitiesAPI.cancelBook(activity.id);
      fetchActivities();
      showSuccess('Booking cancelled.');
    } catch (err) { console.error(err); }
  };

  const viewBookings = async (activity) => {
    setSelectedActivity(activity);
    const res = await activitiesAPI.getBookings(activity.id);
    setBookings(res.data);
    setShowBookingsModal(true);
  };

  const openCreate = () => {
    setEditActivity(null);
    setForm({ title: '', description: '', date: '', venue: '', total_seats: '', status: 'open' });
    setShowModal(true);
  };

  const openEdit = (a) => {
    setEditActivity(a);
    setForm({ title: a.title, description: a.description || '', date: a.date, venue: a.venue || '', total_seats: a.total_seats, status: a.status });
    setShowModal(true);
  };

  const seatsLeft = (a) => Math.max(0, a.total_seats - parseInt(a.booked_count || 0));
  const seatPercent = (a) => Math.min(100, (parseInt(a.booked_count || 0) / a.total_seats) * 100);

  return (
    <>
      <Navbar />
      <div className="scanline" />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>

        {/* Header */}
        <div className="flex items-center justify-between fade-in" style={{ marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', color: 'var(--accent)', letterSpacing: '0.05em' }}>🎫 Activities</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Book your seat — first come, first served!</p>
          </div>
          {isSuperAdmin && (
            <button className="btn btn-primary" onClick={openCreate}>+ New Activity</button>
          )}
        </div>

        {successMsg && (
          <div className="alert alert-success fade-in" style={{ marginBottom: '1rem' }}>{successMsg}</div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '4rem' }}>Loading activities...</div>
        ) : activities.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎫</div>
            <h3>No activities yet</h3>
            <p>{isSuperAdmin ? 'Create your first activity!' : 'Check back soon!'}</p>
          </div>
        ) : (
          <div className="grid-2">
            {activities.map((a, i) => {
              const left = seatsLeft(a);
              const percent = seatPercent(a);
              const isFull = left === 0;
              const userBooked = parseInt(a.user_booked) > 0;

              return (
                <div key={a.id} className="card fade-in" style={{ animationDelay: `${i * 0.08}s`, position: 'relative', overflow: 'hidden' }}>
                  {/* Ticket notches */}
                  <div style={{ position: 'absolute', left: -12, top: '50%', width: 24, height: 24, borderRadius: '50%', background: 'var(--bg)', transform: 'translateY(-50%)' }} />
                  <div style={{ position: 'absolute', right: -12, top: '50%', width: 24, height: 24, borderRadius: '50%', background: 'var(--bg)', transform: 'translateY(-50%)' }} />

                  {/* Ticket dashed line */}
                  <div style={{ position: 'absolute', left: 24, right: 24, top: '62%', borderTop: '1px dashed var(--border)' }} />

                  <div style={{ marginBottom: '0.75rem' }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: '0.5rem' }}>
                      <span className={`badge badge-${a.status === 'open' ? 'green' : a.status === 'closed' ? 'red' : 'cyan'}`}>
                        {a.status}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <h2 style={{ fontFamily: 'Orbitron', fontSize: '1.1rem', marginBottom: '0.4rem' }}>{a.title}</h2>
                    {a.description && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>{a.description}</p>}
                    {a.venue && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.4rem' }}>📍 {a.venue}</p>}
                  </div>

                  {/* Seats section */}
                  <div style={{ marginTop: '1.5rem', paddingTop: '1rem' }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {a.booked_count}/{a.total_seats} booked
                      </span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isFull ? 'var(--danger)' : 'var(--accent3)' }}>
                        {isFull ? 'FULL' : `${left} seats left`}
                      </span>
                    </div>

                    {/* Seat progress bar */}
                    <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden', marginBottom: '1rem' }}>
                      <div style={{
                        height: '100%',
                        width: `${percent}%`,
                        background: isFull ? 'var(--danger)' : percent > 70 ? '#f59e0b' : 'var(--accent3)',
                        borderRadius: 4,
                        transition: 'width 1s ease',
                      }} />
                    </div>

                    {/* Seat grid visualization */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: '1rem' }}>
                      {Array.from({ length: Math.min(a.total_seats, 20) }).map((_, idx) => (
                        <div key={idx} style={{
                          width: 18, height: 18, borderRadius: 3,
                          background: idx < parseInt(a.booked_count || 0) ? (userBooked && idx === parseInt(a.booked_count) - 1 ? 'var(--accent)' : 'var(--accent2)') : 'var(--border)',
                          transition: 'background 0.3s',
                          fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {idx < parseInt(a.booked_count || 0) ? '✓' : ''}
                        </div>
                      ))}
                      {a.total_seats > 20 && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', alignSelf: 'center' }}>+{a.total_seats - 20} more</span>}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-1">
                      {!isSuperAdmin && a.status === 'open' && (
                        userBooked ? (
                          <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem' }}
                            onClick={() => handleCancelBook(a)}>
                            ✕ Cancel Booking
                          </button>
                        ) : (
                          <button className={`btn ${isFull ? 'btn-secondary' : 'btn-primary'}`}
                            style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem' }}
                            disabled={isFull} onClick={() => handleBook(a)}>
                            {isFull ? 'No Seats Available' : '🎫 Book My Seat'}
                          </button>
                        )
                      )}

                      {userBooked && !isSuperAdmin && (
                        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '0.4rem 0.75rem', fontSize: '0.75rem', color: 'var(--accent3)' }}>
                          ✓ Booked
                        </div>
                      )}

                      {isSuperAdmin && (
                        <>
                          <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}
                            onClick={() => viewBookings(a)}>
                            👥 {a.booked_count} Bookings
                          </button>
                          <button className="btn btn-purple" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}
                            onClick={() => openEdit(a)}>Edit</button>
                          <button className="btn btn-danger" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}
                            onClick={() => handleDelete(a.id)}>Delete</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'Orbitron', fontSize: '1rem', color: 'var(--accent)', marginBottom: '1.5rem' }}>
              {editActivity ? 'Edit Activity' : 'Create New Activity'}
            </h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="label">Title *</label>
                <input className="input" placeholder="e.g. Tech Talk: Future of AI" value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input" placeholder="What's this activity about?" value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })} style={{ minHeight: 70, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="label">Date *</label>
                  <input className="input" type="date" value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Total Seats *</label>
                  <input className="input" type="number" min="1" placeholder="50" value={form.total_seats}
                    onChange={e => setForm({ ...form, total_seats: e.target.value })} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="label">Venue</label>
                  <input className="input" placeholder="e.g. Seminar Hall" value={form.venue}
                    onChange={e => setForm({ ...form, venue: e.target.value })} />
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-1" style={{ marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ marginLeft: 'auto' }}>
                  {editActivity ? 'Update' : 'Create Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bookings Modal */}
      {showBookingsModal && selectedActivity && (
        <div className="modal-overlay" onClick={() => setShowBookingsModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'Orbitron', fontSize: '1rem', color: 'var(--accent)', marginBottom: '0.25rem' }}>
              Bookings
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              {selectedActivity.title} — {bookings.length}/{selectedActivity.total_seats} seats
            </p>
            {bookings.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No bookings yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 400, overflowY: 'auto' }}>
                {bookings.map((b, i) => (
                  <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.75rem', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <span style={{ fontFamily: 'Orbitron', color: 'var(--accent)', fontWeight: 700, minWidth: 28 }}>#{i + 1}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{b.user_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.user_email}</div>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {new Date(b.booked_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button className="btn btn-secondary" style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}
              onClick={() => setShowBookingsModal(false)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}