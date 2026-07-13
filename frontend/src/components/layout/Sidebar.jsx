import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { colors } from '../../theme/colors';
import { Avatar } from '../ui/SharedUI';
import { useAuth } from '../../context/AuthContext';
import { 
  Home, Calendar, Stethoscope, Bot, Search, UserCheck, 
  Clipboard, Microscope, Pill, FileText, BarChart, 
  Utensils, Dna, CreditCard, Receipt, Bell, User, 
  Users, File, Video, TrendingUp, Settings, LogOut, Activity, Archive
} from 'lucide-react';

const navItems = {
  patient: [
    { id: "dashboard/patients", label: "Dashboard", icon: <Home size={20} /> },
    { id: "dashboard/appointments", label: "Appointments", icon: <Calendar size={20} /> },
    { id: "dashboard/my-diagnoses", label: "My Diagnoses", icon: <Stethoscope size={20} /> },
    { id: "dashboard/ai-chat", label: "Ask Health Questions", icon: <Bot size={20} /> },
    { id: "dashboard/symptoms", label: "AI Symptom Checker", icon: <Search size={20} /> },
    { id: "dashboard/doctor-recommendations", label: "Doctor Recommendations", icon: <UserCheck size={20} /> },
    { id: "dashboard/reports", label: "Medical Reports", icon: <Clipboard size={20} /> },
    { id: "dashboard/lab-results", label: "Lab Test Results", icon: <Microscope size={20} /> },
    { id: "dashboard/prescriptions", label: "View Prescriptions", icon: <Pill size={20} /> },
    { id: "dashboard/treatment-plan", label: "View Treatment Plan", icon: <FileText size={20} /> },
    { id: "dashboard/health-summary", label: "Health Summary", icon: <BarChart size={20} /> },
    { id: "dashboard/diabetes-diet", label: "Diabetes Diet Plan", icon: <Utensils size={20} /> },
    { id: "dashboard/bmi", label: "BMI Analysis", icon: <Dna size={20} /> },
    { id: "dashboard/billing", label: "Payments", icon: <CreditCard size={20} /> },
    { id: "dashboard/payment-history", label: "Payment History", icon: <Receipt size={20} /> },
    { id: "dashboard/patient-follow-ups", label: "Follow-up Schedule", icon: <Calendar size={20} /> },
    { id: "dashboard/notifications", label: "Notifications", icon: <Bell size={20} /> },
    { id: "dashboard/profile", label: "Profile", icon: <User size={20} /> },
  ],
  doctor: [
    { id: "dashboard/doctor-dashboard", label: "Dashboard", icon: <Home size={20} /> },
    { id: "dashboard/appointments", label: "Appointments", icon: <Calendar size={20} /> },
    { id: "dashboard/doctor-patients", label: "My Patients", icon: <Users size={20} /> },
    { id: "dashboard/review-reports", label: "Review Reports", icon: <Clipboard size={20} /> },
    { id: "dashboard/diagnosis", label: "Diagnosis", icon: <Stethoscope size={20} /> },
    { id: "dashboard/doctor-treatment-plans", label: "Treatment Plans", icon: <FileText size={20} /> },
    { id: "dashboard/prescriptions", label: "Prescriptions", icon: <Pill size={20} /> },
    { id: "dashboard/follow-up", label: "Follow-up Schedule", icon: <Calendar size={20} /> },
    { id: "dashboard/generate-report", label: "Generate Report (PDF)", icon: <File size={20} /> },
    { id: "dashboard/notifications", label: "Notifications", icon: <Bell size={20} /> },
    { id: "dashboard/profile", label: "Profile", icon: <User size={20} /> },
  ],
  admin: [
    { id: "dashboard/admin", label: "Dashboard Overview", icon: <Home size={20} /> },
    { id: "dashboard/users", label: "Manage Patients", icon: <Users size={20} /> },
    { id: "dashboard/doctors", label: "Manage Doctors", icon: <UserCheck size={20} /> },
    { id: "dashboard/appointments", label: "Manage Appointments", icon: <Calendar size={20} /> },
    { id: "dashboard/admin-reports", label: "Manage Medical Reports", icon: <Clipboard size={20} /> },
    { id: "dashboard/admin-prescriptions", label: "Manage Prescriptions", icon: <Pill size={20} /> },
    { id: "dashboard/admin-payments", label: "Manage Payments", icon: <CreditCard size={20} /> },
    { id: "dashboard/admin-video-consults", label: "Manage Video Consultations", icon: <Video size={20} /> },
    { id: "dashboard/archived-records", label: "Archived Records", icon: <Archive size={20} /> },
    { id: "dashboard/analytics", label: "Reports & Analytics", icon: <TrendingUp size={20} /> },
    { id: "dashboard/notifications", label: "Notifications", icon: <Bell size={20} /> },
    { id: "dashboard/settings", label: "Settings", icon: <Settings size={20} /> },
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
    <div className="dashboard-sidebar" style={{ width: sidebarOpen ? 260 : 68, background: colors.sidebar, height: "100vh", display: "flex", flexDirection: "column", transition: "width 0.25s", flexShrink: 0, overflow: "hidden" }}>
      <div className="hidden md:flex" style={{ padding: "20px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", alignItems: "center", gap: 12 }}>
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          <Activity size={28} color={colors.primary} />
        </div>
        {sidebarOpen && <div><div style={{ color: "#fff", fontWeight: 700, fontSize: 16, whiteSpace: "nowrap" }}>HealthAI</div><div style={{ color: colors.sidebarText, fontSize: 11 }}>Healthcare System</div></div>}
      </div>
      {sidebarOpen && (
        <div className="hidden md:block" style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar name={user.name} size={38} bg={colors.primary} />
            <div>
              <div style={{ color: "#fff", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 150 }}>{user.name}</div>
              <div style={{ color: colors.sidebarText, fontSize: 11, textTransform: "capitalize" }}>{user.role}</div>
            </div>
          </div>
        </div>
      )}
      <nav className="dashboard-sidebar-nav" style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
        {items.map(item => {
          const isActive = currentPath === item.id || (currentPath.startsWith(item.id) && item.id !== 'dashboard');
          return (
            <button key={item.id} onClick={() => navigate(`/${item.id}`)} className="dashboard-sidebar-link" style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer", background: isActive ? `${colors.primary}20` : "transparent", color: isActive ? colors.sidebarActive : colors.sidebarText, fontSize: 14, fontWeight: isActive ? 600 : 400, marginBottom: 2, transition: "all 0.15s", textAlign: "left" }}>
              <span style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{item.icon}</span>
              <span className="md:inline hidden" style={{ whiteSpace: "nowrap", display: sidebarOpen ? "inline" : "none" }}>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="hidden md:block" style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <button onClick={handleLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer", background: "transparent", color: "#EF4444", fontSize: 14 }}>
          <span style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><LogOut size={20} /></span>
          {sidebarOpen && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
