import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { certificatesAPI } from '../api';

export default function VerifyPage() {
  const { certId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    certificatesAPI.verify(certId)
      .then(r => { setResult({ valid: true, cert: r.data.certificate }); setLoading(false); })
      .catch(() => { setResult({ valid: false }); setLoading(false); });
  }, [certId]);

  return (
    <div style={{ minHeight: '100vh', background: '#020817', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Exo+2:wght@300;400;600&display=swap');
        @keyframes fadeInUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { box-shadow: 0 0 20px rgba(0,212,255,0.3); } 50% { box-shadow: 0 0 50px rgba(0,212,255,0.7); } }
        @keyframes invalidPulse { 0%,100% { box-shadow: 0 0 20px rgba(239,68,68,0.3); } 50% { box-shadow: 0 0 50px rgba(239,68,68,0.6); } }
        * { margin:0; padding:0; box-sizing:border-box; font-family:'Exo 2',sans-serif; color:#e2e8f0; }
      `}</style>

      {loading ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'Orbitron', color: '#00d4ff', fontSize: '1rem', letterSpacing: '0.1em' }}>VERIFYING...</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: '1rem' }}>
            {[0,1,2].map(i => <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: '#00d4ff', animation: `pulse ${0.8 + i*0.2}s ease-in-out infinite` }} />)}
          </div>
        </div>
      ) : result?.valid ? (
        <div style={{ animation: 'fadeInUp 0.6s ease', width: '100%', maxWidth: 560 }}>
          {/* Valid badge */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.5)', borderRadius: 999, padding: '0.6rem 1.5rem', animation: 'pulse 2s ease-in-out infinite' }}>
              <span style={{ fontSize: '1.5rem' }}>✅</span>
              <span style={{ fontFamily: 'Orbitron', color: '#10b981', fontSize: '1rem', letterSpacing: '0.1em', fontWeight: 700 }}>VALID CERTIFICATE</span>
            </div>
          </div>

          {/* Certificate card */}
          <div style={{ background: '#0a1628', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 0 60px rgba(0,212,255,0.1)' }}>
            {/* Top bar */}
            <div style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: 'Orbitron', fontWeight: 900, fontSize: '1.1rem', color: '#000' }}>AI YUGA</div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(0,0,0,0.7)', letterSpacing: '0.05em' }}>PDA COLLEGE OF ENGINEERING</div>
              </div>
              <div style={{ fontFamily: 'Orbitron', fontSize: '0.75rem', color: 'rgba(0,0,0,0.8)', fontWeight: 700 }}>{result.cert.certificate_id}</div>
            </div>

            {/* Details */}
            <div style={{ padding: '2rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Awarded to</div>
                <div style={{ fontFamily: 'Orbitron', fontSize: '1.5rem', color: '#00d4ff', fontWeight: 700 }}>{result.cert.user_name}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                  { label: 'Team', value: result.cert.team_name },
                  { label: 'Event', value: result.cert.event_title },
                  { label: 'Score', value: result.cert.score ? `${result.cert.score} / 10` : 'Participation' },
                  { label: 'Date', value: new Date(result.cert.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
                ].map((item, i) => (
                  <div key={i} style={{ background: '#050f1f', borderRadius: 10, padding: '0.875rem', border: '1px solid #1a3a5c' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>{item.label}</div>
                    <div style={{ fontWeight: 600, color: i === 2 ? '#fbbf24' : '#e2e8f0', fontFamily: i === 2 ? 'Orbitron' : 'inherit', fontSize: i === 2 ? '1.1rem' : '0.9rem' }}>{item.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid #1a3a5c', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Issued: {new Date(result.cert.issued_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#10b981', fontFamily: 'Orbitron' }}>✓ Verified by AI YUGA</div>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <Link to="/events" style={{ color: '#00d4ff', fontSize: '0.85rem', textDecoration: 'none' }}>← Back to AI YUGA</Link>
          </div>
        </div>
      ) : (
        <div style={{ animation: 'fadeInUp 0.6s ease', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(239,68,68,0.15)', border: '2px solid rgba(239,68,68,0.5)', borderRadius: 999, padding: '0.6rem 1.5rem', marginBottom: '2rem', animation: 'invalidPulse 2s ease-in-out infinite' }}>
            <span style={{ fontSize: '1.5rem' }}>❌</span>
            <span style={{ fontFamily: 'Orbitron', color: '#ef4444', fontSize: '1rem', letterSpacing: '0.1em', fontWeight: 700 }}>INVALID CERTIFICATE</span>
          </div>
          <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>Certificate ID <strong style={{ color: '#e2e8f0' }}>{certId}</strong> was not found.</p>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>This certificate may be fake or the ID may be incorrect.</p>
          <Link to="/events" style={{ display: 'inline-block', marginTop: '2rem', color: '#00d4ff', fontSize: '0.85rem', textDecoration: 'none' }}>← Back to AI YUGA</Link>
        </div>
      )}
    </div>
  );
}