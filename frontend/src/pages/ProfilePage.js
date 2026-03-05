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
      const W = 1400, H = 950;
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');
      const CX = W / 2;

      // ── PURE WHITE BACKGROUND ──
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);

      // ── OUTER DECORATIVE BORDER (double) ──
      ctx.strokeStyle = '#0066cc';
      ctx.lineWidth = 3;
      ctx.strokeRect(18, 18, W - 36, H - 36);
      ctx.strokeStyle = 'rgba(0,102,204,0.25)';
      ctx.lineWidth = 1;
      ctx.strokeRect(28, 28, W - 56, H - 56);

      // ── TOP GRADIENT BAR ──
      const topGrad = ctx.createLinearGradient(0, 0, W, 0);
      topGrad.addColorStop(0, '#0066cc');
      topGrad.addColorStop(0.5, '#6d28d9');
      topGrad.addColorStop(1, '#0066cc');
      ctx.fillStyle = topGrad;
      ctx.fillRect(18, 18, W - 36, 8);

      // ── BOTTOM GRADIENT BAR ──
      ctx.fillStyle = topGrad;
      ctx.fillRect(18, H - 26, W - 36, 8);

      // ── CORNER DIAMONDS ──
      const drawDiamond = (x, y) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = '#0066cc';
        ctx.fillRect(-7, -7, 14, 14);
        ctx.restore();
      };
      [[38, 38], [W - 38, 38], [38, H - 38], [W - 38, H - 38]].forEach(([x,y]) => drawDiamond(x, y));

      // ── LOGO WATERMARK ──
      const drawLogoAndRest = () => {
        const logoImg = new Image();
        logoImg.onload = () => {
          ctx.save();
          ctx.globalAlpha = 0.05;
          ctx.drawImage(logoImg, CX - 180, H/2 - 200, 360, 360);
          ctx.globalAlpha = 1;
          ctx.restore();
          drawContent();
        };
        logoImg.onerror = drawContent;
        logoImg.src = logoBase64;
      };

      const drawContent = () => {
        ctx.textAlign = 'center';

        // ── CLUB NAME (top) ──
        ctx.font = 'bold 22px Georgia, serif';
        ctx.fillStyle = '#0066cc';
        ctx.letterSpacing = '0.15em';
        ctx.fillText('AI YUGA CLUB', CX, 75);

        ctx.font = '13px Georgia, serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText('PDA College of Engineering, Kalaburagi', CX, 98);

        // ── DIVIDER ──
        const hr = (y, opacity = 0.3) => {
          const g = ctx.createLinearGradient(120, 0, W - 120, 0);
          g.addColorStop(0, 'transparent');
          g.addColorStop(0.5, `rgba(0,102,204,${opacity})`);
          g.addColorStop(1, 'transparent');
          ctx.strokeStyle = g; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(120, y); ctx.lineTo(W - 120, y); ctx.stroke();
        };
        hr(115, 0.4);

        // ── CERTIFICATE TITLE ──
        ctx.font = 'bold 13px Georgia, serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('— CERTIFICATE OF PARTICIPATION —', CX, 150);

        // ── THIS CERTIFIES ──
        ctx.font = 'italic 19px Georgia, serif';
        ctx.fillStyle = '#475569';
        ctx.fillText('This is to proudly certify that', CX, 200);

        // ── PARTICIPANT NAME (largest element) ──
        ctx.font = 'bold 68px Georgia, serif';
        ctx.fillStyle = '#0f172a';
        ctx.fillText(profile.user.name, CX, 295);

        // Name underline
        const nw = ctx.measureText(profile.user.name).width;
        const nlg = ctx.createLinearGradient(CX - nw/2, 0, CX + nw/2, 0);
        nlg.addColorStop(0, 'transparent');
        nlg.addColorStop(0.3, '#0066cc');
        nlg.addColorStop(0.7, '#6d28d9');
        nlg.addColorStop(1, 'transparent');
        ctx.strokeStyle = nlg; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(CX - nw/2, 310); ctx.lineTo(CX + nw/2, 310); ctx.stroke();

        // ── TEAM ──
        ctx.font = '19px Georgia, serif';
        ctx.fillStyle = '#475569';
        ctx.fillText('as a member of Team', CX, 360);

        ctx.font = 'bold 26px Georgia, serif';
        ctx.fillStyle = '#6d28d9';
        ctx.fillText(`" ${team.team_name} "`, CX, 398);

        ctx.font = '19px Georgia, serif';
        ctx.fillStyle = '#475569';
        ctx.fillText('has successfully participated in', CX, 442);

        // ── EVENT NAME ──
        ctx.font = 'bold 32px Georgia, serif';
        ctx.fillStyle = '#0f172a';
        ctx.fillText(team.event_title, CX, 490);

        // ── SCORE BOX ──
        if (team.score) {
          const boxW = 280, boxH = 80, boxX = CX - 140, boxY = 515;
          const boxGrad = ctx.createLinearGradient(boxX, boxY, boxX + boxW, boxY);
          boxGrad.addColorStop(0, 'rgba(0,102,204,0.08)');
          boxGrad.addColorStop(1, 'rgba(109,40,217,0.08)');
          ctx.fillStyle = boxGrad;
          ctx.beginPath(); ctx.roundRect(boxX, boxY, boxW, boxH, 12); ctx.fill();
          ctx.strokeStyle = 'rgba(0,102,204,0.2)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.roundRect(boxX, boxY, boxW, boxH, 12); ctx.stroke();

          ctx.font = '13px sans-serif';
          ctx.fillStyle = '#64748b';
          ctx.fillText('SCORE ACHIEVED', CX, 538);
          ctx.font = 'bold 36px Georgia, serif';
          ctx.fillStyle = '#d97706';
          ctx.fillText(`${team.score}  /  10`, CX, 578);
        }

        // ── EVENT DATE ──
        const dateY = team.score ? 630 : 545;
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`Event Date: ${new Date(team.event_date).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}`, CX, dateY);

        hr(dateY + 25, 0.2);

        // ── SIGNATURES ──
        const sigY = dateY + 80;
        const drawSig = (x, align, title, sub1, sub2) => {
          ctx.textAlign = align;
          ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1;
          ctx.beginPath();
          const lx = align === 'left' ? x : x - 160;
          ctx.moveTo(lx, sigY - 20); ctx.lineTo(lx + 160, sigY - 20); ctx.stroke();
          ctx.font = 'bold 14px sans-serif'; ctx.fillStyle = '#1e293b';
          ctx.fillText(title, x, sigY);
          ctx.font = '12px sans-serif'; ctx.fillStyle = '#64748b';
          ctx.fillText(sub1, x, sigY + 18);
          ctx.fillText(sub2, x, sigY + 34);
        };
        drawSig(120, 'left', 'Department HOD', 'Dept. of AI & Machine Learning', 'PDA College of Engineering');
        drawSig(W - 120, 'right', 'AI YUGA Club President', 'AI YUGA Club', 'PDA College of Engineering');

        // ── CERT ID (bottom center) ──
        ctx.textAlign = 'center';
        ctx.font = '11px monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`Certificate ID: ${certId}`, CX, sigY + 10);
        ctx.fillText(`Verify at: ai-club-sigma.vercel.app/verify/${certId}`, CX, sigY + 26);

        // ── QR CODE (bottom right, above corner) ──
        const qrImg = new Image();
        qrImg.onload = () => {
          const qx = W - 145, qy = H - 175;
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.roundRect(qx - 5, qy - 5, 115, 115, 8); ctx.fill(); ctx.stroke();
          ctx.drawImage(qrImg, qx, qy, 105, 105);
          ctx.font = 'bold 9px monospace';
          ctx.fillStyle = '#64748b';
          ctx.fillText('SCAN TO VERIFY', qx + 52, qy + 120);

          // ── FOOTER ──
          ctx.font = '10px monospace';
          ctx.fillStyle = '#cbd5e1';
          ctx.fillText(`AI YUGA • ai-club-sigma.vercel.app • ${new Date().getFullYear()}`, CX, H - 38);

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