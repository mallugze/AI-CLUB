import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = isLogin
        ? await authAPI.login({ email: form.email, password: form.password })
        : await authAPI.register({ name: form.name, email: form.email, password: form.password });
      login(res.data.token, res.data.user);
      navigate('/events');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }} className="grid-bg">
      <div className="scanline" />

      {/* Floating orbs */}
      <div style={{ position: 'fixed', top: '10%', left: '5%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)', animation: 'float 6s ease-in-out infinite', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '10%', right: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)', animation: 'float 8s ease-in-out infinite 2s', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 420 }} className="fade-in">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1rem' }}>
            <img src="/logo.png" alt="AI Yuga" style={{
              width: 130, height: 130,
              animation: 'pulse-glow 3s ease-in-out infinite',
              objectFit: 'contain',
              display: 'block',
              filter: 'drop-shadow(0 0 20px rgba(0,212,255,0.6))',
            }} />
          </div>
          <h1 style={{ fontFamily: 'Orbitron', fontSize: '1.75rem', color: 'var(--accent)', letterSpacing: '0.15em' }}>AI YUGA</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem', letterSpacing: '0.1em' }}>
            PDA COLLEGE OF ENGINEERING, KALABURAGI
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', letterSpacing: '0.05em' }}>
            DEPT. OF AI & MACHINE LEARNING
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--bg)', borderRadius: 10, padding: 4 }}>
            {['Login', 'Register'].map((tab) => (
              <button key={tab} onClick={() => { setIsLogin(tab === 'Login'); setError(''); }}
                style={{
                  flex: 1, padding: '0.5rem', border: 'none', borderRadius: 8, cursor: 'pointer',
                  fontFamily: 'Exo 2', fontWeight: 600, fontSize: '0.875rem',
                  background: (isLogin && tab === 'Login') || (!isLogin && tab === 'Register') ? 'var(--surface2)' : 'transparent',
                  color: (isLogin && tab === 'Login') || (!isLogin && tab === 'Register') ? 'var(--accent)' : 'var(--text-muted)',
                  transition: 'all 0.2s',
                }}>{tab}</button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {error && <div className="alert alert-error">{error}</div>}
            {!isLogin && (
              <div>
                <label className="label">Full Name</label>
                <input className="input" placeholder="Your name" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="you@example.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="••••••••" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', marginTop: '0.5rem', fontSize: '0.95rem' }}>
              {loading ? 'Please wait...' : isLogin ? 'Login →' : 'Create Account →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '1rem' }}>
          Department of Artificial Intelligence & Machine Learning • {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}