import React, { useState, useEffect } from 'react';
import { Users, Search, Edit2, Trash2, Eye } from 'lucide-react';
import API from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Spinner } from '../../components/ui/SharedUI';
import DeleteConfirmationModal from '../../components/ui/DeleteConfirmationModal';

const AdminPatientManagement = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await API.get('/api/admin/patients', config);
      setPatients(data.data || []);
    } catch (error) {
      console.error("Error fetching patients:", error);
      toast.error("Failed to load patients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPatients();
    }
  }, [user]);

  const handleRemove = async ({ reason }) => {
    if (!selectedPatient) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await API.patch(`/api/admin/patients/${selectedPatient._id}/remove`, { reason }, config);
      toast.success("Patient removed successfully");
      fetchPatients();
    } catch (error) {
      console.error("Error removing patient:", error);
      toast.error("Failed to remove patient");
    }
  };

  const openDeleteModal = (patient) => {
    setSelectedPatient(patient);
    setIsDeleteModalOpen(true);
  };

  const filteredPatients = patients.filter(p => 
    (p.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Users className="w-6 h-6 mr-2 text-teal-600" /> Patient Management
          </h1>
          <p className="text-gray-500 mt-1">View and manage registered patients across the platform.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <div className="relative w-64">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            <input 
              type="text" 
              placeholder="Search patients..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-white">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Registered</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="5" className="py-12 text-center text-gray-500">
                  <div className="flex justify-center"><Spinner size={40} /></div>
                </td>
              </tr>
            ) : filteredPatients.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <Users className="w-12 h-12 text-gray-300 mb-4" />
                    <p className="font-medium text-lg text-gray-900">No patients found</p>
                    <p className="text-sm">No registered patients are currently available.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredPatients.map((patient) => (
                <tr key={patient._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm mr-3">
                        {patient.user?.name ? patient.user.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : 'PT'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{patient.user?.name}</p>
                        <p className="text-xs text-gray-500">ID: {patient._id.substring(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-900">{patient.user?.email}</p>
                    <p className="text-xs text-gray-500">{patient.user?.phone}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(patient.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      patient.isDeleted ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {patient.isDeleted ? 'Removed' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button className="p-1.5 bg-teal-50 text-teal-600 hover:bg-teal-100 rounded-md transition-colors" title="View Profile">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors" title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => openDeleteModal(patient)} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors" title="Remove">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <DeleteConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleRemove}
        recordName={selectedPatient?.user?.name || 'Patient'}
        description={`This will soft-delete the patient profile for ${selectedPatient?.user?.name}.`}
        requireReason={true}
      />
    </div>
  );
};

export default AdminPatientManagement;
