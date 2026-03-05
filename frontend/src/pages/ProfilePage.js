import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { profileAPI, certificatesAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import logoBase64 from '../logo';

export default function ProfilePage() {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(null);
  const [msg, setMsg] = useState('');

  const targetId = userId || user?.id;

  useEffect(() => {
    profileAPI.get(targetId)
      .then(r => { setProfile(r.data); setLoading(false); })
      .catch(() => { setLoading(false); navigate('/events'); });
  }, [targetId]);

  const showMsg = (m) => { setMsg(m); setTimeout(() => setMsg(''), 4000); };

  const handleDownloadCert = async (team) => {
    setGenerating(team.team_id);
    try {
      // 1. Issue / get certificate ID from backend
      const issueRes = await certificatesAPI.issue(team.team_id, team.event_id, profile.user.id, profile.user.name);
      const certId = issueRes.data.certificate_id;

      // 2. Get QR code from backend
      const qrRes = await certificatesAPI.getQR(certId);
      const qrDataUrl = qrRes.data.qr;

      // 3. Draw certificate on canvas
      await drawCertificate({ team, certId, qrDataUrl });
    } catch (e) {
      const errMsg = e.response?.data?.error || e.message || 'Unknown error';
      showMsg(`❌ Error: ${errMsg}`);
      console.error('Certificate error:', e.response?.data || e);
    }
    setGenerating(null);
  };

  const drawCertificate = ({ team, certId, qrDataUrl }) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1400; canvas.height = 900;
      const ctx = canvas.getContext('2d');

      // ── WHITE BACKGROUND ──
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 1400, 900);

      // ── SUBTLE GRID WATERMARK ──
      ctx.strokeStyle = 'rgba(0,150,200,0.06)';
      ctx.lineWidth = 1;
      for (let x = 0; x < 1400; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 900); ctx.stroke(); }
      for (let y = 0; y < 900; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1400, y); ctx.stroke(); }

      // ── LOGO WATERMARK (center, low opacity) ──
      const drawLogoAndRest = () => {
        const logoImg = new Image();
        logoImg.onload = () => {
          ctx.save();
          ctx.globalAlpha = 0.06;
          ctx.drawImage(logoImg, 1400/2 - 200, 900/2 - 200, 400, 400);
          ctx.globalAlpha = 1;
          ctx.restore();
          drawContent();
        };
        logoImg.onerror = drawContent;
        logoImg.src = logoBase64;
      };

      const drawContent = () => {
        // ── TOP BORDER BAR ──
        const topGrad = ctx.createLinearGradient(0, 0, 1400, 0);
        topGrad.addColorStop(0, '#ffffff');
        topGrad.addColorStop(0.5, '#0066cc');
        topGrad.addColorStop(1, '#7c3aed');
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, 1400, 10);

        // ── BOTTOM BORDER BAR ──
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 890, 1400, 10);

        // ── LEFT ACCENT BAR ──
        ctx.fillStyle = '#0066cc';
        ctx.fillRect(0, 0, 6, 900);

        // ── RIGHT ACCENT BAR ──
        ctx.fillStyle = '#7c3aed';
        ctx.fillRect(1394, 0, 6, 900);

        // ── CORNER ORNAMENTS ──
        const corners = [[30, 30], [1370, 30], [30, 870], [1370, 870]];
        corners.forEach(([x, y]) => {
          ctx.strokeStyle = '#0066cc';
          ctx.lineWidth = 2;
          ctx.strokeRect(x - 15, y - 15, 30, 30);
          ctx.fillStyle = '#0066cc';
          ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
        });

        // ── HEADER SECTION ──
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PDA COLLEGE OF ENGINEERING KALABURAGI', 700, 55);
        ctx.fillStyle = '#64748b';
        ctx.font = '12px monospace';
        ctx.fillText('DEPARTMENT OF ARTIFICIAL INTELLIGENCE AND MACHINE LEARNING', 700, 78);

        // Horizontal rule
        const hrGrad = ctx.createLinearGradient(100, 0, 1300, 0);
        hrGrad.addColorStop(0, 'transparent'); hrGrad.addColorStop(0.5, '#0066cc'); hrGrad.addColorStop(1, 'transparent');
        ctx.strokeStyle = hrGrad; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(100, 98); ctx.lineTo(1300, 98); ctx.stroke();

        // ── CERTIFICATE OF PARTICIPATION ──
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 42px Georgia, serif';
        ctx.fillText('CERTIFICATE OF PARTICIPATION', 700, 170);

        // Decorative line under title
        ctx.strokeStyle = '#0066cc'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(350, 185); ctx.lineTo(1050, 185); ctx.stroke();

        // ── THIS CERTIFIES ──
        ctx.fillStyle = '#475569';
        ctx.font = '20px Georgia, serif';
        ctx.fillText('This is to certify that', 700, 240);

        // ── PARTICIPANT NAME ──
        ctx.font = 'bold 62px Georgia, serif';
        ctx.fillStyle = '#0f172a';
        ctx.fillText(profile.user.name, 700, 320);

        // Name underline
        const nameW = ctx.measureText(profile.user.name).width;
        const lineGrad = ctx.createLinearGradient(700 - nameW/2, 0, 700 + nameW/2, 0);
        lineGrad.addColorStop(0, 'transparent'); lineGrad.addColorStop(0.5, '#ffffff'); lineGrad.addColorStop(1, 'transparent');
        ctx.strokeStyle = lineGrad; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(700 - nameW/2, 335); ctx.lineTo(700 + nameW/2, 335); ctx.stroke();

        // ── TEAM & PARTICIPATION ──
        ctx.fillStyle = '#475569';
        ctx.font = '20px Georgia, serif';
        ctx.fillText(`as a member of Team`, 700, 385);

        ctx.fillStyle = '#7c3aed';
        ctx.font = 'bold 28px Georgia, serif';
        ctx.fillText(`"${team.team_name}"`, 700, 420);

        ctx.fillStyle = '#475569';
        ctx.font = '20px Georgia, serif';
        ctx.fillText('has successfully participated in', 700, 465);

        // ── EVENT NAME ──
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 34px Georgia, serif';
        ctx.fillText(team.event_title, 700, 510);

        // ── SCORE ──
        if (team.score) {
          ctx.fillStyle = '#64748b';
          ctx.font = '18px Georgia, serif';
          ctx.fillText('with a score of', 700, 555);
          ctx.fillStyle = '#d97706';
          ctx.font = 'bold 42px Orbitron, monospace';
          ctx.fillText(`${team.score}  /  10`, 700, 605);
        }

        // ── DATE ──
        ctx.fillStyle = '#94a3b8';
        ctx.font = '15px monospace';
        ctx.fillText(`Event Date: ${new Date(team.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, 700, 645);

        // ── HORIZONTAL RULE ──
        ctx.strokeStyle = '##1e293b'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(80, 680); ctx.lineTo(1320, 680); ctx.stroke();

        // ── SIGNATURE SECTION ──
        // Left signature
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('_______________________', 100, 740);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText('Faculty Coordinator', 100, 762);
        ctx.fillStyle = '#64748b';
        ctx.font = '12px sans-serif';
        ctx.fillText('Dept. of AI & Machine Learning', 100, 780);
        ctx.fillText('PDA College of Engineering', 100, 795);

        // Right signature
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px monospace';
        ctx.fillText('_______________________', 1300, 740);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText('Club President', 1300, 762);
        ctx.fillStyle = '#64748b';
        ctx.font = '12px sans-serif';
        ctx.fillText('AI YUGA Club', 1300, 780);
        ctx.fillText('PDA College of Engineering', 1300, 795);

        // ── CERT ID (bottom center) ──
        ctx.textAlign = 'center';
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px monospace';
        ctx.fillText(`Certificate ID: ${certId}`, 700, 758);
        ctx.fillText(`Verify at: ai-club-sigma.vercel.app/verify/${certId}`, 700, 775);

        // ── QR CODE ──
        const qrImg = new Image();
        qrImg.onload = () => {
          // QR box background
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '##1e293b';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(1165, 695, 110, 110, 8);
          ctx.fill(); ctx.stroke();
          ctx.drawImage(qrImg, 1170, 700, 100, 100);
          ctx.fillStyle = '#94a3b8';
          ctx.font = '9px monospace';
          ctx.fillText('SCAN TO VERIFY', 1220, 817);

          // ── FOOTER ──
          ctx.fillStyle = '#cbd5e1';
          ctx.font = '11px monospace';
          ctx.fillText(`AI YUGA • ai-club-sigma.vercel.app • ${new Date().getFullYear()}`, 700, 855);

          // ── DOWNLOAD ──
          const link = document.createElement('a');
          link.download = `AIY_Certificate_${certId}.png`;
          link.href = canvas.toDataURL('image/png', 1.0);
          link.click();
          resolve();
        };
        qrImg.onerror = () => {
          const link = document.createElement('a');
          link.download = `AIY_Certificate_${certId}.png`;
          link.href = canvas.toDataURL('image/png', 1.0);
          link.click();
          resolve();
        };
        qrImg.src = qrDataUrl;
      };

      drawLogoAndRest();
    });
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
  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;

  return (
    <>
      <Navbar />
      <div className="scanline" />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem' }}>

        {/* Profile header */}
        <div className="card fade-in" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(0,102,204,0.07), rgba(124,58,237,0.04))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
              background: pUser.email === SUPER_ADMIN_EMAIL
                ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
                : pUser.role === 'admin'
                ? 'linear-gradient(135deg, var(--accent2), #5b21b6)'
                : 'linear-gradient(135deg, var(--accent), #0099bb)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', fontWeight: 900, color: '#000', fontFamily: 'Orbitron',
              boxShadow: '0 0 20px rgba(0,102,204,0.4)',
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
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              {[{ label: 'Events', value: teams.length }, { label: 'Avg Score', value: avgScore || '—' }, { label: 'Best', value: teams.length ? Math.max(...teams.map(t => t.score || 0)) || '—' : '—' }].map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Orbitron', fontSize: '1.5rem', color: 'var(--accent)', fontWeight: 700 }}>{s.value}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {msg && <div className="alert alert-success fade-in">{msg}</div>}

        <h2 style={{ fontFamily: 'Orbitron', fontSize: '1rem', color: 'var(--accent)', marginBottom: '1rem', animation: 'fadeInUp 0.5s ease 0.2s both' }}>
          📋 Event History & Certificates
        </h2>

        {teams.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">🎯</div><h3>No events yet</h3><p>Participate in events to build your history!</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {teams.map((t, i) => (
              <div key={i} className="card fade-in" style={{ animationDelay: `${i * 0.08}s`, display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>🎯</div>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <div style={{ fontWeight: 700 }}>{t.team_name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.event_title} • {new Date(t.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {t.score != null ? (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'Orbitron', color: '#fbbf24', fontWeight: 700 }}>{t.score}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>/ 10</div>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Participated</span>
                  )}
                  {isSuperAdmin && (
                    <button
                      className="btn btn-primary"
                      style={{ fontSize: '0.78rem', padding: '0.45rem 1rem', opacity: generating === t.team_id ? 0.7 : 1 }}
                      disabled={generating === t.team_id}
                      onClick={() => handleDownloadCert(t)}
                    >
                      {generating === t.team_id ? '⏳ Generating...' : '📄 Download Certificate'}
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