import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { colors } from '../../theme/colors';
import { Avatar } from '../ui/SharedUI';
import { useAuth } from '../../context/AuthContext';

const navItems = {
  patient: [
    { id: "dashboard/patients", label: "Dashboard", icon: "🏠" },
    { id: "dashboard/appointments", label: "Appointments", icon: "📅" },
    { id: "dashboard/ai-chat", label: "Ask Health Questions", icon: "🤖" },
    { id: "dashboard/symptoms", label: "AI Symptom Checker", icon: "🔍" },
    { id: "dashboard/doctor-recommendations", label: "Doctor Recommendations", icon: "👨‍⚕️" },
    { id: "dashboard/reports", label: "Medical Reports", icon: "📋" },
    { id: "dashboard/upload-reports", label: "Upload Reports", icon: "📤" },
    { id: "dashboard/lab-results", label: "Lab Test Results", icon: "🔬" },
    { id: "dashboard/prescriptions", label: "View Prescriptions", icon: "💊" },
    { id: "dashboard/treatment-plan", label: "View Treatment Plan", icon: "📝" },
    { id: "dashboard/health-summary", label: "Health Summary", icon: "📊" },
    { id: "dashboard/diabetes-diet", label: "Diabetes Diet Plan", icon: "🍽️" },
    { id: "dashboard/bmi", label: "BMI Analysis", icon: "🧬" },
    { id: "dashboard/billing", label: "Payments", icon: "💳" },
    { id: "dashboard/payment-history", label: "Payment History", icon: "🧾" },
    { id: "dashboard/patient-follow-ups", label: "Follow-up Schedule", icon: "📅" },
    { id: "dashboard/notifications", label: "Notifications", icon: "🔔" },
    { id: "dashboard/profile", label: "Profile", icon: "👤" },
  ],
  doctor: [
    { id: "doctor-dashboard", label: "Dashboard", icon: "🏠" },
    { id: "dashboard/appointments", label: "Appointments", icon: "📅" },
    { id: "dashboard/doctor-patients", label: "My Patients", icon: "👥" },
    { id: "dashboard/review-reports", label: "Review Reports", icon: "📋" },
    { id: "dashboard/diagnosis", label: "Diagnosis", icon: "🩺" },
    { id: "dashboard/lab-recommendations", label: "Lab Recommendations", icon: "🔬" },
    { id: "dashboard/doctor-treatment-plans", label: "Treatment Plans", icon: "📝" },
    { id: "dashboard/prescriptions", label: "Prescriptions", icon: "💊" },
    { id: "dashboard/follow-up", label: "Follow-up Schedule", icon: "📅" },
    { id: "dashboard/generate-report", label: "Generate Report (PDF)", icon: "📄" },
    { id: "dashboard/notifications", label: "Notifications", icon: "🔔" },
    { id: "dashboard/profile", label: "Profile", icon: "👤" },
  ],
  admin: [
    { id: "dashboard/admin", label: "Dashboard Overview", icon: "🏠" },
    { id: "dashboard/users", label: "Manage Patients", icon: "👥" },
    { id: "dashboard/doctors", label: "Manage Doctors", icon: "👨‍⚕️" },
    { id: "dashboard/appointments", label: "Manage Appointments", icon: "📅" },
    { id: "dashboard/admin-reports", label: "Manage Medical Reports", icon: "📋" },
    { id: "dashboard/admin-prescriptions", label: "Manage Prescriptions", icon: "💊" },
    { id: "dashboard/admin-payments", label: "Manage Payments", icon: "💳" },
    { id: "dashboard/admin-video-consults", label: "Manage Video Consultations", icon: "📹" },
    { id: "dashboard/analytics", label: "Reports & Analytics", icon: "📈" },
    { id: "dashboard/notifications", label: "Notifications", icon: "🔔" },
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
    navigate('/login');
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
