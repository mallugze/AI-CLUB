import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SUPER_ADMIN_EMAIL = 'mallug@gmail.com';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={{
      background: 'rgba(5,15,31,0.95)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--border)',
      padding: '0 2rem',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      height: '64px',
      gap: '2rem',
    }}>
      <Link to="/events" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{
          width: 36, height: 36,
          background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1rem',
          boxShadow: 'var(--glow)',
        }}>⚡</div>
        <span style={{ fontFamily: 'Orbitron', fontWeight: 700, fontSize: '1rem', color: 'var(--accent)', letterSpacing: '0.1em' }}>
          AI CLUB
        </span>
      </Link>

      <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
        <NavLink to="/events" active={isActive('/events')}>Events</NavLink>
        <NavLink to="/leaderboard" active={isActive('/leaderboard')}>Leaderboard</NavLink>
        {isSuperAdmin && (
          <NavLink to="/users" active={isActive('/users')}>👑 Manage Users</NavLink>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>{user?.name}</div>
          <div style={{ fontSize: '0.7rem' }}>
            <span className={`badge ${isSuperAdmin ? '' : `badge-${isAdmin ? 'purple' : 'cyan'}`}`}
              style={isSuperAdmin ? { background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' } : {}}>
              {isSuperAdmin ? '👑 Super Admin' : isAdmin ? '⚙ Admin' : '● Member'}
            </span>
          </div>
        </div>
        <button onClick={handleLogout} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
          Logout
        </button>
      </div>
    </nav>
  );
}

function NavLink({ to, active, children }) {
  return (
    <Link to={to} style={{
      textDecoration: 'none',
      padding: '0.5rem 1rem',
      borderRadius: 8,
      fontSize: '0.875rem',
      fontWeight: 600,
      color: active ? 'var(--accent)' : 'var(--text-muted)',
      background: active ? 'rgba(0,212,255,0.1)' : 'transparent',
      border: active ? '1px solid rgba(0,212,255,0.2)' : '1px solid transparent',
      transition: 'all 0.2s',
      letterSpacing: '0.03em',
    }}>{children}</Link>
  );
}