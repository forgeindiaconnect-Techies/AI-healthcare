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
  const [activityLogs, setActivityLogs] = useState([]);
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const [dashRes, pendingRes] = await Promise.all([
          API.get('/api/admin/dashboard', config),
          API.get('/api/admin/doctors/pending', config)
        ]);
        setStats(dashRes.data.data.stats);
        setActivityLogs(dashRes.data.data.activityLogs || []);
        setPendingDoctors(pendingRes.data.data || []);
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
          <h2 style={{ fontSize: 18, fontWeight: 700, color: colors.text, margin: "0 0 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            Recent Doctor Registrations
            {pendingDoctors.length > 0 && (
              <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-bold">
                {pendingDoctors.length} Pending
              </span>
            )}
          </h2>
          {pendingDoctors.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: colors.textMuted, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 32 }}>🧑‍⚕️</span>
              <div>No pending approvals required.</div>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingDoctors.slice(0, 5).map(doc => (
                <div key={doc._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => navigate('/dashboard/admin/pending-approvals')}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                      {doc.user?.name?.charAt(0) || 'D'}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{doc.user?.name}</p>
                      <p className="text-xs text-gray-500">{doc.specialization} • {new Date(doc.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button className="text-sm font-medium text-teal-600 hover:text-teal-800 bg-teal-50 px-3 py-1 rounded-full">
                    Review
                  </button>
                </div>
              ))}
              {pendingDoctors.length > 5 && (
                <button onClick={() => navigate('/dashboard/admin/pending-approvals')} className="w-full mt-2 py-2 text-sm text-teal-600 font-bold hover:bg-teal-50 rounded-lg transition-colors">
                  View All Pending ({pendingDoctors.length})
                </button>
              )}
            </div>
          )}
        </Card>
        
        <Card>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: colors.text, margin: "0 0 16px" }}>Live System Alerts</h2>
          {activityLogs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: colors.textMuted, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
               <span style={{ fontSize: 32 }}>🛡️</span>
               <div>System is running smoothly.</div>
            </div>
          ) : (
            <div className="space-y-3">
              {activityLogs.slice(0, 5).map(log => (
                <div key={log._id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${log.action.includes('REMOVE') || log.action.includes('ERROR') ? 'bg-red-500' : 'bg-green-500'}`} />
                  <div>
                    <p className="text-sm text-gray-800"><span className="font-bold">{log.user?.name || 'System'}</span> {log.action.toLowerCase().replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(log.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
