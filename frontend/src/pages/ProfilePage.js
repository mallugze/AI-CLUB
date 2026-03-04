import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { profileAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

export default function ProfilePage() {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const targetId = userId || user?.id;

  useEffect(() => {
    profileAPI.get(targetId).then(r => {
      setProfile(r.data);
      setLoading(false);
    }).catch(() => { setLoading(false); navigate('/events'); });
  }, [targetId]);

  const handleDownloadCert = (team) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200; canvas.height = 800;
    const ctx = canvas.getContext('2d');

    // Background
    const bg = ctx.createLinearGradient(0, 0, 1200, 800);
    bg.addColorStop(0, '#020817');
    bg.addColorStop(0.5, '#0a1628');
    bg.addColorStop(1, '#050f1f');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1200, 800);

    // Outer border
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, 1160, 760);
    ctx.strokeStyle = 'rgba(0,212,255,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(30, 30, 1140, 740);

    // Corner decorations
    const corners = [[40,40],[1160,40],[40,760],[1160,760]];
    corners.forEach(([x,y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, Math.PI*2);
      ctx.fillStyle = '#00d4ff';
      ctx.fill();
    });

    // Header
    ctx.fillStyle = '#00d4ff';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('AI YUGA — PDA COLLEGE OF ENGINEERING, KALABURAGI', 600, 80);
    ctx.fillStyle = 'rgba(0,212,255,0.5)';
    ctx.font = '13px monospace';
    ctx.fillText('DEPARTMENT OF ARTIFICIAL INTELLIGENCE AND MACHINE LEARNING', 600, 105);

    // Divider
    const grad = ctx.createLinearGradient(100, 0, 1100, 0);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(0.5, '#00d4ff');
    grad.addColorStop(1, 'transparent');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(100, 125); ctx.lineTo(1100, 125); ctx.stroke();

    // Certificate of Participation text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px serif';
    ctx.fillText('CERTIFICATE OF PARTICIPATION', 600, 210);

    // "This certifies that"
    ctx.fillStyle = '#94a3b8';
    ctx.font = '22px serif';
    ctx.fillText('This certifies that', 600, 270);

    // Name
    ctx.fillStyle = '#00d4ff';
    ctx.font = 'bold 52px serif';
    ctx.fillText(profile.user.name, 600, 345);

    // Underline
    const nameWidth = ctx.measureText(profile.user.name).width;
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(600 - nameWidth/2, 360);
    ctx.lineTo(600 + nameWidth/2, 360);
    ctx.stroke();

    // Team info
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '20px serif';
    ctx.fillText(`as a member of Team "${team.team_name}"`, 600, 405);

    // Event
    ctx.fillStyle = '#94a3b8';
    ctx.font = '18px serif';
    ctx.fillText(`has successfully participated in`, 600, 445);
    ctx.fillStyle = '#7c3aed';
    ctx.font = 'bold 30px serif';
    ctx.fillText(team.event_title, 600, 490);

    // Score if available
    if (team.score) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '18px serif';
      ctx.fillText(`with a score of`, 600, 530);
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 38px monospace';
      ctx.fillText(`${team.score} / 10`, 600, 575);
    }

    // Date
    ctx.fillStyle = '#64748b';
    ctx.font = '16px monospace';
    ctx.fillText(`Event Date: ${new Date(team.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, 600, 630);

    // Bottom divider
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(100, 660); ctx.lineTo(1100, 660); ctx.stroke();

    // Footer
    ctx.fillStyle = 'rgba(0,212,255,0.4)';
    ctx.font = '13px monospace';
    ctx.fillText('AI YUGA • aiyuga.club • Generated ' + new Date().toLocaleDateString(), 600, 690);

    // Download
    const link = document.createElement('a');
    link.download = `certificate_${profile.user.name}_${team.event_title}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  if (loading) return (
    <>
      <Navbar />
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Loading profile...</div>
    </>
  );

  if (!profile) return null;

  const { user: pUser, teams, totalScore, avgScore } = profile;
  const SUPER_ADMIN_EMAIL = 'mallug@gmail.com';
  const isOwn = user?.id === parseInt(targetId);

  return (
    <>
      <Navbar />
      <div className="scanline" />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem' }}>

        {/* Profile header */}
        <div className="card fade-in" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(0,212,255,0.08), rgba(124,58,237,0.05))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
              background: pUser.email === SUPER_ADMIN_EMAIL
                ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
                : pUser.role === 'admin'
                ? 'linear-gradient(135deg, var(--accent2), #5b21b6)'
                : 'linear-gradient(135deg, var(--accent), #0099bb)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', fontWeight: 900, color: '#000',
              boxShadow: '0 0 20px rgba(0,212,255,0.4)',
              fontFamily: 'Orbitron',
            }}>
              {pUser.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{pUser.name}</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{pUser.email}</p>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <span className={`badge badge-${pUser.role === 'admin' ? 'purple' : 'cyan'}`}>{pUser.role}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                  Joined {new Date(pUser.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              {[
                { label: 'Events', value: teams.length },
                { label: 'Avg Score', value: avgScore || '—' },
                { label: 'Total Score', value: Math.round(totalScore * 10) / 10 || '—' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Orbitron', fontSize: '1.5rem', color: 'var(--accent)', fontWeight: 700 }}>{s.value}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Team history */}
        <h2 style={{ fontFamily: 'Orbitron', fontSize: '1rem', color: 'var(--accent)', marginBottom: '1rem', animation: 'fadeInUp 0.5s ease 0.2s both' }}>
          📋 Event History
        </h2>

        {teams.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <h3>No events yet</h3>
            <p>Participate in events to build your history!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {teams.map((t, i) => (
              <div key={i} className="card fade-in" style={{ animationDelay: `${i * 0.08}s`, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                  🎯
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{t.team_name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.event_title} • {new Date(t.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {t.score ? (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'Orbitron', color: '#fbbf24', fontWeight: 700 }}>{t.score}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>/ 10</div>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No score</span>
                  )}
                  <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}
                    onClick={() => handleDownloadCert(t)}>
                    📄 Certificate
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}