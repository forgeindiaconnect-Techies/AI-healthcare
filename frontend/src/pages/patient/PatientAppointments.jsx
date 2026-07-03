import React, { useState, useEffect } from 'react';
import API from '../../api/api';
import { Calendar, Clock, Video, CheckCircle, XCircle, RefreshCw, Plus, Building2, Ticket, Video as VideoIcon, UserCircle, Stethoscope, MessageSquare, Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';
import PaymentModal from '../../components/dashboard/patient/PaymentModal';
import PatientChat from './PatientChat';
import ReviewModal from '../../components/dashboard/patient/ReviewModal';

const CountdownTimer = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const distance = targetDate.getTime() - new Date().getTime();
      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft('00:00');
        return;
      }
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((distance % (1000 * 60)) / 1000);
      setTimeLeft(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return <span className="font-mono font-black">{timeLeft}</span>;
};

const PatientAppointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Upcoming');
  const { socket } = useSocket();
  
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({ doctorId: '', date: '', time: '', type: 'general', mode: 'video', reason: '' });
  
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({ id: null, newDate: '', newTime: '', reason: '' });

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedAppointmentForPayment, setSelectedAppointmentForPayment] = useState(null);

  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [selectedAppointmentForChat, setSelectedAppointmentForChat] = useState(null);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedAppointmentForReview, setSelectedAppointmentForReview] = useState(null);

  const fetchAppointments = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await API.get('/api/appointments?limit=100', config);
      setAppointments(data.data || []);
    } catch (error) {
      console.error('Error fetching appointments', error);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await API.get('/api/doctors', config);
      setDoctors(data.data || []);
    } catch (error) {
      console.error('Error fetching doctors', error);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (socket) {
      const handleNewNotif = (notif) => {
        if (notif.type === 'appointment' && notif.appointment) {
          setAppointments(prev => {
            const exists = prev.find(a => a._id === notif.appointment._id);
            if (exists) {
              return prev.map(a => a._id === notif.appointment._id ? notif.appointment : a);
            }
            return [notif.appointment, ...prev];
          });
        }
      };

      const handleReminder = (data) => {
        const { appointment, minutesLeft, message, title } = data;
        const isOnline = appointment.mode === 'video';

        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex border border-gray-100 mt-2 overflow-hidden ring-1 ring-black/5`}>
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="shrink-0 pt-1">
                   {isOnline ? <VideoIcon className="h-6 w-6 text-indigo-500" /> : <Building2 className="h-6 w-6 text-emerald-500" />}
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-bold text-gray-900">{title}</p>
                  <p className="mt-1 text-sm text-gray-500 leading-relaxed">{message}</p>
                  <div className="mt-3">
                    {isOnline ? (
                      <a href={appointment.meetingLink || '#'} target="_blank" rel="noreferrer" className="inline-flex items-center px-4 py-2 border border-transparent text-xs font-bold rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
                        Join Video Call
                      </a>
                    ) : (
                      <div className="flex gap-6 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Token</p>
                          <p className="text-lg font-black text-emerald-600 leading-none mt-1">{appointment.queueNumber || '--'}</p>
                        </div>
                        <div className="w-px bg-gray-200"></div>
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Room</p>
                          <p className="text-base font-bold text-gray-900 leading-none mt-1">{appointment.roomNumber || 'TBD'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-100">
              <button onClick={() => toast.dismiss(t.id)} className="w-full border border-transparent rounded-none p-4 flex items-center justify-center text-sm font-bold text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors">
                Close
              </button>
            </div>
          </div>
        ), { duration: 15000 });
      };

      socket.on('new_notification', handleNewNotif);
      socket.on('appointment_reminder', handleReminder);
      
      return () => {
        socket.off('new_notification', handleNewNotif);
        socket.off('appointment_reminder', handleReminder);
      };
    }
  }, [socket]);

  const handleBook = async (e) => {
    e.preventDefault();
    
    // Validate all input fields before saving
    if (!bookingForm.doctorId) return toast.error('Please select a doctor');
    if (!bookingForm.date) return toast.error('Please select an appointment date');
    if (!bookingForm.time) return toast.error('Please select an appointment time');
    if (!bookingForm.reason.trim()) return toast.error('Please provide a reason for the visit');

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const payload = {
        doctor: bookingForm.doctorId,
        appointmentDate: bookingForm.date,
        appointmentTime: bookingForm.time,
        reason: bookingForm.reason,
        mode: bookingForm.mode,
        type: bookingForm.type
      };

      // Persist in backend API
      const response = await API.post('/api/appointments', payload, config);
      const newApt = response.data.data;
      
      // Create a proper appointment object with matching field names used by the UI cards
      const selectedDoc = doctors.find(d => (d.user?._id || d._id) === bookingForm.doctorId);
      const optimisticApt = {
        ...newApt,
        doctorProfile: {
          specialization: selectedDoc?.specialization || 'Consultation'
        }
      };

      // Save the new appointment to state immediately
      setAppointments(prev => [optimisticApt, ...prev]);
      
      // Make sure new appointments appear under the Upcoming tab
      setActiveTab('Upcoming');
      
      toast.success('Appointment booked successfully!');
      
      // After saving, reset the form and close modal
      setBookingForm({ doctorId: '', date: '', time: '', type: 'general', mode: 'video', reason: '' });
      setShowBookingModal(false);
      
      // Sync with backend in background
      fetchAppointments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to book appointment');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await API.put(`/api/appointments/${id}/status`, { status, cancellationReason: 'Cancelled by patient' }, config);
      fetchAppointments();
      toast.success(`Appointment ${status}`);
    } catch (error) {
      console.error('Error updating appointment', error);
      toast.error('Failed to update status');
    }
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await API.put(`/api/appointments/${rescheduleData.id}/reschedule`, {
        appointmentDate: rescheduleData.newDate,
        appointmentTime: rescheduleData.newTime
      }, config);
      toast.success('Reschedule request sent!');
      setShowRescheduleModal(false);
      fetchAppointments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reschedule');
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'approved - payment pending': return 'bg-indigo-100 text-indigo-800 border-indigo-200 animate-pulse';
      case 'meeting scheduled': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'cancelled':
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'no-show': return 'bg-gray-200 text-gray-700 border-gray-300';
      case 'pending': 
      case 'pending doctor approval': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'rescheduled': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'live':
      case 'consulting': return 'bg-indigo-100 text-indigo-800 border-indigo-200 animate-pulse';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    const s = apt.status?.toLowerCase();
    if (activeTab === 'Upcoming') return ['scheduled', 'meeting scheduled', 'approved - payment pending', 'confirmed', 'pending', 'pending doctor approval', 'rescheduled'].includes(s);
    if (activeTab === 'Completed') return s === 'completed';
    if (activeTab === 'Cancelled') return ['cancelled', 'rejected', 'no-show'].includes(s);
    return true;
  });

  if (loading) return <div className="p-8 text-center text-gray-500 flex justify-center items-center h-64">Loading your schedule...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Calendar className="w-6 h-6 mr-3 text-indigo-600" /> My Appointments
          </h1>
          <p className="text-sm text-gray-500 mt-1">Book new consultations and manage your upcoming schedule.</p>
        </div>
        <button 
          onClick={() => setShowBookingModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-md shadow-indigo-200 transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" /> Book Appointment
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide">
        {['Upcoming', 'Completed', 'Cancelled'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all border ${
              activeTab === tab 
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200' 
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Appointment Cards Grid */}
      {filteredAppointments.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-16 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
             <Calendar className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">No {activeTab} Appointments</h3>
          <p className="text-gray-500 mt-2">You don't have any appointments matching this category.</p>
          {activeTab === 'Upcoming' && (
            <button onClick={() => setShowBookingModal(true)} className="mt-6 font-bold text-indigo-600 hover:text-indigo-800">Book one now &rarr;</button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAppointments.map(apt => {
            const isOnline = apt.mode === 'video';
            const statusLabel = apt.status.charAt(0).toUpperCase() + apt.status.slice(1);
            
            // Calculate starting soon logic
            const aptDateStr = apt.appointmentDate ? new Date(apt.appointmentDate).toISOString().split('T')[0] : '';
            const aptTimeStr = apt.appointmentTime || '00:00';
            const [h, m] = aptTimeStr.split(':');
            const aptDateTime = new Date(`${aptDateStr}T${h}:${m}:00`);
            const diffMins = (aptDateTime.getTime() - new Date().getTime()) / 60000;
            const isStartingSoon = apt.status === 'confirmed' && diffMins > 0 && diffMins <= 15;
            
            return (
              <div key={apt._id} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col group">
                
                {/* Card Header */}
                <div className={`px-6 py-4 border-b flex justify-between items-center ${isOnline ? 'bg-indigo-50/50 border-indigo-50' : 'bg-emerald-50/50 border-emerald-50'}`}>
                  <div className={`flex items-center gap-2 font-bold text-xs uppercase tracking-widest ${isOnline ? 'text-indigo-700' : 'text-emerald-700'}`}>
                    {isOnline ? <VideoIcon className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                    {isOnline ? 'Online Consultation' : 'Offline Visit'}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusBadge(apt.status)}`}>
                    {statusLabel}
                  </span>
                </div>

                {/* Doctor Info */}
                <div className="p-6 flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl shadow-inner ${isOnline ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {apt.doctor?.name?.charAt(4) || 'D'}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{apt.doctor?.name || 'Assigned Doctor'}</h3>
                    <p className="text-sm text-gray-500 font-medium flex items-center gap-1"><Stethoscope className="w-3 h-3"/> {apt.doctorProfile?.specialization || 'Consultation'}</p>
                  </div>
                </div>

                {/* Details Section */}
                <div className="px-6 pb-6 space-y-4 flex-grow">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Calendar className="w-3 h-3"/> Date</p>
                      <p className="text-sm font-semibold text-gray-800">{new Date(apt.appointmentDate).toLocaleDateString()}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Clock className="w-3 h-3"/> Time</p>
                      <p className="text-sm font-semibold text-gray-800">{apt.appointmentTime}</p>
                    </div>
                  </div>

                  {/* Mode Specific Info */}
                  {isOnline ? (
                     isStartingSoon ? (
                       <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-200 shadow-inner flex flex-col gap-3">
                         <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-2">
                              <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span></span>
                              Starting Soon
                            </p>
                            <p className="text-lg font-black text-indigo-700 flex items-center gap-1">
                              ⏳ <CountdownTimer targetDate={aptDateTime} />
                            </p>
                         </div>
                         <a href={apt.meetingLink || '#'} target="_blank" rel="noreferrer" className="w-full text-center px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-md hover:-translate-y-0.5">
                           Join Video Consultation
                         </a>
                       </div>
                     ) : (
                       <div className={`p-3 rounded-xl border flex items-start gap-3 ${apt.status === 'no-show' || apt.status === 'cancelled' ? 'bg-gray-50 border-gray-200 opacity-70' : 'bg-blue-50/50 border-blue-100/50'}`}>
                          <div className={`p-2 rounded-lg shrink-0 ${apt.status === 'no-show' || apt.status === 'cancelled' ? 'bg-gray-200 text-gray-600' : 'bg-blue-100 text-blue-600'}`}><Video className="w-4 h-4" /></div>
                          <div>
                            <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${apt.status === 'no-show' || apt.status === 'cancelled' ? 'text-gray-500' : 'text-blue-500'}`}>Meeting Link Generated</p>
                            {apt.meetingLink && !['no-show', 'cancelled', 'completed'].includes(apt.status) ? (
                               <a href={apt.meetingLink} target="_blank" rel="noreferrer" className="text-xs text-blue-800 font-bold hover:underline truncate inline-block w-48">Join Call Here</a>
                            ) : (
                               <p className="text-xs text-gray-500 font-medium truncate w-48">
                                 {apt.status === 'no-show' ? 'Expired' : (apt.status === 'completed' ? 'Meeting Ended' : 'Link will be available soon.')}
                               </p>
                            )}
                          </div>
                       </div>
                     )
                  ) : (
                     isStartingSoon ? (
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4 rounded-xl shadow-lg flex items-center justify-between text-white border border-emerald-600">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-emerald-100">Token Number</p>
                            <p className="text-2xl font-black leading-none">{apt.queueNumber || '--'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-emerald-100">Room</p>
                            <p className="text-lg font-bold">{apt.roomNumber || 'TBD'}</p>
                          </div>
                        </div>
                     ) : (
                       <div className="grid grid-cols-2 gap-4">
                          <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100/50 flex items-start gap-3">
                            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg shrink-0"><Ticket className="w-4 h-4" /></div>
                            <div>
                              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-0.5">Queue Token</p>
                              <p className="text-lg font-black text-amber-700 leading-none">{apt.queueNumber || '--'}</p>
                            </div>
                          </div>
                          <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50 flex items-start gap-3">
                            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg shrink-0"><Building2 className="w-4 h-4" /></div>
                            <div>
                              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-0.5">Consult Room</p>
                              <p className="text-sm font-bold text-emerald-800">{apt.roomNumber || 'TBD'}</p>
                            </div>
                          </div>
                       </div>
                     )
                  )}

                  <div className="pt-2">
                    <p className="text-xs text-gray-500 italic">Reason: {apt.reason || 'None provided'}</p>
                  </div>
                </div>

                {/* Action Footer */}
                {activeTab === 'Upcoming' && (
                  <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-2 justify-end items-center">
                    {apt.status?.toLowerCase() === 'approved - payment pending' && (
                      <button 
                        onClick={() => { setSelectedAppointmentForPayment(apt); setPaymentModalOpen(true); }}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md transition-all mr-auto"
                      >
                        Pay Now
                      </button>
                    )}
                    {['approved - payment pending', 'meeting scheduled', 'confirmed', 'completed'].includes(apt.status?.toLowerCase()) && (
                      <button 
                        onClick={() => { setSelectedAppointmentForChat(apt); setChatModalOpen(true); }}
                        className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                      >
                        <MessageSquare className="w-4 h-4" /> Chat
                      </button>
                    )}
                    <button 
                      onClick={() => { setRescheduleData({ id: apt._id, newDate: '', newTime: '', reason: '' }); setShowRescheduleModal(true); }}
                      className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl text-sm font-bold text-gray-700 transition-all"
                    >
                      Reschedule
                    </button>
                    <button 
                      onClick={() => updateStatus(apt._id, 'cancelled')}
                      className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 rounded-xl text-sm font-bold transition-all"
                    >
                      Cancel Visit
                    </button>
                  </div>
                )}
                {activeTab === 'Completed' && (
                  <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-2 justify-end items-center">
                    <button 
                      onClick={() => { setSelectedAppointmentForChat(apt); setChatModalOpen(true); }}
                      className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-sm font-bold transition-all flex items-center gap-2 mr-auto"
                    >
                      <MessageSquare className="w-4 h-4" /> Chat
                    </button>
                    <button 
                      onClick={() => { setSelectedAppointmentForReview(apt); setReviewModalOpen(true); }}
                      className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-100 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                    >
                      <Star className="w-4 h-4" /> Rate Doctor
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Calendar className="w-6 h-6 mr-2 text-indigo-600" /> Book New Appointment
              </h2>
              <button onClick={() => setShowBookingModal(false)} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-white border border-transparent hover:border-gray-200 transition-all">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleBook} className="p-6 space-y-6">
              
              {/* Select Doctor */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><Stethoscope className="w-4 h-4 text-indigo-500"/> Select Doctor *</label>
                <select 
                  required
                  value={bookingForm.doctorId}
                  onChange={(e) => setBookingForm({...bookingForm, doctorId: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm font-medium bg-gray-50"
                >
                  <option value="">-- Choose a doctor --</option>
                  {doctors.map(doc => (
                    <option key={doc._id} value={doc.user?._id || doc._id}>
                      {doc.user?.name || doc.name} {doc.specialization ? `- ${doc.specialization}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mode Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Appointment Type *</label>
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    onClick={() => setBookingForm({...bookingForm, mode: 'video'})}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${bookingForm.mode === 'video' ? 'border-indigo-500 bg-indigo-50/50' : 'border-gray-200 hover:border-indigo-300'}`}
                  >
                    <div className={`p-2 rounded-lg ${bookingForm.mode === 'video' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500'}`}><VideoIcon className="w-5 h-5"/></div>
                    <div>
                      <p className={`font-bold ${bookingForm.mode === 'video' ? 'text-indigo-900' : 'text-gray-700'}`}>Online</p>
                      <p className="text-xs text-gray-500">Video Consultation</p>
                    </div>
                  </div>
                  
                  <div 
                    onClick={() => setBookingForm({...bookingForm, mode: 'in-person'})}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${bookingForm.mode === 'in-person' ? 'border-emerald-500 bg-emerald-50/50' : 'border-gray-200 hover:border-emerald-300'}`}
                  >
                    <div className={`p-2 rounded-lg ${bookingForm.mode === 'in-person' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'}`}><Building2 className="w-5 h-5"/></div>
                    <div>
                      <p className={`font-bold ${bookingForm.mode === 'in-person' ? 'text-emerald-900' : 'text-gray-700'}`}>Offline</p>
                      <p className="text-xs text-gray-500">Hospital Visit</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Date *</label>
                  <input 
                    type="date" required
                    value={bookingForm.date}
                    onChange={(e) => setBookingForm({...bookingForm, date: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm font-medium bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Time *</label>
                  <input 
                    type="time" required
                    value={bookingForm.time}
                    onChange={(e) => setBookingForm({...bookingForm, time: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm font-medium bg-gray-50"
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Reason for Visit *</label>
                <input 
                  type="text" required placeholder="e.g. General Checkup, Fever, etc."
                  value={bookingForm.reason}
                  onChange={(e) => setBookingForm({...bookingForm, reason: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm font-medium bg-gray-50"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button type="button" onClick={() => setShowBookingModal(false)} className="px-6 py-3 font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-all">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-3 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5">
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <RefreshCw className="w-6 h-6 mr-2 text-indigo-600" /> Reschedule Visit
              </h2>
              <button onClick={() => setShowRescheduleModal(false)} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-white border border-transparent hover:border-gray-200 transition-all">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleReschedule} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">New Date *</label>
                  <input 
                    type="date" required
                    value={rescheduleData.newDate}
                    onChange={(e) => setRescheduleData({...rescheduleData, newDate: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm font-medium bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">New Time *</label>
                  <input 
                    type="time" required
                    value={rescheduleData.newTime}
                    onChange={(e) => setRescheduleData({...rescheduleData, newTime: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm font-medium bg-gray-50"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button type="button" onClick={() => setShowRescheduleModal(false)} className="px-6 py-3 font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-all">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-3 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5">
                  Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {paymentModalOpen && selectedAppointmentForPayment && (
        <PaymentModal
          appointment={selectedAppointmentForPayment}
          userToken={user.token}
          onClose={() => setPaymentModalOpen(false)}
          onSuccess={() => {
            setPaymentModalOpen(false);
            fetchAppointments();
          }}
        />
      )}

      {chatModalOpen && selectedAppointmentForChat && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg">
            <PatientChat
              doctorId={selectedAppointmentForChat.doctor._id || selectedAppointmentForChat.doctor}
              doctorName={selectedAppointmentForChat.doctor.name}
              doctorAvatar={selectedAppointmentForChat.doctor.avatar}
              onClose={() => setChatModalOpen(false)}
            />
          </div>
        </div>
      )}

      {reviewModalOpen && selectedAppointmentForReview && (
        <ReviewModal
          appointment={selectedAppointmentForReview}
          userToken={user.token}
          onClose={() => setReviewModalOpen(false)}
          onSuccess={() => {
            setReviewModalOpen(false);
            fetchAppointments();
          }}
        />
      )}

    </div>
  );
};

export default PatientAppointments;
