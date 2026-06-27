import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors } from '../../theme/colors';
import { Button, Input } from '../../components/ui/SharedUI';
import { useAuth } from '../../context/AuthContext';

const DoctorLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.email || !form.password) { 
      setError("Please fill all fields"); 
      return; 
    }
    setLoading(true); 
    setError("");
    
    try {
      const res = await login(form.email, form.password);
      if (res.success) {
        if (res.user.role === 'doctor' || res.user.role === 'admin') {
          navigate('/dashboard/doctor-dashboard');
        } else {
          setError("Access denied. Doctor privileges required.");
        }
      } else {
        setError(res.message || "Authentication failed");
      }
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, #EFF6FF, #F0FDF4)`, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ background: colors.surface, borderRadius: 20, padding: "40px", width: "100%", maxWidth: 420, border: `1px solid ${colors.border}` }}>
        <button onClick={() => navigate('/')} style={{ background: "none", border: "none", cursor: "pointer", color: colors.primary, fontSize: 14, marginBottom: 24, display: "flex", alignItems: "center", gap: 6 }}>← Back to Home</button>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👨‍⚕️</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: colors.text, margin: "0 0 6px" }}>Doctor Login</h1>
          <p style={{ fontSize: 14, color: colors.textMuted, margin: 0 }}>Secure Portal Access</p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 10, textAlign: "center" }}>Quick Demo Login</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { set("email", "sarah@healthsys.com"); set("password", "Doctor@123"); }} style={{ flex: 1, padding: "8px 4px", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.surfaceAlt, cursor: "pointer", fontSize: 12, color: colors.text, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 20 }}>🩺</span>
              <span style={{ fontWeight: 600 }}>Doctor</span>
            </button>
          </div>
        </div>

        <Input label="Email Address" type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="doctor@healthsys.com" icon="📧" />
        <Input label="Password" type="password" value={form.password} onChange={e => set("password", e.target.value)} placeholder="••••••••" icon="🔒" />
        
        {error && <div style={{ background: `${colors.danger}15`, color: colors.danger, borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 16 }}>⚠️ {error}</div>}
        
        <Button variant="primary" onClick={handleSubmit} disabled={loading} style={{ width: "100%", padding: "13px", fontSize: 15 }}>
          {loading ? "Authenticating..." : "Login to Portal →"}
        </Button>
      </div>
    </div>
  );
};

export default DoctorLogin;
