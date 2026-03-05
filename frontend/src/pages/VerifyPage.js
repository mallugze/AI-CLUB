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
    <div style={{ minHeight: '100vh', background: '#f0f4f8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Inter:wght@400;600;700&display=swap');
        @keyframes fadeInUp { from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);} }
        @keyframes pulse { 0%,100%{box-shadow:0 0 10px rgba(0,102,204,0.2);}50%{box-shadow:0 0 25px rgba(0,102,204,0.5);} }
        * { margin:0; padding:0; box-sizing:border-box; font-family:'Inter',sans-serif; }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontFamily: 'Orbitron', fontWeight: 900, fontSize: '1.3rem', color: '#0066cc', letterSpacing: '0.1em' }}>AI YUGA</div>
        <div style={{ fontSize: '0.75rem', color: '#64748b', letterSpacing: '0.06em' }}>CERTIFICATE VERIFICATION PORTAL</div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', background: '#fff', borderRadius: 16, padding: '3rem 4rem', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          <div style={{ fontFamily: 'Orbitron', color: '#0066cc', fontSize: '0.9rem', letterSpacing: '0.1em', marginBottom: '1rem' }}>VERIFYING CERTIFICATE...</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            {[0,1,2].map(i => <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: '#0066cc', animation: `pulse ${0.8+i*0.2}s ease-in-out ${i*0.2}s infinite` }} />)}
          </div>
        </div>
      ) : result?.valid ? (
        <div style={{ animation: 'fadeInUp 0.5s ease', width: '100%', maxWidth: 560 }}>
          {/* Valid banner */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(5,150,105,0.1)', border: '2px solid rgba(5,150,105,0.4)', borderRadius: 999, padding: '0.6rem 1.5rem' }}>
              <span style={{ fontSize: '1.4rem' }}>✅</span>
              <span style={{ fontFamily: 'Orbitron', color: '#047857', fontSize: '0.95rem', letterSpacing: '0.1em', fontWeight: 700 }}>VALID CERTIFICATE</span>
            </div>
          </div>

          {/* Certificate card */}
          <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
            <div style={{ background: 'linear-gradient(135deg, #0066cc, #6d28d9)', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: 'Orbitron', fontWeight: 900, fontSize: '1rem', color: '#fff' }}>AI YUGA</div>
                <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.75)', letterSpacing: '0.05em' }}>PDA COLLEGE OF ENGINEERING, KALABURAGI</div>
              </div>
              <div style={{ fontFamily: 'Orbitron', fontSize: '0.75rem', color: 'rgba(255,255,255,0.9)', fontWeight: 700, background: 'rgba(255,255,255,0.15)', padding: '0.3rem 0.75rem', borderRadius: 6 }}>{result.cert.certificate_id}</div>
            </div>

            <div style={{ padding: '2rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>Awarded to</div>
                <div style={{ fontFamily: 'Orbitron', fontSize: '1.4rem', color: '#0066cc', fontWeight: 700 }}>{result.cert.user_name}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {[
                  { label: 'Team', value: result.cert.team_name },
                  { label: 'Event', value: result.cert.event_title },
                  { label: 'Score', value: result.cert.score ? `${result.cert.score} / 10` : 'Participation' },
                  { label: 'Date', value: new Date(result.cert.event_date).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' }) },
                ].map((item, i) => (
                  <div key={i} style={{ background: '#f8fafc', borderRadius: 10, padding: '0.875rem', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>{item.label}</div>
                    <div style={{ fontWeight: 600, color: i===2 ? '#d97706' : '#1e293b', fontFamily: i===2 ? 'Orbitron,sans-serif' : 'Inter,sans-serif', fontSize: i===2 ? '1.1rem' : '0.9rem' }}>{item.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Issued: {new Date(result.cert.issued_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</div>
                <div style={{ fontSize: '0.72rem', color: '#047857', fontWeight: 600 }}>✓ Verified by AI YUGA</div>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <Link to="/events" style={{ color: '#0066cc', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 500 }}>← Back to AI YUGA</Link>
          </div>
        </div>
      ) : (
        <div style={{ animation: 'fadeInUp 0.5s ease', textAlign: 'center', background: '#fff', borderRadius: 16, padding: '3rem', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', maxWidth: 440, width: '100%' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
          <div style={{ fontFamily: 'Orbitron', color: '#dc2626', fontSize: '1rem', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '1rem' }}>INVALID CERTIFICATE</div>
          <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>Certificate ID <strong style={{ color: '#1e293b' }}>{certId}</strong> was not found.</p>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>This certificate may be fake or the ID is incorrect.</p>
          <Link to="/events" style={{ display: 'inline-block', marginTop: '2rem', color: '#0066cc', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 500 }}>← Back to AI YUGA</Link>
        </div>
      )}
    </div>
  );
}