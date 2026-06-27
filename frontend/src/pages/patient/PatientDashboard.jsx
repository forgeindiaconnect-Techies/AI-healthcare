import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { Button, StatCard, Card, Badge, Modal } from '../../components/ui/SharedUI';

// New Dashboard Widgets
import UpcomingAppointmentWidget from '../../components/dashboard/patient/UpcomingAppointmentWidget';
import NextMedicationWidget from '../../components/dashboard/patient/NextMedicationWidget';
import PendingReportsWidget from '../../components/dashboard/patient/PendingReportsWidget';
import AIInsightsWidget from '../../components/dashboard/patient/AIInsightsWidget';
import EmergencyProfileWidget from '../../components/dashboard/patient/EmergencyProfileWidget';
import HealthTimelineSummary from '../../components/dashboard/patient/HealthTimelineSummary';

const PatientDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [appointments, setAppointments] = useState([]);
  const [reports, setReports] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [notifications, setNotifications] = useState([
    { _id: "n1", type: "info", title: "Welcome!", message: "Welcome to your new dashboard!", createdAt: new Date().toISOString(), isRead: false }
  ]);
  
  const [loading, setLoading] = useState(true);
  const [selectedKPI, setSelectedKPI] = useState(null); // 'Appointments', 'Reports', 'Prescriptions', 'Notifications'
  
  // Doctor Recommendation State
  const [symptomQuery, setSymptomQuery] = useState('');
  const [recommendedDoctors, setRecommendedDoctors] = useState([]);
  const [isSearchingDoctors, setIsSearchingDoctors] = useState(false);

  const searchDoctors = async (query) => {
    if (!query) return;
    setIsSearchingDoctors(true);
    
    // Simple AI/heuristic mapping for common symptoms to specialties
    const symptomMap = {
      'heart': 'Cardiology',
      'skin': 'Dermatology',
      'eye': 'Ophthalmology',
      'bone': 'Orthopedics',
      'dental': 'Dentistry',
      'mental health': 'Psychiatry',
      'fever': 'General',
    };
    
    const mappedSpecialty = Object.keys(symptomMap).reduce((acc, key) => {
      return query.toLowerCase().includes(key) ? symptomMap[key] : acc;
    }, query);

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await API.get(`/api/doctors?search=${mappedSpecialty}`, config);
      setRecommendedDoctors(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingDoctors(false);
    }
  };

  // Hardcoded for now until backend routes exist
  const vitals = [
    { date: "Jan", bp: 120, hr: 72, glucose: 95 },
    { date: "Feb", bp: 118, hr: 75, glucose: 98 },
    { date: "Mar", bp: 125, hr: 71, glucose: 92 },
    { date: "Apr", bp: 122, hr: 78, glucose: 101 },
    { date: "May", bp: 119, hr: 73, glucose: 96 },
    { date: "Jun", bp: 121, hr: 70, glucose: 94 },
    { date: "Jul", bp: 117, hr: 74, glucose: 97 },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        
        // Fetch all data in parallel
        const [apptsRes, reportsRes, presRes] = await Promise.allSettled([
          API.get('/api/appointments', config),
          API.get('/api/reports', config),
          API.get('/api/prescriptions', config)
        ]);

        if (apptsRes.status === 'fulfilled') setAppointments(apptsRes.value.data.data || []);
        if (reportsRes.status === 'fulfilled') setReports(reportsRes.value.data.data || []);
        if (presRes.status === 'fulfilled') setPrescriptions(presRes.value.data.data || []);
        
        // Notifications don't have a full API yet, so we keep the initial state
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const upcomingAppointments = appointments.filter(a => a.status === 'Scheduled' || a.status === 'Pending' || a.status === 'confirmed');
  const pendingReports = reports.filter(r => r.status === 'pending');
  const activePrescriptions = prescriptions.filter(p => p.status === 'active');
  const unreadNotifications = notifications.filter(n => !n.isRead);

  const nextAppt = upcomingAppointments[0] || 
                   // Fallback dummy for demo purposes
                   { appointmentDate: new Date(Date.now() + 86400000), appointmentTime: '10:00 AM', reason: 'Annual Checkup', doctor: { name: 'Sarah Johnson' } };

  if (loading) return (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Good morning, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Here is your health overview for today</p>
        </div>
      </div>

      {/* Top 4 Stats */}

      {/* NEW: Symptom & Doctor Matcher */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Describe Your Health Problem</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-4">Let our AI match you with the right specialist.</p>
        
        <div className="flex gap-2 mb-4">
          <input 
            type="text" 
            value={symptomQuery}
            onChange={(e) => setSymptomQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchDoctors(symptomQuery)}
            placeholder="e.g. Heart pain, Skin rash, Fever..." 
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <Button variant="primary" onClick={() => searchDoctors(symptomQuery)}>
            {isSearchingDoctors ? 'Searching...' : 'Find Doctor'}
          </Button>
        </div>
        
        <div className="flex gap-2 flex-wrap mb-4">
          {['Heart', 'Skin', 'Eye', 'Bone', 'Dental', 'Mental Health', 'Fever'].map(cat => (
            <button 
              key={cat} 
              onClick={() => { setSymptomQuery(cat); searchDoctors(cat); }}
              className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm font-medium hover:bg-blue-100 transition-colors"
            >
              {cat}
            </button>
          ))}
        </div>

        {recommendedDoctors.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold mb-4">Recommended Specialists</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {recommendedDoctors.map(doc => (
                <div key={doc._id} className="p-4 border rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-xl">
                      👨‍⚕️
                    </div>
                    <div>
                      <div className="font-bold">{doc.user?.name}</div>
                      <div className="text-xs text-gray-500">{doc.specialization}</div>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => navigate('/patient/recommendations')}>Book</Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard 
          icon="📅" 
          label="Upcoming Appointments" 
          value={upcomingAppointments.length || 0} 
          sub="Tap to view" 
          color={colors.primary} 
          onClick={() => setSelectedKPI('Appointments')}
        />
        <StatCard 
          icon="📋" 
          label="Medical Reports" 
          value={pendingReports.length || 0} 
          sub="Pending review" 
          color={colors.teal} 
          trend="up" 
          onClick={() => setSelectedKPI('Reports')}
        />
        <StatCard 
          icon="💊" 
          label="Active Prescriptions" 
          value={activePrescriptions.length || 0} 
          sub="All up to date" 
          color={colors.success} 
          onClick={() => setSelectedKPI('Prescriptions')}
        />
        <StatCard 
          icon="🔔" 
          label="Notifications" 
          value={unreadNotifications.length || 0} 
          sub="unread" 
          color={colors.warning} 
          onClick={() => setSelectedKPI('Notifications')}
        />
      </div>

      {/* Dynamic Top Row: Appointment, AI Insights, Emergency */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <UpcomingAppointmentWidget nextAppt={nextAppt} loading={loading} />
        </div>
        <div className="lg:col-span-1">
          <AIInsightsWidget />
        </div>
        <div className="lg:col-span-1">
          <EmergencyProfileWidget />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column (Wider) */}
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <div className="font-bold text-lg mb-4 text-gray-900">📈 Vital Signs Trend</div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={vitals} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="bp" stroke={colors.primary} strokeWidth={3} fillOpacity={1} fill="url(#colorBp)" name="Blood Pressure" />
                <Area type="monotone" dataKey="hr" stroke={colors.success} strokeWidth={3} fillOpacity={1} fill="url(#colorHr)" name="Heart Rate" />
                <defs>
                  <linearGradient id="colorBp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.primary} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={colors.primary} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.success} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={colors.success} stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PendingReportsWidget loading={loading} />
            <NextMedicationWidget loading={loading} />
          </div>
        </div>

        {/* Right Column (Narrower) */}
        <div className="space-y-6">
          <Card className="text-center bg-gradient-to-b from-white to-gray-50 border-gray-100">
            <div className="font-bold text-lg mb-6 text-gray-900">Health Score</div>
            <div className="relative inline-flex items-center justify-center w-36 h-36 rounded-full border-[8px] border-green-50 mb-4">
              <div className="absolute inset-0 border-[8px] border-green-500 rounded-full" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 87%, 0 87%)' }}></div>
              <div className="text-center">
                <div className="text-4xl font-extrabold text-gray-900">87</div>
                <div className="text-xs font-semibold text-green-600">Excellent</div>
              </div>
            </div>
            
            <div className="space-y-4 mt-2">
              {[{ label: "Heart", value: 92, color: colors.danger }, { label: "Lungs", value: 88, color: colors.primary }, { label: "Metabolic", value: 78, color: colors.warning }].map(m => (
                <div key={m.label} className="text-left">
                  <div className="flex justify-between text-xs mb-1.5 font-medium text-gray-600">
                    <span>{m.label}</span><span className="text-gray-900 font-bold">{m.value}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${m.value}%`, background: m.color }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <HealthTimelineSummary />
        </div>
      </div>

      {/* KPI Detail Modal */}
      <Modal 
        open={!!selectedKPI} 
        onClose={() => setSelectedKPI(null)} 
        title={
          selectedKPI === 'Appointments' ? 'Upcoming Appointments' :
          selectedKPI === 'Reports' ? 'Pending Medical Reports' :
          selectedKPI === 'Prescriptions' ? 'Active Prescriptions' :
          selectedKPI === 'Notifications' ? 'Unread Notifications' : ''
        }
        width={600}
      >
        <div className="space-y-4">
          {selectedKPI === 'Appointments' && (
            upcomingAppointments.length > 0 ? (
              upcomingAppointments.map(a => (
                <div key={a._id} className="p-4 border border-gray-100 rounded-xl bg-gray-50 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-gray-900">{a.reason || 'Consultation'}</h4>
                    <p className="text-sm text-gray-500">Dr. {a.doctor?.name || 'Unknown'}</p>
                    <p className="text-xs font-semibold text-indigo-600 mt-1">{new Date(a.appointmentDate).toDateString()} • {a.appointmentTime}</p>
                  </div>
                  <Badge label={a.status} color={colors.primary} light />
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No records found</p>
            )
          )}

          {selectedKPI === 'Reports' && (
            pendingReports.length > 0 ? (
              pendingReports.map(r => (
                <div key={r._id} className="p-4 border border-gray-100 rounded-xl bg-gray-50 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-gray-900">{r.title || 'Medical Report'}</h4>
                    <p className="text-sm text-gray-500">{r.doctor ? `Dr. ${r.doctor.name}` : 'Self Uploaded'}</p>
                    <p className="text-xs font-semibold text-gray-400 mt-1">{new Date(r.createdAt).toDateString()}</p>
                  </div>
                  <Badge label="Pending" color={colors.teal} light />
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No records found</p>
            )
          )}

          {selectedKPI === 'Prescriptions' && (
            activePrescriptions.length > 0 ? (
              activePrescriptions.map(p => (
                <div key={p._id} className="p-4 border border-gray-100 rounded-xl bg-gray-50 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-gray-900">{p.medicines?.[0]?.name || 'Prescription'} {p.medicines?.length > 1 && `+${p.medicines.length - 1} more`}</h4>
                    <p className="text-sm text-gray-500">Dr. {p.doctor?.name || 'Unknown'}</p>
                    <p className="text-xs font-semibold text-gray-400 mt-1">Start: {new Date(p.createdAt).toDateString()}</p>
                  </div>
                  <Badge label="Active" color={colors.success} light />
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No records found</p>
            )
          )}

          {selectedKPI === 'Notifications' && (
            unreadNotifications.length > 0 ? (
              unreadNotifications.map(n => (
                <div key={n._id} className="p-4 border border-gray-100 rounded-xl bg-gray-50">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-gray-900">{n.title}</h4>
                    <span className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-gray-600">{n.message}</p>
                  <div className="mt-2">
                    <Badge label={n.type} color={colors.warning} light />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No records found</p>
            )
          )}
        </div>
      </Modal>

    </div>
  );
};

export default PatientDashboard;
