import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { colors } from '../../theme/colors';
import { Avatar } from '../ui/SharedUI';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/api';
import { 
  Home, Calendar, Stethoscope,
  Clipboard, Pill, FileText,
  Bell, User, Users, File, LogOut, Activity
} from 'lucide-react';

const navItems = [
  { id: "/dashboard/doctor", label: "Dashboard", icon: <Home size={20} />, exact: true },
  { id: "/dashboard/doctor/appointments", label: "Appointments", icon: <Calendar size={20} /> },
  { id: "/dashboard/doctor/availability", label: "Manage Availability", icon: <Calendar size={20} /> },
  { id: "/dashboard/doctor/patients", label: "My Patients", icon: <Users size={20} /> },
  { id: "/dashboard/doctor/review-reports", label: "Review Reports", icon: <Clipboard size={20} /> },
  { id: "/dashboard/doctor/diagnosis", label: "Diagnosis", icon: <Stethoscope size={20} /> },
  { id: "/dashboard/doctor/treatment-plans", label: "Treatment Plans", icon: <FileText size={20} /> },
  { id: "/dashboard/doctor/prescriptions", label: "Prescriptions", icon: <Pill size={20} /> },
  { id: "/dashboard/doctor/follow-up", label: "Follow-up Schedule", icon: <Calendar size={20} /> },
  { id: "/dashboard/doctor/generate-report", label: "Generate Report", icon: <File size={20} /> },
  { id: "/dashboard/doctor/notifications", label: "Notifications", icon: <Bell size={20} /> },
  { id: "/dashboard/doctor/profile", label: "Profile", icon: <User size={20} /> },
];

const DoctorSidebar = ({ sidebarOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [doctor, setDoctor] = useState(null);

  useEffect(() => {
    // Load doctor profile to show in sidebar
    const loadDoctor = async () => {
      try {
        const res = await API.get('/api/auth/me');
        if (res.data && res.data.data) {
          setDoctor(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load doctor profile for sidebar", err);
      }
    };
    if (user && user.role === 'doctor') {
      loadDoctor();
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/doctor-login');
  };

  const displayName = doctor?.user?.name || user?.name || "Doctor";
  const displayRole = doctor?.user?.role || user?.role || "doctor";
  const initials = displayName.charAt(0).toUpperCase();

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
            <Avatar name={displayName} size={38} bg={colors.primary} />
            <div>
              <div style={{ color: "#fff", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 150 }}>
                {displayName}
              </div>
              <div style={{ color: colors.sidebarText, fontSize: 11, textTransform: "capitalize" }}>
                {displayRole}
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="dashboard-sidebar-nav" style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
        {navItems.map(item => {
          return (
            <NavLink 
              key={item.id} 
              to={item.id} 
              end={item.exact}
              className={({ isActive }) => `dashboard-sidebar-link ${isActive ? 'active' : ''}`}
              style={({ isActive }) => ({
                width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", 
                borderRadius: 8, textDecoration: "none", cursor: "pointer", 
                background: isActive ? `${colors.primary}20` : "transparent", 
                color: isActive ? colors.sidebarActive : colors.sidebarText, 
                fontSize: 14, fontWeight: isActive ? 600 : 400, marginBottom: 2, 
                transition: "all 0.15s", textAlign: "left"
              })}
            >
              <span style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{item.icon}</span>
              <span className="md:inline hidden" style={{ whiteSpace: "nowrap", display: sidebarOpen ? "inline" : "none" }}>{item.label}</span>
            </NavLink>
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

export default DoctorSidebar;
