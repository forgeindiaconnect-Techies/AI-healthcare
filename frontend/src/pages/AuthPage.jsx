import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { colors } from '../theme/colors';
import { Button, Input, Select } from '../components/ui/SharedUI';
import { useAuth } from '../context/AuthContext';

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, user } = useAuth();
  
  // Determine initial mode based on URL
  const [mode, setMode] = useState(location.pathname === '/register' ? 'register' : 'login');
  
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "patient" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Removed auto-redirect useEffect so that navigating to /login stays on the login page as requested.



  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!form.email || !form.password || (mode === 'register' && !form.name)) { 
      setError("Please fill all fields"); 
      return; 
    }
    setLoading(true); 
    setError("");
    
    try {
      let result;
      if (mode === 'login') {
        result = await login(form.email, form.password);
      } else {
        result = await register(form.name, form.email, form.password, form.role);
      }
      
      if (!result.success) {
        throw new Error(result.message);
      }
      
      // Redirect based on user role after successful login
      const userRole = result.user.role;
      if (userRole === 'admin') {
        navigate('/dashboard/admin');
      } else if (userRole === 'doctor') {
        navigate('/dashboard/doctor-dashboard');
      } else {
        navigate('/dashboard/patients');
      }
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    const newMode = mode === 'login' ? 'register' : 'login';
    setMode(newMode);
    navigate(`/${newMode}`);
  };

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, #EFF6FF, #F0FDF4)`, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ background: colors.surface, borderRadius: 20, padding: "40px", width: "100%", maxWidth: 420, border: `1px solid ${colors.border}` }}>
        <button onClick={() => navigate('/')} style={{ background: "none", border: "none", cursor: "pointer", color: colors.primary, fontSize: 14, marginBottom: 24, display: "flex", alignItems: "center", gap: 6 }}>← Back to Home</button>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏥</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: colors.text, margin: "0 0 6px" }}>{mode === "login" ? "Welcome Back" : "Create Account"}</h1>
          <p style={{ fontSize: 14, color: colors.textMuted, margin: 0 }}>HealthAI Healthcare Platform</p>
        </div>



        <form autoComplete="off" onSubmit={handleSubmit}>
          {mode === "register" && <Input label="Full Name" name="healthai_login_name" autoComplete="off" value={form.name} onChange={e => set("name", e.target.value)} placeholder="John Doe" icon="👤" />}
          <Input label="Email Address" type="email" name="healthai_login_email" autoComplete="off" value={form.email} onChange={e => set("email", e.target.value)} placeholder="you@example.com" icon="📧" />
          <Input label="Password" type="password" name="healthai_login_password" autoComplete="new-password" value={form.password} onChange={e => set("password", e.target.value)} placeholder="••••••••" icon="🔒" />
          {mode === "register" && (
            <Select label="Register As" value={form.role} onChange={e => set("role", e.target.value)} options={[{ value: "patient", label: "Patient" }]} disabled />
          )}
          {error && <div style={{ background: `${colors.danger}15`, color: colors.danger, borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 16 }}>⚠️ {error}</div>}
          <Button variant="primary" onClick={handleSubmit} disabled={loading} style={{ width: "100%", padding: "13px", fontSize: 15 }}>
            {loading ? "Please wait..." : mode === "login" ? "Sign In →" : "Create Account →"}
          </Button>
        </form>
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: colors.textMuted }}>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button onClick={switchMode} style={{ background: "none", border: "none", color: colors.primary, cursor: "pointer", fontWeight: 600 }}>
            {mode === "login" ? "Sign Up" : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
