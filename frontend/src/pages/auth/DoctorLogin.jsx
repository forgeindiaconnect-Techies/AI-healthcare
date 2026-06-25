import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors } from '../../theme/colors';
import { Button, Input } from '../../components/ui/SharedUI';
import { useAuth } from '../../context/AuthContext';

const DoctorLogin = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If already logged in as doctor, redirect to doctor dashboard
  useEffect(() => {
    if (user && user.role === 'doctor') {
      navigate('/doctor-dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { 
      setError("Please fill all fields"); 
      return; 
    }
    setLoading(true); 
    setError("");
    
    try {
      const response = await login(email, password);
      if (response.success) {
        // Successful authentication
        navigate('/doctor-dashboard');
      } else {
        // Invalid credentials
        setError(response.message || "Invalid email or password");
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
          <p style={{ fontSize: 14, color: colors.textMuted, margin: 0 }}>Access your Doctor Dashboard</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Input 
            label="Email Address" 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            placeholder="doctor@example.com" 
            icon="📧" 
          />
          <Input 
            label="Password" 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            placeholder="••••••••" 
            icon="🔒" 
          />
          {error && <div style={{ background: `${colors.danger}15`, color: colors.danger, borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 16 }}>⚠️ {error}</div>}
          <Button type="submit" variant="primary" disabled={loading} style={{ width: "100%", padding: "13px", fontSize: 15 }}>
            {loading ? "Authenticating..." : "Login to Dashboard →"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default DoctorLogin;
