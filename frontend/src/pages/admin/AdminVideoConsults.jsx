import React, { useState, useEffect } from 'react';
import API from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Video, Search, Filter, ChevronLeft, ChevronRight, 
  User, Stethoscope, Calendar, Clock, MonitorPlay, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import DeleteConfirmationModal from '../../components/ui/DeleteConfirmationModal';

const AdminVideoConsults = () => {
  const { user } = useAuth();
  const [consults, setConsults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedConsult, setSelectedConsult] = useState(null);
  const navigate = useNavigate();

  // Mock Data
  const mockConsults = [];
  
  // Pagination & Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalConsults, setTotalConsults] = useState(0);

  useEffect(() => {
    fetchConsults(currentPage);
  }, [currentPage, statusFilter]);

  const fetchConsults = async (page) => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      
      let url = `/api/appointments?type=video&page=${page}&limit=10`;
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }

      const { data } = await API.get(url, config);
      const fetchedConsults = data.data || [];
      if (fetchedConsults.length > 0) {
        setConsults(fetchedConsults);
        setTotalPages(data.pages || 1);
        setTotalConsults(data.total || 0);
      } else {
        setConsults([]);
        setTotalPages(1);
        setTotalConsults(0);
      }
    } catch (error) {
      console.error('Error fetching admin video consults:', error);
      toast.error('Failed to load video consultations');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (roomId) => {
    navigate(`/consultation/${roomId}`);
  };

  const handleCancel = async ({ reason }) => {
    if (!selectedConsult) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await API.patch(`/api/appointments/${selectedConsult._id}/cancel`, { reason }, config);
      toast.success("Consultation cancelled successfully");
      fetchConsults(currentPage);
    } catch (error) {
      console.error("Error cancelling consult:", error);
      toast.error("Failed to cancel consultation");
    }
  };

  const openDeleteModal = (consult) => {
    setSelectedConsult(consult);
    setIsDeleteModalOpen(true);
  };

  // Client-side search filtering
  const filteredConsults = consults.filter(consult => {
    if (!searchTerm) return true;
    const lowerSearch = searchTerm.toLowerCase();
    const patientName = consult.patient?.name?.toLowerCase() || '';
    const doctorName = consult.doctor?.name?.toLowerCase() || '';
    return patientName.includes(lowerSearch) || doctorName.includes(lowerSearch);
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-700 capitalize">Scheduled</span>;
      case 'completed':
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-100 text-blue-700 capitalize">Completed</span>;
      case 'cancelled':
      case 'no-show':
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-700 capitalize">{status}</span>;
      case 'pending':
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-700 capitalize">Pending</span>;
      default:
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-gray-100 text-gray-700 capitalize">{status || 'Unknown'}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-teal-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Video className="w-48 h-48" />
        </div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-widest mb-4 backdrop-blur-md">
            <MonitorPlay className="w-3 h-3 text-teal-300" /> Virtual Rooms
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-2 text-white">Video Consultations</h1>
          <p className="text-teal-200 text-lg max-w-lg">
            System-wide oversight of all active and scheduled telemedicine sessions.
          </p>
        </div>

        <div className="relative z-10 bg-white/10 p-5 rounded-2xl backdrop-blur-sm border border-white/20 text-center min-w-[160px]">
          <p className="text-4xl font-black text-white">{totalConsults}</p>
          <p className="text-xs font-bold uppercase tracking-wider text-teal-200 mt-1">Total Consults</p>
        </div>
      </div>

      {/* Controls & Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center z-20 relative">
        <div className="relative w-full md:w-96">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by patient or doctor name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
          />
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-5 h-5 text-gray-400" />
            <select 
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full md:w-auto px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none font-medium text-gray-700"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no-show">No Show</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative z-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200">
                <th className="py-4 px-6 font-bold text-xs text-gray-500 uppercase tracking-wider">Patient Details</th>
                <th className="py-4 px-6 font-bold text-xs text-gray-500 uppercase tracking-wider">Assigned Doctor</th>
                <th className="py-4 px-6 font-bold text-xs text-gray-500 uppercase tracking-wider">Schedule</th>
                <th className="py-4 px-6 font-bold text-xs text-gray-500 uppercase tracking-wider">Room ID</th>
                <th className="py-4 px-6 font-bold text-xs text-gray-500 uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 font-bold text-xs text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mb-4"></div>
                      <p className="font-medium">Loading virtual rooms...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredConsults.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Video className="w-12 h-12 text-gray-300 mb-4" />
                      <p className="font-medium text-lg text-gray-900">No video consults found</p>
                      <p className="text-sm">Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredConsults.map((consult) => (
                  <tr key={consult._id} className="hover:bg-gray-50/50 transition-colors">
                    {/* Patient Column */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {consult.patient?.avatar ? (
                          <img src={consult.patient.avatar} alt="Patient" className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center border border-teal-100">
                            <User className="w-5 h-5 text-teal-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-gray-900">{consult.patient?.name || 'Unknown Patient'}</p>
                          <p className="text-xs text-gray-500">{consult.patient?.email || 'N/A'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Doctor Column */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {consult.doctor?.avatar ? (
                          <img src={consult.doctor.avatar} alt="Doctor" className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                            <Stethoscope className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-gray-900">Dr. {consult.doctor?.name || 'Unknown'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Schedule Column */}
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(consult.appointmentDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md w-max">
                          <Clock className="w-3 h-3" />
                          {consult.appointmentTime}
                        </div>
                      </div>
                    </td>

                    {/* Room ID Column */}
                    <td className="py-4 px-6">
                      <p className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md break-all max-w-[120px]">
                        {consult.meetingLink ? consult.meetingLink.split('/').pop() : consult._id.slice(-8)}
                      </p>
                    </td>

                    {/* Status Column */}
                    <td className="py-4 px-6">
                      {getStatusBadge(consult.status)}
                    </td>

                    {/* Actions Column */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {['confirmed', 'in-progress'].includes(consult.status) ? (
                          <button 
                            onClick={() => {
                              const roomId = consult.meetingLink ? consult.meetingLink.split('/').pop() : consult._id.slice(-8);
                              handleAction(roomId);
                            }}
                            className="px-3 py-1.5 text-teal-600 hover:bg-teal-50 hover:border-teal-200 border border-transparent rounded-xl transition-all inline-flex items-center gap-2 font-bold text-sm"
                          >
                            <MonitorPlay className="w-4 h-4" /> Monitor
                          </button>
                        ) : (
                          <span className="text-xs font-bold text-gray-400 px-3">Unavailable</span>
                        )}
                        <button 
                          onClick={() => openDeleteModal(consult)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors tooltip-trigger" 
                          title="Remove (Cancel)"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="border-t border-gray-100 bg-gray-50/50 p-4 flex items-center justify-between">
            <p className="text-sm text-gray-500 font-medium">
              Showing page <span className="font-bold text-gray-900">{currentPage}</span> of <span className="font-bold text-gray-900">{totalPages}</span>
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <DeleteConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleCancel}
        recordName={`Consultation with ${selectedConsult?.doctor?.name || 'doctor'}`}
        description={`This will soft-delete and cancel the video consultation.`}
        requireReason={true}
      />
    </div>
  );
};

export default AdminVideoConsults;
