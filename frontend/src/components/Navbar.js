import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SUPER_ADMIN_EMAIL = 'mallug@gmail.com';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;

  const handleLogout = () => { logout(); navigate('/login'); };
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
      gap: '1.5rem',
    }}>
      {/* Logo */}
      <Link to="/events" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
        <img src="D:\college\ai-club\frontend\public\logo.png" alt="AI Yuga" style={{
          width: 48, height: 48,
          borderRadius: '50%',
          boxShadow: '0 0 12px rgba(0,212,255,0.5)',
          objectFit: 'contain',
          display: 'block',
          background: 'transparent',
        }} />
        <div>
          <div style={{ fontFamily: 'Orbitron', fontWeight: 900, fontSize: '1rem', color: 'var(--accent)', letterSpacing: '0.1em', lineHeight: 1 }}>
            AI YUGA
          </div>
          <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', letterSpacing: '0.05em', lineHeight: 1.2 }}>
            PDA COLLEGE • KALABURAGI
          </div>
        </div>
      </Link>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: '0.25rem', flex: 1 }}>
        <NavLink to="/events" active={isActive('/events')}>Events</NavLink>
        <NavLink to="/activities" active={isActive('/activities')}>🎫 Activities</NavLink>
        <NavLink to="/leaderboard" active={isActive('/leaderboard')}>Leaderboard</NavLink>
        {isSuperAdmin && <NavLink to="/users" active={isActive('/users')}>👑 Users</NavLink>}
      </div>

      {/* User info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>{user?.name}</div>
          <span className={`badge`}
            style={isSuperAdmin
              ? { background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)', fontSize: '0.65rem' }
              : isAdmin
              ? { background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.3)', fontSize: '0.65rem' }
              : { background: 'rgba(0,212,255,0.15)', color: 'var(--accent)', border: '1px solid rgba(0,212,255,0.3)', fontSize: '0.65rem' }
            }>
            {isSuperAdmin ? '👑 Super Admin' : isAdmin ? '⚙ Admin' : '● Member'}
          </span>
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
      padding: '0.5rem 0.9rem',
      borderRadius: 8,
      fontSize: '0.82rem',
      fontWeight: 600,
      color: active ? 'var(--accent)' : 'var(--text-muted)',
      background: active ? 'rgba(0,212,255,0.1)' : 'transparent',
      border: active ? '1px solid rgba(0,212,255,0.2)' : '1px solid transparent',
      transition: 'all 0.2s',
      whiteSpace: 'nowrap',
    }}>{children}</Link>
  );
}