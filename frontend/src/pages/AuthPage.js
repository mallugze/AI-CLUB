import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import logoBase64 from '../logo';

export default function AuthPage() {
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (tab === 'login') {
        const res = await authAPI.login(form.email, form.password);
        login(res.data.token, res.data.user);
        navigate('/events');
      } else {
        await authAPI.register(form.name, form.email, form.password);
        const res = await authAPI.login(form.email, form.password);
        login(res.data.token, res.data.user);
        navigate('/events');
      }
    } catch (err) { setError(err.response?.data?.error || 'Something went wrong'); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f4f8 0%, #e8edf5 50%, #f0f4f8 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative', overflow: 'hidden' }}>

      {/* Background decorations */}
      <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,102,204,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(109,40,217,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(0,102,204,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,102,204,0.04) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

      {/* Logo & branding */}
      <div style={{ textAlign: 'center', marginBottom: '2rem', animation: 'fadeInUp 0.6s ease both', position: 'relative', zIndex: 1 }}>
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1rem' }}>
          <div style={{ position: 'absolute', inset: -8, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(0,102,204,0.15), rgba(109,40,217,0.15))', animation: 'pulse-glow 3s ease-in-out infinite' }} />
          <img src={logoBase64} alt="AI Yuga" style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', display: 'block', position: 'relative', boxShadow: '0 8px 32px rgba(0,102,204,0.2)' }} />
        </div>
        <h1 style={{ fontFamily: 'Orbitron', fontSize: '2rem', fontWeight: 900, letterSpacing: '0.15em', color: '#0066cc', marginBottom: '0.3rem' }}>AI YUGA</h1>
        <p style={{ color: '#64748b', fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>PDA College of Engineering, Kalaburagi</p>
        <p style={{ color: '#94a3b8', fontSize: '0.72rem', letterSpacing: '0.05em' }}>Dept. of AI & Machine Learning</p>
      </div>

      {/* Card */}
      <div style={{ background: '#ffffff', borderRadius: 20, padding: '2rem', width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', position: 'relative', zIndex: 1, animation: 'fadeInUp 0.6s ease 0.15s both' }}>
        <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 3, background: 'linear-gradient(90deg, #0066cc, #6d28d9)', borderRadius: '0 0 4px 4px' }} />

        {/* Tabs */}
        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 4, marginBottom: '1.5rem' }}>
          {['login', 'register'].map(t => (
            <button key={t} onClick={() => { setTab(t); setError(''); }} style={{
              flex: 1, padding: '0.6rem', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', fontFamily: 'Inter, sans-serif', transition: 'all 0.2s',
              background: tab === t ? '#ffffff' : 'transparent',
              color: tab === t ? '#0066cc' : '#64748b',
              boxShadow: tab === t ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
          ))}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {tab === 'register' && (
            <div>
              <label className="label">Full Name</label>
              <input className="input" placeholder="Your name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
          )}
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', marginTop: '0.5rem', fontSize: '0.95rem' }} disabled={loading}>
            {loading ? 'Please wait...' : tab === 'login' ? 'Login →' : 'Create Account →'}
          </button>
        </form>
      </div>

      <p style={{ marginTop: '1.5rem', color: '#94a3b8', fontSize: '0.78rem', position: 'relative', zIndex: 1 }}>
        Department of Artificial Intelligence & Machine Learning • 2026
      </p>

      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse-glow { 0%,100% { opacity:0.5; transform:scale(1); } 50% { opacity:1; transform:scale(1.05); } }
      `}</style>
    </div>
  );
}