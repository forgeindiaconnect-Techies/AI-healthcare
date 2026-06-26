import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { StatCard, Card, Spinner } from '../../components/ui/SharedUI';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await API.get('/api/admin/dashboard', config);
        setStats(data.data.stats);
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchDashboardData();
  }, [user]);

  if (loading) {
    return <div className="flex justify-center p-10"><Spinner size={40} /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: colors.text, margin: "0 0 6px" }}>Admin Portal Overview</h1>
        <p style={{ color: colors.textMuted, margin: 0 }}>Enterprise system health and management.</p>
      </div>

      {/* Enterprise Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        <StatCard onClick={() => navigate('/dashboard/users')} icon="👥" label="Total Patients" value={stats?.totalPatients || 0} sub="Registered" color={colors.primary} trend="up" />
        <StatCard onClick={() => navigate('/dashboard/doctors')} icon="🧑‍⚕️" label="Total Doctors" value={stats?.totalDoctors || 0} sub="Registered" color={colors.indigo || colors.primary} />
        <StatCard onClick={() => navigate('/dashboard/appointments')} icon="🗓️" label="Total Appointments" value={stats?.totalAppointments || 0} sub="All time" color={colors.teal} />
        <StatCard onClick={() => navigate('/dashboard/appointments')} icon="⌛" label="Pending Appointments" value={stats?.pendingAppointments || 0} sub="Needs action" color={colors.warning} />
        <StatCard onClick={() => navigate('/dashboard/users')} icon="📈" label="Total Users" value={stats?.totalUsers || 0} sub="System wide" color={colors.purple} />
        <StatCard onClick={() => navigate('/dashboard/admin-reports')} icon="📋" label="Medical Reports" value={stats?.totalReports || 0} sub="Uploaded" color={colors.primary} trend="up" />
        <StatCard onClick={() => navigate('/dashboard/analytics')} icon="⚡" label="AI Usage Stats" value="12.5K" sub="API calls this month" color={colors.warning} />
        <StatCard onClick={() => navigate('/dashboard/settings')} icon="🛡️" label="System Health" value="99.9%" sub="All systems operational" color={colors.success} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Card>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: colors.text, margin: "0 0 16px" }}>Recent Doctor Registrations</h2>
          <div style={{ textAlign: "center", padding: "40px 0", color: colors.textMuted, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 32 }}>🧑‍⚕️</span>
            <div>No pending approvals required.</div>
          </div>
        </Card>
        
        <Card>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: colors.text, margin: "0 0 16px" }}>Live System Alerts</h2>
          <div style={{ textAlign: "center", padding: "40px 0", color: colors.textMuted, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
             <span style={{ fontSize: 32 }}>🛡️</span>
             <div>System is running smoothly.</div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
