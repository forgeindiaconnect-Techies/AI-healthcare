import React, { useState, useEffect } from 'react';
import { Calendar, XCircle, Stethoscope, VideoIcon, Building2, Clock, CheckCircle2 } from 'lucide-react';
import API from '../../api/api';
import toast from 'react-hot-toast';
import { useSocket } from '../../context/SocketContext';

const BookAppointmentModal = ({ isOpen, onClose, doctors, onSuccess, user }) => {
  const [doctorId, setDoctorId] = useState('');
  const [mode, setMode] = useState('video');
  const [type, setType] = useState('general');
  const [reason, setReason] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  
  const [availableDates, setAvailableDates] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const { socket } = useSocket();

  useEffect(() => {
    if (socket) {
      const handleSlotUpdated = (data) => {
        // If the updated slot is for the currently viewed doctor and date, update the local state
        if (data.doctorId === doctorId) {
          const slotDateStr = new Date(data.date).toISOString().split('T')[0];
          const selectedDateStr = new Date(selectedDate).toISOString().split('T')[0];
          
          if (slotDateStr === selectedDateStr) {
            setSlots(prevSlots => prevSlots.map(s => 
              s._id === data.slotId ? { ...s, status: data.status } : s
            ));
          }
        }
      };

      socket.on('slot_updated', handleSlotUpdated);
      return () => {
        socket.off('slot_updated', handleSlotUpdated);
      };
    }
  }, [socket, doctorId, selectedDate]);

  useEffect(() => {
    if (doctorId) {
      fetchAvailableDates(doctorId);
      setSelectedDate('');
      setSelectedSlot(null);
      setSlots([]);
    }
  }, [doctorId]);

  useEffect(() => {
    if (doctorId && selectedDate) {
      fetchSlots(doctorId, selectedDate);
      setSelectedSlot(null);
    }
  }, [selectedDate, doctorId]);

  const fetchAvailableDates = async (docId) => {
    try {
      setLoadingDates(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await API.get(`/api/doctors/${docId}/available-dates`, config);
      setAvailableDates(data.data || []);
      if (data.data && data.data.length > 0) {
        setSelectedDate(data.data[0]);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load available dates');
    } finally {
      setLoadingDates(false);
    }
  };

  const fetchSlots = async (docId, date) => {
    try {
      setLoadingSlots(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await API.get(`/api/doctors/${docId}/slots?date=${date}`, config);
      setSlots(data.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBook = async (e) => {
    e.preventDefault();
    
    if (!doctorId) return toast.error('Please select a doctor');
    if (!selectedSlot || selectedSlot.status !== 'AVAILABLE') return toast.error('Please select an available appointment slot');
    if (!reason.trim()) return toast.error('Please provide a reason for the visit');
    if (new Date(selectedSlot.startDateTime) <= new Date()) return toast.error('Cannot book past slots');

    try {
      setBooking(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const payload = {
        doctor: doctorId,
        slotId: selectedSlot._id,
        reason,
        mode,
        type
      };

      const response = await API.post('/api/appointments', payload, config);
      toast.success('Appointment booked successfully!');
      
      // Instantly update the slot to BOOKED in local state without waiting for a re-fetch
      setSlots(prevSlots => prevSlots.map(s => 
        s._id === selectedSlot._id ? { ...s, status: 'BOOKED', appointmentId: response.data.data?._id } : s
      ));
      
      onSuccess(response.data.data, doctorId);
      onClose();
    } catch (error) {
      if (error.response?.status === 409 || error.response?.data?.code === 'SLOT_ALREADY_BOOKED') {
        toast.error('This slot was just booked by another patient. Please choose another time.');
        // Instantly mark the conflicting slot as booked so it becomes disabled
        setSlots(prevSlots => prevSlots.map(s => 
          s._id === selectedSlot._id ? { ...s, status: 'BOOKED' } : s
        ));
        setSelectedSlot(null);
      } else {
        toast.error(error.response?.data?.message || 'Failed to book appointment');
      }
    } finally {
      setBooking(false);
    }
  };

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Calendar className="w-6 h-6 mr-2 text-indigo-600" /> Book New Appointment
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-white border border-transparent hover:border-gray-200 transition-all">
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleBook} className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Select Doctor */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><Stethoscope className="w-4 h-4 text-indigo-500"/> Select Doctor *</label>
            <select 
              required
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
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
                onClick={() => setMode('video')}
                className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${mode === 'video' ? 'border-indigo-500 bg-indigo-50/50' : 'border-gray-200 hover:border-indigo-300'}`}
              >
                <div className={`p-2 rounded-lg ${mode === 'video' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500'}`}><VideoIcon className="w-5 h-5"/></div>
                <div>
                  <p className={`font-bold ${mode === 'video' ? 'text-indigo-900' : 'text-gray-700'}`}>Online</p>
                  <p className="text-xs text-gray-500">Video Consultation</p>
                </div>
              </div>
              
              <div 
                onClick={() => setMode('in-person')}
                className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${mode === 'in-person' ? 'border-emerald-500 bg-emerald-50/50' : 'border-gray-200 hover:border-emerald-300'}`}
              >
                <div className={`p-2 rounded-lg ${mode === 'in-person' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'}`}><Building2 className="w-5 h-5"/></div>
                <div>
                  <p className={`font-bold ${mode === 'in-person' ? 'text-emerald-900' : 'text-gray-700'}`}>Offline</p>
                  <p className="text-xs text-gray-500">Hospital Visit</p>
                </div>
              </div>
            </div>
          </div>

          {/* Date & Time Selection */}
          {doctorId && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Select Date *</label>
                {loadingDates ? (
                  <p className="text-sm text-gray-500">Loading available dates...</p>
                ) : availableDates.length === 0 ? (
                  <p className="text-sm text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">No upcoming dates available for this doctor.</p>
                ) : (
                  <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    {availableDates.map(d => (
                      <div 
                        key={d}
                        onClick={() => setSelectedDate(d)}
                        className={`flex-shrink-0 cursor-pointer px-4 py-2 rounded-xl border transition-all text-center min-w-[100px] ${selectedDate === d ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200' : 'border-gray-200 bg-white hover:border-indigo-300'}`}
                      >
                        <p className="text-xs font-bold uppercase mb-0.5">{new Date(d).toLocaleDateString([], { weekday: 'short' })}</p>
                        <p className="text-sm font-bold">{new Date(d).getDate()}</p>
                        <p className="text-[10px] text-gray-500">{new Date(d).toLocaleDateString([], { month: 'short' })}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedDate && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Select Time *</label>
                  {loadingSlots ? (
                    <p className="text-sm text-gray-500">Loading slots...</p>
                  ) : slots.length === 0 ? (
                    <p className="text-sm text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">No slots available for this date.</p>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                      {slots.map(slot => {
                        const isAvailable = slot.status === 'AVAILABLE';
                        const isBooked = slot.status === 'BOOKED';
                        const isBlocked = slot.status === 'BLOCKED';
                        const isSelected = selectedSlot?._id === slot._id;
                        
                        return (
                          <button
                            key={slot._id}
                            type="button"
                            disabled={!isAvailable}
                            onClick={() => setSelectedSlot(slot)}
                            className={`flex flex-col items-center justify-center p-2 rounded-lg text-sm font-bold transition-all border min-h-[60px] ${
                              isBooked || isBlocked
                                ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-75'
                                : isSelected 
                                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200 scale-105'
                                  : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50'
                            }`}
                          >
                            <span>{formatTime(slot.startDateTime)}</span>
                            <span className="text-[10px] uppercase mt-0.5 tracking-wider font-semibold opacity-90">
                              {isBooked ? 'Already Booked' : isBlocked ? 'Unavailable' : isSelected ? 'Selected' : 'Available'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Reason for Visit *</label>
            <input 
              type="text" required placeholder="e.g. General Checkup, Fever, etc."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm font-medium bg-gray-50"
            />
          </div>

        </form>
        
        <div className="p-6 pt-4 flex justify-end gap-3 border-t border-gray-100 shrink-0">
          <button type="button" onClick={onClose} className="px-6 py-3 font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-all">
            Cancel
          </button>
          <button 
            disabled={booking || !selectedSlot || selectedSlot.status !== 'AVAILABLE'} 
            onClick={handleBook}
            className="px-6 py-3 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
          >
            {booking ? 'Booking...' : 'Confirm Booking'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookAppointmentModal;
