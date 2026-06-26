import React, { useState, useEffect } from 'react';
import API from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Calendar, Clock, User, Video, MapPin, 
  CheckCircle2, XCircle, CalendarClock, 
  AlertCircle, Phone, ArrowRight, Activity
} from 'lucide-react';
import toast from 'react-hot-toast';

const PatientFollowUps = () => {
  const { user } = useAuth();
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' or 'past'

  useEffect(() => {
    fetchFollowUps();
  }, []);

  const fetchFollowUps = async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      // Fetching appointments where type is 'follow-up'
      const { data } = await API.get('/api/appointments?type=follow-up', config);
      setFollowUps(data.data || []);
    } catch (error) {
      console.error('Error fetching follow-ups:', error);
      toast.error('Failed to load follow-up schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (action, id) => {
    toast.success(`Action "${action}" triggered for Follow-up ID: ${id}`);
  };

  // Filter logic
  const now = new Date();
  
  const upcomingFollowUps = followUps.filter(apt => 
    (apt.status === 'pending' || apt.status === 'confirmed' || apt.status === 'rescheduled') && 
    new Date(apt.appointmentDate) >= new Date(now.setHours(0,0,0,0))
  );

  const pastFollowUps = followUps.filter(apt => 
    apt.status === 'completed' || apt.status === 'cancelled' || apt.status === 'no-show' ||
    new Date(apt.appointmentDate) < new Date(now.setHours(0,0,0,0))
  );

  const displayedFollowUps = activeTab === 'upcoming' ? upcomingFollowUps : pastFollowUps;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-700">Confirmed</span>;
      case 'pending':
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-700">Pending</span>;
      case 'completed':
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-100 text-blue-700">Completed</span>;
      case 'cancelled':
      case 'no-show':
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-700 capitalize">{status}</span>;
      default:
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-gray-100 text-gray-700 capitalize">{status}</span>;
    }
  };

  const getModeIcon = (mode) => {
    switch (mode) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'phone': return <Phone className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 font-medium flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-cyan-200 border-t-cyan-600 rounded-full animate-spin"></div>
          Loading your follow-up schedule...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 max-w-5xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-cyan-900 to-cyan-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <CalendarClock className="w-48 h-48" />
        </div>
        
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-widest mb-4 backdrop-blur-md">
            <Activity className="w-3 h-3 text-cyan-200" /> Care Continuity
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-3 text-white">Follow-up Schedule</h1>
          <p className="text-cyan-100 text-lg leading-relaxed">
            Keep track of your recurring visits, check-ins, and post-treatment consultations with your care team.
          </p>
        </div>

        <div className="relative z-10 flex gap-4 bg-white/10 p-2 rounded-2xl backdrop-blur-sm border border-white/20">
          <div className="text-center px-6 py-3 border-r border-white/20">
            <p className="text-3xl font-black text-white">{upcomingFollowUps.length}</p>
            <p className="text-xs font-bold uppercase tracking-wider text-cyan-200">Upcoming</p>
          </div>
          <div className="text-center px-6 py-3">
            <p className="text-3xl font-black text-white opacity-80">{pastFollowUps.length}</p>
            <p className="text-xs font-bold uppercase tracking-wider text-cyan-200 opacity-80">Past</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`pb-4 px-2 text-sm font-bold transition-all relative ${
            activeTab === 'upcoming' ? 'text-cyan-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Upcoming Follow-ups
          {activeTab === 'upcoming' && (
            <div className="absolute bottom-0 left-0 w-full h-1 bg-cyan-600 rounded-t-full"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`pb-4 px-2 text-sm font-bold transition-all relative ${
            activeTab === 'past' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Past Follow-ups
          {activeTab === 'past' && (
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-900 rounded-t-full"></div>
          )}
        </button>
      </div>

      {/* Content */}
      {displayedFollowUps.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
            <CalendarClock className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">No {activeTab} follow-ups</h3>
          <p className="text-gray-500 mt-2">
            You don't have any {activeTab} follow-up appointments in your schedule.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedFollowUps.map((apt) => (
            <div key={apt._id} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col md:flex-row">
              
              {/* Date & Time Column */}
              <div className="bg-gray-50/80 p-6 md:w-64 flex flex-col justify-center border-b md:border-b-0 md:border-r border-gray-100">
                <div className="flex items-center gap-3 text-cyan-600 mb-2">
                  <Calendar className="w-5 h-5" />
                  <span className="font-bold text-gray-900">{new Date(apt.appointmentDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-400">
                  <Clock className="w-5 h-5" />
                  <span className="font-medium text-gray-600">{apt.appointmentTime}</span>
                </div>
              </div>

              {/* Details Column */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      {apt.doctor?.avatar ? (
                        <img src={apt.doctor.avatar} alt="Doctor" className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                          <User className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-gray-900">Dr. {apt.doctor?.name || 'Unknown'}</h3>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                          {getModeIcon(apt.mode)} <span className="capitalize">{apt.mode || 'In-person'}</span>
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(apt.status)}
                  </div>
                  
                  <div className="bg-cyan-50/50 rounded-xl p-4 border border-cyan-100/50">
                    <p className="text-sm font-medium text-gray-700">
                      <span className="font-bold text-gray-900">Reason:</span> {apt.reason || 'Routine follow-up'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                {activeTab === 'upcoming' && (
                  <div className="mt-6 flex flex-wrap gap-3">
                    {apt.mode === 'video' && apt.status === 'confirmed' && (
                      <button 
                        onClick={() => handleAction('Join Call', apt._id)}
                        className="flex-1 md:flex-none px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        <Video className="w-4 h-4" /> Join Call
                      </button>
                    )}
                    <button 
                      onClick={() => handleAction('Reschedule', apt._id)}
                      className="flex-1 md:flex-none px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      Reschedule
                    </button>
                    <button 
                      onClick={() => handleAction('Cancel', apt._id)}
                      className="flex-1 md:flex-none px-4 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-gray-200 hover:border-rose-200 text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientFollowUps;
