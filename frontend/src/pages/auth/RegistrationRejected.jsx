import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { Button } from '../../components/ui/SharedUI';

const RegistrationRejected = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  
  const rejectionReason = location.state?.message || "Your registration was rejected. Please contact the administrator.";

  const handleLogout = () => {
    logout();
    navigate('/doctor-login');
  };

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, #FEF2F2, #FEF2F2)`, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ background: colors.surface, borderRadius: 20, padding: "40px", width: "100%", maxWidth: 480, border: `1px solid ${colors.border}`, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: colors.danger, margin: "0 0 16px" }}>Registration Not Approved</h1>
        
        <div style={{ background: `${colors.danger}15`, color: colors.danger, borderRadius: 8, padding: "16px", marginBottom: 32, fontSize: 14, textAlign: 'left', border: `1px solid ${colors.danger}30` }}>
          <strong style={{ display: 'block', marginBottom: '8px' }}>Reason:</strong>
          {rejectionReason}
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Button variant="primary" onClick={() => window.location.href = 'mailto:admin@healthsys.com'} style={{ width: "100%", padding: "12px", fontSize: 15 }}>
            Contact Administrator
          </Button>
          <Button variant="outline" onClick={handleLogout} style={{ width: "100%", padding: "12px", fontSize: 15 }}>
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RegistrationRejected;
