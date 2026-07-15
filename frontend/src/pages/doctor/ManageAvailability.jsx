import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Trash2, CheckCircle2, XCircle, FileText, Settings, X, PlusCircle } from 'lucide-react';
import API from '../../api/api';
import toast from 'react-hot-toast';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { useDoctorAvailability } from '../../hooks/useDoctorAvailability';

const ManageAvailability = () => {
  const { user } = useAuth();
  const { rules, slots, loading, error, refetch: fetchAvailability } = useDoctorAvailability(user);

  const [showAddModal, setShowAddModal] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [slotDuration, setSlotDuration] = useState(30);
  const [breaks, setBreaks] = useState([]);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');

  const [saving, setSaving] = useState(false);


  const handleAddBreak = () => {
    setBreaks([...breaks, { startTime: '13:00', endTime: '14:00' }]);
  };

  const handleUpdateBreak = (index, field, value) => {
    const newBreaks = [...breaks];
    newBreaks[index][field] = value;
    setBreaks(newBreaks);
  };

  const handleRemoveBreak = (index) => {
    const newBreaks = [...breaks];
    newBreaks.splice(index, 1);
    setBreaks(newBreaks);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        isRecurring,
        startTime,
        endTime,
        slotDuration: Number(slotDuration),
        breaks
      };
      
      if (isRecurring) {
        payload.dayOfWeek = Number(dayOfWeek);
        if (recurrenceEndDate) payload.recurrenceEndDate = recurrenceEndDate;
      } else {
        payload.date = date;
      }

      await API.post('/api/doctors/availability', payload);
      toast.success('Availability saved and slots generated successfully');
      setShowAddModal(false);
      fetchAvailability();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRule = async (id) => {
    if (!window.confirm('Are you sure you want to delete this rule? Unbooked slots will be removed.')) return;
    try {
      await API.delete(`/api/doctors/availability/${id}`);
      toast.success('Availability deleted');
      fetchAvailability();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete availability');
    }
  };

  const handleToggleSlot = async (id) => {
    try {
      const { data } = await API.patch(`/api/doctors/slots/${id}/toggle`);
      setSlots(slots.map(s => s._id === id ? data.data : s));
      toast.success(data.data.status === 'AVAILABLE' ? 'Slot enabled' : 'Slot disabled');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to toggle slot');
    }
  };

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const daysMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="p-4 lg:p-8" style={{ background: colors.background, minHeight: '100vh' }}>
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-600" /> Manage Availability
          </h1>
          <p className="text-gray-500 mt-1">Set your working hours, breaks, and auto-generate appointment slots.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Plus size={18} /> Add Schedule
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Rules Section */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="font-bold text-gray-900">Your Schedules</h2>
          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : error ? (
            <div className="bg-white p-6 rounded-2xl border border-red-100 text-center">
              <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="font-bold text-gray-900 mb-1">Unable to load availability</p>
              <p className="text-sm text-gray-500 mb-4">{error}</p>
              <button 
                onClick={() => fetchAvailability()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm transition-all text-sm"
              >
                Retry
              </button>
            </div>
          ) : rules.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 text-center">
              <Settings className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No availability rules defined yet.</p>
            </div>
          ) : (
            rules.map(rule => (
              <div key={rule._id} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm relative group">
                <button 
                  onClick={() => handleDeleteRule(rule._id)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${rule.isRecurring ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {rule.isRecurring ? 'Recurring' : 'Specific Date'}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 text-sm">
                  {rule.isRecurring ? `Every ${daysMap[rule.dayOfWeek]}` : new Date(rule.date).toLocaleDateString()}
                </h3>
                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                  <Clock size={14} /> {rule.startTime} - {rule.endTime}
                </p>
                <p className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded-lg inline-block">
                  {rule.slotDuration} min slots
                </p>
                {rule.breaks?.length > 0 && (
                  <div className="mt-3 border-t border-gray-100 pt-3">
                    <p className="text-xs font-medium text-gray-700 mb-1">Breaks</p>
                    {rule.breaks.map((b, i) => (
                      <p key={i} className="text-xs text-gray-500">{b.startTime} - {b.endTime}</p>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Generated Slots Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="font-bold text-gray-900">Upcoming Slots</h2>
              <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{slots.length} Total</span>
            </div>
            
            <div className="p-4 md:p-6 max-h-[600px] overflow-y-auto">
              {loading ? (
                <p className="text-sm text-gray-500">Loading slots...</p>
              ) : slots.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500">No generated slots found for the upcoming days.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(slots.reduce((acc, slot) => {
                    const dateStr = formatDate(slot.appointmentDate);
                    if (!acc[dateStr]) acc[dateStr] = [];
                    acc[dateStr].push(slot);
                    return acc;
                  }, {})).map(([dateStr, dateSlots]) => (
                    <div key={dateStr}>
                      <h3 className="font-semibold text-gray-700 text-sm mb-3 sticky top-0 bg-white py-1">{dateStr}</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                        {dateSlots.map(slot => (
                          <div 
                            key={slot._id}
                            className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${
                              slot.status === 'AVAILABLE' ? 'border-indigo-100 bg-indigo-50/50 hover:border-indigo-300' : 
                              slot.status === 'BOOKED' ? 'border-emerald-200 bg-emerald-50 opacity-70 cursor-not-allowed' :
                              'border-gray-200 bg-gray-50 opacity-60'
                            }`}
                          >
                            <span className={`font-bold text-sm ${slot.status === 'AVAILABLE' ? 'text-indigo-900' : slot.status === 'BOOKED' ? 'text-emerald-800' : 'text-gray-600 line-through'}`}>
                              {formatTime(slot.startDateTime)}
                            </span>
                            <span className="text-[10px] uppercase font-bold tracking-wider mt-1 text-gray-500">
                              {slot.status}
                            </span>
                            
                            {slot.status !== 'BOOKED' && (
                              <button 
                                onClick={() => handleToggleSlot(slot._id)}
                                className={`mt-2 text-[10px] px-2 py-1 rounded-full font-medium transition-colors ${
                                  slot.status === 'AVAILABLE' ? 'bg-white text-gray-600 hover:text-red-600' : 'bg-gray-200 text-gray-700 hover:text-indigo-600'
                                }`}
                              >
                                {slot.status === 'AVAILABLE' ? 'Disable' : 'Enable'}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Schedule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">Add Schedule</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 bg-white p-2 rounded-full shadow-sm hover:shadow">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">
              
              <div className="flex gap-4 p-1 bg-gray-100 rounded-xl">
                <button 
                  type="button" 
                  onClick={() => setIsRecurring(false)} 
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isRecurring ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Specific Date
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsRecurring(true)} 
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isRecurring ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Recurring Weekly
                </button>
              </div>

              {isRecurring ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Day of Week</label>
                    <select value={dayOfWeek} onChange={e => setDayOfWeek(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-medium">
                      <option value="1">Monday</option>
                      <option value="2">Tuesday</option>
                      <option value="3">Wednesday</option>
                      <option value="4">Thursday</option>
                      <option value="5">Friday</option>
                      <option value="6">Saturday</option>
                      <option value="0">Sunday</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">End Date (Optional)</label>
                    <input type="date" value={recurrenceEndDate} onChange={e => setRecurrenceEndDate(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-medium" />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Select Date</label>
                  <input type="date" required value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-medium" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Start Time</label>
                  <input type="time" required value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-medium" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">End Time</label>
                  <input type="time" required value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-medium" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Slot Duration (Minutes)</label>
                <select value={slotDuration} onChange={e => setSlotDuration(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-medium">
                  <option value="10">10 mins</option>
                  <option value="15">15 mins</option>
                  <option value="20">20 mins</option>
                  <option value="30">30 mins</option>
                  <option value="45">45 mins</option>
                  <option value="60">60 mins</option>
                </select>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-semibold text-gray-700">Breaks (Optional)</label>
                  <button type="button" onClick={handleAddBreak} className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 flex items-center gap-1">
                    <PlusCircle size={14} /> Add Break
                  </button>
                </div>
                
                {breaks.map((b, i) => (
                  <div key={i} className="flex gap-2 items-center mb-2 animate-in slide-in-from-top-2">
                    <input type="time" required value={b.startTime} onChange={e => handleUpdateBreak(i, 'startTime', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
                    <span className="text-gray-400">to</span>
                    <input type="time" required value={b.endTime} onChange={e => handleUpdateBreak(i, 'endTime', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
                    <button type="button" onClick={() => handleRemoveBreak(i)} className="text-red-400 hover:text-red-600 p-2">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

            </form>
            <div className="p-4 md:p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 rounded-b-3xl">
              <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 text-gray-700 font-bold hover:bg-gray-200 rounded-xl transition-colors">
                Cancel
              </button>
              <button disabled={saving} onClick={handleSubmit} className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20 disabled:opacity-70">
                {saving ? 'Generating...' : 'Save & Generate Slots'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManageAvailability;
