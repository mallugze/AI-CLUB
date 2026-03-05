import React, { useState, useEffect } from 'react';
import { usersAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const SUPER_ADMIN_EMAIL = 'mallug@gmail.com';

export default function UsersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user?.email !== SUPER_ADMIN_EMAIL) { navigate('/events'); return; }
    fetchUsers();
  }, [user]);

  const fetchUsers = async () => {
    try { const res = await usersAPI.getAll(); setUsers(res.data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const showMsg = (msg) => { setMessage(msg); setTimeout(() => setMessage(''), 3000); };

  const changeRole = async (userId, newRole) => {
    try { await usersAPI.updateRole(userId, newRole); showMsg('Role updated!'); fetchUsers(); }
    catch (e) { showMsg('Error updating role'); }
  };

  const deleteUser = async (u) => {
    if (!window.confirm(`Delete "${u.name}"? This cannot be undone.`)) return;
    try { await usersAPI.deleteUser(u.id); showMsg('User deleted!'); fetchUsers(); }
    catch (e) { showMsg('Error deleting user'); }
  };

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem' }}>

        <div className="fade-in" style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.6rem', color: '#0066cc', letterSpacing: '0.05em' }}>⚙ Manage Users</h1>
          <p style={{ color: '#64748b', marginTop: '0.25rem' }}>Promote, demote, delete users or generate their certificates</p>
        </div>

        {message && <div className="alert alert-success fade-in">{message}</div>}

        {/* Legend */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '0.875rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.8rem', color: '#64748b' }}>
          <span>📄 <strong style={{ color: '#1e293b' }}>Certificates</strong> — View profile & download certificates for this user</span>
          <span>⬆️ <strong style={{ color: '#1e293b' }}>Make Admin</strong> — Grant admin privileges</span>
          <span>🗑 <strong style={{ color: '#1e293b' }}>Delete</strong> — Remove user permanently</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#64748b', padding: '4rem' }}>Loading users...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {users.map((u, i) => (
              <div key={u.id} className="card fade-in" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem', animationDelay: `${i*0.04}s`, flexWrap: 'wrap' }}>
                {/* Avatar */}
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: u.email === SUPER_ADMIN_EMAIL ? 'linear-gradient(135deg, #d97706, #b45309)'
                    : u.role === 'admin' ? 'linear-gradient(135deg, #6d28d9, #5b21b6)'
                    : 'linear-gradient(135deg, #0066cc, #0052a3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.1rem', fontWeight: 700, color: '#fff', fontFamily: 'Orbitron',
                }}>
                  {u.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {u.name}
                    {u.email === SUPER_ADMIN_EMAIL && <span className="badge" style={{ background: 'rgba(217,119,6,0.1)', color: '#b45309', border: '1px solid rgba(217,119,6,0.25)', fontSize: '0.62rem' }}>👑 Super Admin</span>}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{u.email}</div>
                </div>

                {/* Role badge */}
                <span className={`badge badge-${u.role === 'admin' ? 'purple' : 'cyan'}`}>{u.role}</span>

                {/* Actions */}
                {u.email !== SUPER_ADMIN_EMAIL && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '0.4rem 0.85rem' }}
                      onClick={() => navigate(`/profile/${u.id}`)}>
                      📄 Certificates
                    </button>
                    <button className={`btn ${u.role === 'admin' ? 'btn-secondary' : 'btn-purple'}`} style={{ fontSize: '0.75rem', padding: '0.4rem 0.85rem' }}
                      onClick={() => changeRole(u.id, u.role === 'admin' ? 'member' : 'admin')}>
                      {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                    </button>
                    <button className="btn btn-danger" style={{ fontSize: '0.75rem', padding: '0.4rem 0.85rem' }}
                      onClick={() => deleteUser(u)}>
                      🗑 Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}