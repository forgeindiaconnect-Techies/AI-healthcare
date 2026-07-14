import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Activity, Star } from 'lucide-react';
import API from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../../components/ui/SharedUI';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AnalyticsReports = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const [dashRes, analyticsRes] = await Promise.all([
          API.get('/api/admin/dashboard', config),
          API.get('/api/admin/analytics', config)
        ]);
        setDashboardData(dashRes.data.data);
        setAnalyticsData(analyticsRes.data.data);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
  }, [user]);

  if (loading) {
    return <div className="flex justify-center p-10"><Spinner size={40} /></div>;
  }

  const stats = dashboardData?.stats || {};
  const charts = dashboardData?.charts || {};
  const analytics = analyticsData || {};

  // Process data for Monthly Users Line Chart
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const userLabels = charts.monthlyUsers?.map(m => `${monthNames[m._id.month - 1]} ${m._id.year}`) || [];
  
  // Aggregate user counts by month (ignoring role for the total line)
  const monthlyUserCounts = {};
  charts.monthlyUsers?.forEach(item => {
    const label = `${monthNames[item._id.month - 1]} ${item._id.year}`;
    monthlyUserCounts[label] = (monthlyUserCounts[label] || 0) + item.count;
  });

  const uniqueUserLabels = Array.from(new Set(userLabels));
  const uniqueUserCounts = uniqueUserLabels.map(label => monthlyUserCounts[label]);

  const userLineChartData = {
    labels: uniqueUserLabels,
    datasets: [
      {
        label: 'New Users',
        data: uniqueUserCounts,
        borderColor: '#0d9488',
        backgroundColor: 'rgba(13, 148, 136, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ],
  };

  // Process data for Appointments By Status
  const appointmentStatuses = analytics.appointmentsByStatus?.map(a => a._id || 'Unknown') || [];
  const appointmentCounts = analytics.appointmentsByStatus?.map(a => a.count) || [];
  
  const statusColors = {
    'pending': '#f59e0b',
    'confirmed': '#10b981',
    'completed': '#3b82f6',
    'cancelled': '#ef4444',
  };

  const appointmentDoughnutData = {
    labels: appointmentStatuses.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
    datasets: [
      {
        data: appointmentCounts,
        backgroundColor: appointmentStatuses.map(s => statusColors[s] || '#6b7280'),
        borderWidth: 0,
      }
    ],
  };

  // AI Usage Estimation (Fallback if no real AI tracking)
  const estimatedAiTokens = (stats.totalReports || 0) * 150 + (stats.totalAppointments || 0) * 50;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="w-6 h-6 mr-2 text-teal-600" /> Analytics & Reports
          </h1>
          <p className="text-gray-500 mt-1">System-wide statistics and performance metrics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Patients</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalPatients || 0}</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <p className="text-sm text-green-600 font-medium mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 mr-1" /> Active on platform
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Doctors</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalDoctors || 0}</h3>
            </div>
            <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <p className="text-sm text-green-600 font-medium mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 mr-1" /> Active on platform
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Appointments</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalAppointments || 0}</h3>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
              <BarChart3 className="w-6 h-6" />
            </div>
          </div>
          <p className="text-sm text-green-600 font-medium mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 mr-1" /> All time scheduled
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">AI Tokens Used</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{estimatedAiTokens > 1000 ? (estimatedAiTokens/1000).toFixed(1) + 'k' : estimatedAiTokens}</h3>
            </div>
            <div className="p-3 bg-teal-50 rounded-lg text-teal-600">
              <Activity className="w-6 h-6" />
            </div>
          </div>
          <p className="text-sm text-green-600 font-medium mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 mr-1" /> Estimated usage
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">User Growth (Last 6 Months)</h2>
          <div className="h-[300px]">
            {uniqueUserLabels.length > 0 ? (
              <Line data={userLineChartData} options={{ maintainAspectRatio: false }} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">Not enough data to display</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Appointments by Status</h2>
          <div className="h-[300px]">
            {appointmentStatuses.length > 0 ? (
              <Doughnut data={appointmentDoughnutData} options={{ maintainAspectRatio: false }} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">Not enough data to display</div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Top Rated Doctors</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Doctor</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Specialty</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Patients</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Rating</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {analytics.doctorRatings?.map(doc => (
              <tr key={doc._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{doc.user?.name || 'Unknown Doctor'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {doc.specialization}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {doc.totalPatients || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                    <span className="font-medium text-gray-900">{doc.rating?.toFixed(1) || '0.0'}</span>
                    <span className="text-gray-400 text-xs ml-1">({doc.totalRatings || 0})</span>
                  </div>
                </td>
              </tr>
            ))}
            {(!analytics.doctorRatings || analytics.doctorRatings.length === 0) && (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                  No doctor ratings available yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AnalyticsReports;
