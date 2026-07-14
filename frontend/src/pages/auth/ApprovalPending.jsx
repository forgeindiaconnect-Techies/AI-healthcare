import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { Button } from '../../components/ui/SharedUI';

const ApprovalPending = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/doctor-login');
  };

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, #EFF6FF, #F0FDF4)`, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ background: colors.surface, borderRadius: 20, padding: "40px", width: "100%", maxWidth: 480, border: `1px solid ${colors.border}`, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: colors.text, margin: "0 0 16px" }}>Account Approval Pending</h1>
        <p style={{ fontSize: 16, color: colors.textMuted, margin: "0 0 32px", lineHeight: 1.6 }}>
          Your registration was submitted successfully. An administrator must verify and approve your account before you can access the doctor dashboard.
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Button variant="outline" onClick={() => window.location.reload()} style={{ width: "100%", padding: "12px", fontSize: 15 }}>
            Check Approval Status
          </Button>
          <Button variant="danger" onClick={handleLogout} style={{ width: "100%", padding: "12px", fontSize: 15, background: 'transparent', color: colors.danger, border: 'none' }}>
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ApprovalPending;
