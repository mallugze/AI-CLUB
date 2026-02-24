import React, { useState, useEffect } from 'react';
import API, { usersAPI } from '../api';
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
    if (user?.email !== SUPER_ADMIN_EMAIL) {
      navigate('/events');
      return;
    }
    fetchUsers();
  }, [user]);

  const fetchUsers = async () => {
    try {
      const res = await usersAPI.getAll();
      setUsers(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const changeRole = async (userId, newRole) => {
    try {
      await usersAPI.updateRole(userId, newRole);
      setMessage('Role updated successfully!');
      fetchUsers();
      setTimeout(() => setMessage(''), 3000);
    } catch (e) {
      setMessage('Error updating role');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <>
      <Navbar />
      <div className="scanline" />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem' }}>
        <div className="fade-in" style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--accent)', letterSpacing: '0.05em' }}>⚙ Manage Users</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Promote members to admin or demote admins to member</p>
        </div>

        {message && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{message}</div>}

        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '4rem' }}>Loading users...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {users.map((u, i) => (
              <div key={u.id} className="card fade-in" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem', animationDelay: `${i * 0.05}s` }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: u.email === SUPER_ADMIN_EMAIL
                    ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
                    : u.role === 'admin'
                    ? 'linear-gradient(135deg, var(--accent2), #5b21b6)'
                    : 'linear-gradient(135deg, var(--accent), #0099bb)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem', fontWeight: 700, color: '#000', flexShrink: 0,
                }}>
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {u.name}
                    {u.email === SUPER_ADMIN_EMAIL && (
                      <span className="badge" style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)', fontSize: '0.65rem' }}>
                        👑 Super Admin
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className={`badge badge-${u.role === 'admin' ? 'purple' : 'cyan'}`}>{u.role}</span>
                  {u.email !== SUPER_ADMIN_EMAIL && (
                    <button
                      className={`btn ${u.role === 'admin' ? 'btn-danger' : 'btn-purple'}`}
                      style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}
                      onClick={() => changeRole(u.id, u.role === 'admin' ? 'member' : 'admin')}
                    >
                      {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}