import React, { useState, useEffect } from 'react';
import { Calendar, Search, Edit2, Trash2, Eye } from 'lucide-react';
import API from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Spinner, Modal, Badge } from '../../components/ui/SharedUI';
import DeleteConfirmationModal from '../../components/ui/DeleteConfirmationModal';
import { colors } from '../../theme/colors';

const AdminAppointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  
  const [selectedApt, setSelectedApt] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editStatus, setEditStatus] = useState('');

  const fetchAppointments = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      // Adding limit=100 or something if pagination exists, but usually default is enough for demo
      const { data } = await API.get('/api/appointments?limit=100', config);
      setAppointments(data.data || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user]);

  const handleCancel = async ({ reason }) => {
    if (!selectedApt) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await API.patch(`/api/appointments/${selectedApt._id}/cancel`, { reason }, config);
      toast.success("Appointment cancelled/removed successfully");
      fetchAppointments();
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      toast.error(error.response?.data?.message || "Failed to remove appointment");
    }
  };

  const openDeleteModal = (apt) => {
    setSelectedApt(apt);
    setIsDeleteModalOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!editStatus) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await API.put(`/api/appointments/${selectedApt._id}/status`, { status: editStatus }, config);
      toast.success("Appointment status updated");
      setIsEditModalOpen(false);
      fetchAppointments();
    } catch (error) {
      console.error("Error updating appointment:", error);
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    const searchMatch = 
      apt.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      apt.doctor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.type?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const statusMatch = statusFilter === 'All Statuses' || apt.status.toLowerCase() === statusFilter.toLowerCase();
    return searchMatch && statusMatch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Spinner size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Calendar className="w-6 h-6 mr-2 text-teal-600" /> All Appointments
          </h1>
          <p className="text-gray-500 mt-1">Monitor and manage all system-wide appointments.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <div className="relative w-64">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            <input 
              type="text" 
              placeholder="Search appointments..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex space-x-2 text-sm">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:ring-teal-500 focus:border-teal-500"
            >
              <option>All Statuses</option>
              <option value="pending">Pending</option>
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-white">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient & Doctor</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Schedule</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredAppointments.map((apt) => (
              <tr key={apt._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <p className="text-sm font-bold text-gray-900">{apt.patient?.name || 'Unknown Patient'}</p>
                  <p className="text-xs text-gray-500">with {apt.doctor?.name || 'Unknown Doctor'}</p>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <p className="text-sm text-gray-900">{new Date(apt.appointmentDate).toDateString()}</p>
                  <p className="text-xs text-gray-500">{apt.appointmentTime}</p>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {apt.type} {apt.mode && `(${apt.mode})`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                    apt.status === 'completed' ? 'bg-green-100 text-green-800' : 
                    apt.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                    (apt.status === 'scheduled' || apt.status === 'confirmed') ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {apt.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button 
                    onClick={() => { setSelectedApt(apt); setIsViewModalOpen(true); }}
                    className="p-1.5 bg-teal-50 text-teal-600 hover:bg-teal-100 rounded-md transition-colors" 
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => { setSelectedApt(apt); setEditStatus(apt.status); setIsEditModalOpen(true); }}
                    className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors" 
                    title="Edit Status"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => openDeleteModal(apt)}
                    className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors" 
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filteredAppointments.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  No appointments found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* View Appointment Modal */}
      <Modal open={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Appointment Details" width={500}>
        {selectedApt && (
          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center border-b border-gray-100 py-3">
              <span className="text-sm font-medium text-gray-500">Patient</span>
              <span className="font-semibold text-gray-900">{selectedApt.patient?.name || 'Unknown Patient'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-100 py-3">
              <span className="text-sm font-medium text-gray-500">Doctor</span>
              <span className="font-semibold text-gray-900">{selectedApt.doctor?.name || 'Unknown Doctor'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-100 py-3">
              <span className="text-sm font-medium text-gray-500">Date & Time</span>
              <span className="font-semibold text-gray-900">{new Date(selectedApt.appointmentDate).toDateString()} at {selectedApt.appointmentTime}</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-100 py-3">
              <span className="text-sm font-medium text-gray-500">Status</span>
              <Badge label={selectedApt.status} color={selectedApt.status === 'completed' ? colors.success : colors.primary} />
            </div>
            <div className="flex justify-between items-center border-b border-gray-100 py-3">
              <span className="text-sm font-medium text-gray-500">Mode</span>
              <span className="font-semibold text-gray-900 capitalize">{selectedApt.mode}</span>
            </div>
            <div className="py-4">
              <span className="text-sm font-medium text-gray-500 block mb-2">Reason for Visit</span>
              <p className="bg-gray-50 p-4 rounded-xl text-gray-800 border border-gray-100 leading-relaxed shadow-sm">
                {selectedApt.reason || 'No reason provided.'}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Status Modal */}
      <Modal open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Update Status" width={400}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Update the status for this appointment.</p>
          <select 
            value={editStatus} 
            onChange={(e) => setEditStatus(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="pending">Pending</option>
            <option value="scheduled">Scheduled</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no-show">No Show</option>
          </select>
          <div className="flex justify-end space-x-2 pt-4">
            <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-gray-500 hover:text-gray-700">Cancel</button>
            <button onClick={handleUpdateStatus} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">Save</button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleCancel}
        recordName={`Appointment on ${selectedApt ? new Date(selectedApt.appointmentDate).toLocaleDateString() : ''}`}
        description={`This will soft-delete or cancel the appointment with ${selectedApt?.doctor?.name}.`}
        requireReason={true}
      />
    </div>
  );
};

export default AdminAppointments;
