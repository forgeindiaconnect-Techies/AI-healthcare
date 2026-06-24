import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { colors } from '../../theme/colors';
import { Avatar } from '../ui/SharedUI';
import { useAuth } from '../../context/AuthContext';

const navItems = {
  patient: [
    { id: "dashboard/patients", label: "Dashboard", icon: "🏠" },
    { id: "dashboard/appointments", label: "Appointments", icon: "📅" },
    { id: "dashboard/ai-chat", label: "AI Health Chat", icon: "🤖" },
    { id: "dashboard/symptoms", label: "Symptom Checker", icon: "🔍" },
    { id: "dashboard/diabetes-diet", label: "Diabetes Diet Plan", icon: "🍽️" },
    { id: "dashboard/bmi", label: "BMI Analysis", icon: "🧬" },
    { id: "dashboard/reports", label: "Medical Reports", icon: "📋" },
    { id: "dashboard/prescriptions", label: "Prescriptions", icon: "💊" },
    { id: "dashboard/billing", label: "Billing & Insurance", icon: "💳" },
    { id: "dashboard/profile", label: "Profile", icon: "👤" },
  ],
  doctor: [
    { id: "dashboard/doctor", label: "Dashboard", icon: "🏠" },
    { id: "dashboard/appointments", label: "Appointments", icon: "📅" },
    { id: "dashboard/doctor-patients", label: "My Patients", icon: "👥" },
    { id: "dashboard/prescriptions", label: "Prescriptions", icon: "💊" },
    { id: "dashboard/profile", label: "Profile", icon: "👤" },
    { id: "dashboard/notifications", label: "Notifications", icon: "🔔" },
  ],
  admin: [
    { id: "dashboard/admin", label: "Dashboard", icon: "🏠" },
    { id: "dashboard/users", label: "Manage Users", icon: "👥" },
    { id: "dashboard/doctors", label: "Doctor Management", icon: "👨‍⚕️" },
    { id: "dashboard/appointments", label: "Appointments", icon: "📅" },
    { id: "dashboard/settings", label: "Settings", icon: "⚙️" },
  ],
};

const Sidebar = ({ sidebarOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const items = navItems[user.role] || [];
  
  // Remove leading slash for comparison
  const currentPath = location.pathname.substring(1);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div style={{ width: sidebarOpen ? 260 : 68, background: colors.sidebar, height: "100vh", display: "flex", flexDirection: "column", transition: "width 0.25s", flexShrink: 0, overflow: "hidden" }}>
      <div style={{ padding: "20px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ fontSize: 28, flexShrink: 0 }}>🏥</div>
        {sidebarOpen && <div><div style={{ color: "#fff", fontWeight: 700, fontSize: 16, whiteSpace: "nowrap" }}>HealthAI</div><div style={{ color: colors.sidebarText, fontSize: 11 }}>Healthcare System</div></div>}
      </div>
      {sidebarOpen && (
        <div style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar name={user.name} size={38} bg={colors.primary} />
            <div>
              <div style={{ color: "#fff", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 150 }}>{user.name}</div>
              <div style={{ color: colors.sidebarText, fontSize: 11, textTransform: "capitalize" }}>{user.role}</div>
            </div>
          </div>
        </div>
      )}
      <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
        {items.map(item => {
          const isActive = currentPath === item.id || (currentPath.startsWith(item.id) && item.id !== 'dashboard');
          return (
            <button key={item.id} onClick={() => navigate(`/${item.id}`)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer", background: isActive ? `${colors.primary}20` : "transparent", color: isActive ? colors.sidebarActive : colors.sidebarText, fontSize: 14, fontWeight: isActive ? 600 : 400, marginBottom: 2, transition: "all 0.15s", textAlign: "left" }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
              {sidebarOpen && <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>}
            </button>
          );
        })}
      </nav>
      <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <button onClick={handleLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer", background: "transparent", color: "#EF4444", fontSize: 14 }}>
          <span style={{ fontSize: 18 }}>🚪</span>
          {sidebarOpen && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
