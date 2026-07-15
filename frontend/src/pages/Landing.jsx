import React from 'react';
import { useNavigate } from 'react-router-dom';
import { colors } from '../theme/colors';
import { Button } from '../components/ui/SharedUI';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    { icon: "🤖", title: "AI-Powered Diagnostics", desc: "Advanced symptom analysis and health guidance using cutting-edge AI technology." },
    { icon: "📅", title: "Smart Scheduling", desc: "Book appointments with top specialists instantly, with AI-based doctor matching." },
    { icon: "📋", title: "Digital Health Records", desc: "Secure, centralized storage for all your medical history, reports, and prescriptions." },
    { icon: "💊", title: "Medicine Reminders", desc: "Never miss a dose with intelligent medication tracking and reminder system." },
    { icon: "🔬", title: "Report Analysis", desc: "AI-powered analysis of lab reports and imaging with clear, actionable summaries." },
    { icon: "🔐", title: "Enterprise Security", desc: "Military-grade encryption protecting your sensitive medical information." },
  ];

  const stats = [
    { num: "50K+", label: "Patients Served" },
    { num: "500+", label: "Specialist Doctors" },
    { num: "98%", label: "Satisfaction Rate" },
    { num: "24/7", label: "AI Support" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "'Inter', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); @keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Nav */}
      <nav className="px-6 md:px-10" style={{ position: "sticky", top: 0, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${colors.border}`, height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 28 }}>🏥</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: colors.text }}>Health<span style={{ color: colors.primary }}>AI</span></span>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Button variant="primary" onClick={() => navigate('/login')} size="sm">Sign In</Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-12 md:py-20 md:px-10" style={{ background: `linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 50%, #FFF7ED 100%)`, textAlign: "center" }}>
        <div style={{ display: "inline-block", background: `${colors.primary}15`, color: colors.primary, borderRadius: 20, padding: "6px 18px", fontSize: 13, fontWeight: 600, marginBottom: 24, border: `1px solid ${colors.primary}30` }}>
          🚀 Next-Generation Healthcare Platform
        </div>
        <h1 style={{ fontSize: "clamp(32px, 5vw, 60px)", fontWeight: 800, color: colors.text, margin: "0 0 20px", lineHeight: 1.15, maxWidth: 700, marginLeft: "auto", marginRight: "auto" }}>
          Your Health, Powered by<br /><span style={{ color: colors.primary }}>Artificial Intelligence</span>
        </h1>
        <p style={{ fontSize: 18, color: colors.textMuted, maxWidth: 560, margin: "0 auto 40px", lineHeight: 1.7 }}>
          Experience personalized healthcare with AI-driven symptom analysis, instant doctor appointments, and intelligent medical record management.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <Button variant="primary" onClick={() => navigate('/register')} size="lg">👤 Patient Register</Button>
          <Button variant="outline" onClick={() => navigate('/login')} size="lg">🔑 Patient Login</Button>
          <Button variant="ghost" onClick={() => navigate('/doctor-login')} size="lg">👨‍⚕️ Doctor Login</Button>
          <Button variant="secondary" onClick={() => navigate('/doctor-register')} size="lg">⚕️ Join as Doctor</Button>
        </div>
        <div style={{ display: "flex", gap: 32, justifyContent: "center", marginTop: 48, flexWrap: "wrap" }}>
          {stats.map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: colors.primary }}>{s.num}</div>
              <div style={{ fontSize: 13, color: colors.textMuted }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-12 md:py-20 md:px-10" style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: colors.text, margin: "0 0 12px" }}>Everything You Need for Better Health</h2>
          <p style={{ fontSize: 16, color: colors.textMuted }}>Comprehensive healthcare management in one intelligent platform</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
          {features.map(f => (
            <div key={f.title} style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 28, transition: "all 0.2s" }}>
              <div style={{ fontSize: 36, marginBottom: 14 }}>{f.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.text, margin: "0 0 8px" }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: colors.textMuted, margin: 0, lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-12 md:py-16 md:px-10" style={{ background: colors.primary, textAlign: "center" }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, color: "#fff", margin: "0 0 16px" }}>Ready to Transform Your Healthcare?</h2>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.8)", margin: "0 0 32px" }}>Join thousands of patients and doctors already using HealthAI</p>
        <Button onClick={() => navigate('/register')} style={{ background: "#fff", color: colors.primary, padding: "14px 36px", fontSize: 16, fontWeight: 700, border: "none", borderRadius: 10, cursor: "pointer" }}>
          Patient Register
        </Button>
      </section>

      <footer className="px-6 py-8 md:py-8 md:px-10" style={{ background: colors.sidebar, textAlign: "center", color: colors.sidebarText, fontSize: 13, display: "flex", flexDirection: "column", gap: 12 }}>
        <div>© 2026 HealthAI • Secure • HIPAA Compliant • Powered by Google Gemini</div>
        <div>
          <button onClick={() => navigate('/admin-login')} style={{ background: "none", border: "none", color: colors.textMuted, cursor: "pointer", fontSize: 12, textDecoration: "underline" }}>
            Admin Login
          </button>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
