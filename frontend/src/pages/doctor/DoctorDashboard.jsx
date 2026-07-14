import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, XCircle, Clock, Calendar, Users, TrendingUp } from 'lucide-react';
import API from '../../api/api';
import toast from 'react-hot-toast';

// Services
import { realtimeService } from '../../services/realtimeService';

// Dashboard Components
import DoctorStatsGrid from '../../components/dashboard/doctor/DoctorStatsGrid';
import TodaySchedule from '../../components/dashboard/doctor/TodaySchedule';
import ActionItems from '../../components/dashboard/doctor/ActionItems';
import PatientTimeline from '../../components/dashboard/doctor/PatientTimeline';
import ClinicalNotesCard from '../../components/dashboard/doctor/ClinicalNotesCard';
import PrescriptionBuilder from '../../components/dashboard/doctor/PrescriptionBuilder';
import ReportReviewCard from '../../components/dashboard/doctor/ReportReviewCard';
import AnalyticsOverview from '../../components/dashboard/doctor/AnalyticsOverview';

const DoctorDashboard = () => {
  const { user } = useAuth();
  
  // State
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [profileData, setProfileData] = useState(null);
  
  // Drill-down Modal State
  const [drilldownType, setDrilldownType] = useState(null);

  useEffect(() => {
    // 1. Initial fetch of appointments
    const fetchAppointments = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await API.get('/api/appointments', config);
        setAppointments(data.data || []);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchProfile = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await API.get('/api/doctors/profile', config);
        setProfileData(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    if (user?.token) {
      fetchAppointments();
      fetchProfile();
    } else {
      setLoading(false);
    }

    // 2. Set up polling for live updates (every 30 seconds)
    const intervalId = setInterval(fetchAppointments, 30000);

    // Cleanup on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [user]);

  // Derived Stats
  const todaysAppointments = appointments.filter(a => {
    const today = new Date().toISOString().split('T')[0];
    return a.appointmentDate && a.appointmentDate.startsWith(today);
  });
  
  const pendingAppointments = appointments.filter(a => a.status?.toLowerCase() === 'pending');

  // Derive unique patients for the 'patients' drill-down
  const uniquePatientsMap = new Map();
  appointments.forEach(a => {
    if (a.patient && a.patient._id && !uniquePatientsMap.has(a.patient._id)) {
      uniquePatientsMap.set(a.patient._id, a.patient);
    }
  });
  let uniquePatients = Array.from(uniquePatientsMap.values());

  const completedAppointments = appointments.filter(a => a.status?.toLowerCase() === 'completed');
  const noShowAppointments = appointments.filter(a => a.status?.toLowerCase() === 'no-show');
  const cancelledAppointments = appointments.filter(a => a.status?.toLowerCase() === 'cancelled');
  const upcomingAppointments = appointments.filter(a => ['pending', 'confirmed'].includes(a.status?.toLowerCase()));

  const stats = {
    totalAppointments: appointments.length,
    completedAppointments: completedAppointments.length,
    upcomingAppointments: upcomingAppointments.length,
    noShowAppointments: noShowAppointments.length,
    cancelledAppointments: cancelledAppointments.length
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  // Helper to render the appropriate list in the modal
  const renderDrilldownContent = () => {
    let listData = [];
    // Determine data set based on drilldown type
    switch (drilldownType) {
      case 'today':
        listData = todaysAppointments;
        break;
      case 'pending':
        listData = pendingAppointments;
        break;
      case 'total':
        listData = appointments;
        break;
      case 'patients':
        listData = uniquePatients;
        break;
      case 'completed':
        listData = completedAppointments;
        break;
      case 'upcoming':
        listData = upcomingAppointments;
        break;
      case 'no-show':
        listData = noShowAppointments;
        break;
      case 'cancelled':
        listData = cancelledAppointments;
        break;
      default:
        listData = [];
    }

    if (listData.length === 0) {
      return (
        <div className="py-12 text-center text-gray-500">
          No appointments found
        </div>
      );
    }

    if (drilldownType === 'patients') {
      return (
        <div className="space-y-3">
          {listData.map((p, idx) => (
            <div key={p._id || idx} className="p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold">
                  {p.name?.charAt(0) || p.user?.name?.charAt(0) || 'P'}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{p.name || p.user?.name || 'Unknown'}</h4>
                  <p className="text-sm text-gray-500">{p.email || p.user?.email || 'No email'}</p>
                </div>
              </div>
              <div className="text-sm text-gray-400">Patient</div>
            </div>
          ))}
        </div>
      );
    }

    // Default: render appointment list
    return (
      <div className="space-y-3">
        {listData.map((apt, idx) => (
          <div key={apt._id || idx} className="p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-gray-900">{apt.patient?.name || apt.patient?.user?.name || 'Unknown Patient'}</h4>
              <span className={`text-xs px-2 py-1 rounded-md font-medium border ${
                apt.status?.toLowerCase() === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                apt.status?.toLowerCase() === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                apt.status?.toLowerCase() === 'cancelled' || apt.status?.toLowerCase() === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                apt.status?.toLowerCase() === 'rescheduled' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                {apt.status || 'Scheduled'}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <div className="flex items-center"><Calendar className="w-4 h-4 mr-1.5" /> {new Date(apt.appointmentDate || apt.date).toLocaleDateString()}</div>
              <div className="flex items-center"><Clock className="w-4 h-4 mr-1.5" /> {apt.appointmentTime || apt.timeSlot}</div>
            </div>
            {apt.reasonForVisit && (
              <p className="mt-2 text-sm text-gray-600 bg-gray-50/50 p-2 rounded-md border border-gray-100 italic">
                "{apt.reasonForVisit}"
              </p>
            )}
          </div>
        ))}
      </div>
    );
  };


  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header & Notifications */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome, Dr. {user?.name?.replace('Dr. ', '') || 'Doctor'}! 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Here is your schedule and patient overview.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 rounded-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-100 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs font-medium text-primary-600 hover:text-primary-700">Mark all read</button>
                  )}
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">No new notifications</div>
                  ) : (
                    notifications.map(notif => (
                      <div key={notif.id} className={`p-4 border-b border-gray-100 dark:border-slate-800 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors ${!notif.read ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''}`}>
                        <div className="flex gap-3">
                          <div className={`mt-1 h-2 w-2 rounded-full ${!notif.read ? 'bg-primary-500' : 'bg-transparent'}`} />
                          <div>
                            <p className="text-sm text-gray-800 dark:text-gray-200">{notif.message}</p>
                            <p className="text-xs text-gray-500 mt-1">{new Date(notif.timestamp).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Stats */}
      <DoctorStatsGrid stats={stats} loading={loading} onCardClick={setDrilldownType} />

      {/* Financial Overview Card */}
      {profileData && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Financial Overview (Per Consultation)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">
              <p className="text-sm font-medium text-gray-500">Consultation Fee</p>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">₹ {profileData.consultationFee || 0}</h3>
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">Platform Commission ({profileData.commissionRate || 20}%)</p>
              <h3 className="text-xl font-bold text-red-700 dark:text-red-300 mt-1">- ₹ {profileData.estimatedCommission || 0}</h3>
            </div>
            <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-xl border border-teal-100 dark:border-teal-900/30">
              <p className="text-sm font-medium text-teal-700 dark:text-teal-400">Your Earnings ({(100 - (profileData.commissionRate || 20))}%)</p>
              <h3 className="text-xl font-bold text-teal-800 dark:text-teal-300 mt-1">₹ {profileData.estimatedDoctorEarnings || 0}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Wider */}
        <div className="xl:col-span-2 space-y-6">
          <TodaySchedule appointments={todaysAppointments} loading={loading} />
          <AnalyticsOverview loading={loading} />
          <PatientTimeline />
        </div>

        {/* Right Column - Narrower */}
        <div className="space-y-6">
          <ActionItems loading={loading} />
          <ReportReviewCard />
          <ClinicalNotesCard />
          <PrescriptionBuilder />
        </div>
      </div>

      {/* Drill-down Modal */}
      {drilldownType && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                {drilldownType === 'today' && <><Calendar className="w-5 h-5 mr-2 text-blue-500" /> Today's Appointments</>}
                {drilldownType === 'pending' && <><Clock className="w-5 h-5 mr-2 text-amber-500" /> Pending Consultations</>}
                {drilldownType === 'total' && <><Calendar className="w-5 h-5 mr-2 text-teal-500" /> Total Appointments - {stats?.totalAppointments || 0}</>}
                {drilldownType === 'patients' && <><Users className="w-5 h-5 mr-2 text-purple-500" /> Patients List</>}
                {drilldownType === 'completed' && <><Users className="w-5 h-5 mr-2 text-emerald-500" /> Completed Appointments - {stats?.completedAppointments || 0}</>}
                {drilldownType === 'upcoming' && <><Clock className="w-5 h-5 mr-2 text-blue-500" /> Upcoming Appointments - {stats?.upcomingAppointments || 0}</>}
                {drilldownType === 'no-show' && <><TrendingUp className="w-5 h-5 mr-2 text-gray-500" /> No-Show Appointments - {stats?.noShowAppointments || 0}</>}
                {drilldownType === 'cancelled' && <><Calendar className="w-5 h-5 mr-2 text-red-500" /> Cancelled Appointments - {stats?.cancelledAppointments || 0}</>}
              </h2>
              <button 
                onClick={() => setDrilldownType(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-white custom-scrollbar">
               {renderDrilldownContent()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
