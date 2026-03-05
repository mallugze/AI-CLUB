import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoBase64 from '../logo';

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
      background: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      padding: '0 2rem',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      height: '68px',
      gap: '1.5rem',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    }}>
      <Link to="/events" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
        <img src={logoBase64} alt="AI Yuga" style={{
          width: 44, height: 44,
          borderRadius: '50%',
          objectFit: 'cover',
          boxShadow: '0 2px 8px rgba(0,102,204,0.2)',
          display: 'block', flexShrink: 0,
          filter: 'contrast(1.05) saturate(1.1)',
        }} />
        <div>
          <div style={{ fontFamily: 'Orbitron', fontWeight: 900, fontSize: '0.95rem', color: '#0066cc', letterSpacing: '0.08em', lineHeight: 1 }}>AI YUGA</div>
          <div style={{ fontSize: '0.52rem', color: '#94a3b8', letterSpacing: '0.05em', lineHeight: 1.3 }}>PDA COLLEGE • KALABURAGI</div>
        </div>
      </Link>

      <div style={{ display: 'flex', gap: '0.25rem', flex: 1 }}>
        <NavLink to="/events" active={isActive('/events')}>Events</NavLink>
        <NavLink to="/activities" active={isActive('/activities')}>🎫 Activities</NavLink>
        <NavLink to="/leaderboard" active={isActive('/leaderboard')}>Leaderboard</NavLink>
        <NavLink to="/profile" active={isActive('/profile')}>👤 Profile</NavLink>
        {isSuperAdmin && <NavLink to="/users" active={isActive('/users')}>👑 Users</NavLink>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>{user?.name}</div>
          <span className="badge" style={
            isSuperAdmin
              ? { background: 'rgba(217,119,6,0.12)', color: '#b45309', border: '1px solid rgba(217,119,6,0.25)', fontSize: '0.62rem' }
              : isAdmin
              ? { background: 'rgba(109,40,217,0.1)', color: '#5b21b6', border: '1px solid rgba(109,40,217,0.25)', fontSize: '0.62rem' }
              : { background: 'rgba(0,102,204,0.1)', color: '#0052a3', border: '1px solid rgba(0,102,204,0.25)', fontSize: '0.62rem' }
          }>
            {isSuperAdmin ? '👑 Super Admin' : isAdmin ? '⚙ Admin' : '● Member'}
          </span>
        </div>
        <button onClick={handleLogout} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}>
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
      padding: '0.45rem 0.9rem',
      borderRadius: 8,
      fontSize: '0.82rem',
      fontWeight: 600,
      color: active ? '#0066cc' : '#64748b',
      background: active ? 'rgba(0,102,204,0.08)' : 'transparent',
      border: active ? '1px solid rgba(0,102,204,0.2)' : '1px solid transparent',
      transition: 'all 0.15s',
      whiteSpace: 'nowrap',
    }}>{children}</Link>
  );
}