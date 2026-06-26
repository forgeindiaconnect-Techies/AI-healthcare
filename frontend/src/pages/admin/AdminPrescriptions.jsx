import React, { useState, useEffect } from 'react';
import API from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Pill, Search, Eye, Filter, ChevronLeft, ChevronRight, 
  User, Calendar, Stethoscope, FileText, ShieldCheck, Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../../components/shared/Modal';

const AdminPrescriptions = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  // Pagination & Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPrescriptions, setTotalPrescriptions] = useState(0);

  useEffect(() => {
    fetchPrescriptions(currentPage);
  }, [currentPage, statusFilter]);

  const fetchPrescriptions = async (page) => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      
      let url = `/api/prescriptions?page=${page}&limit=10`;
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }

      const { data } = await API.get(url, config);
      setPrescriptions(data.data || []);
      setTotalPages(data.pages || 1);
      setTotalPrescriptions(data.total || 0);
    } catch (error) {
      console.error('Error fetching admin prescriptions:', error);
      toast.error('Failed to load system prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (prescription) => {
    setSelectedPrescription(prescription);
    setIsViewModalOpen(true);
  };

  // Client-side search filtering
  const filteredPrescriptions = prescriptions.filter(prescription => {
    if (!searchTerm) return true;
    const lowerSearch = searchTerm.toLowerCase();
    const patientName = prescription.patient?.name?.toLowerCase() || '';
    const doctorName = prescription.doctor?.name?.toLowerCase() || '';
    const diagnosis = prescription.diagnosis?.toLowerCase() || '';
    return patientName.includes(lowerSearch) || doctorName.includes(lowerSearch) || diagnosis.includes(lowerSearch);
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-700 capitalize">Active</span>;
      case 'completed':
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-100 text-blue-700 capitalize">Completed</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-700 capitalize">Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-gray-100 text-gray-700 capitalize">{status || 'Unknown'}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-rose-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Pill className="w-48 h-48" />
        </div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-widest mb-4 backdrop-blur-md">
            <ShieldCheck className="w-3 h-3 text-rose-300" /> Admin Access
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-2 text-white">Manage Prescriptions</h1>
          <p className="text-rose-200 text-lg">
            System-wide oversight of all medications prescribed by hospital doctors.
          </p>
        </div>

        <div className="relative z-10 bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/20 text-center min-w-[150px]">
          <p className="text-4xl font-black text-white">{totalPrescriptions}</p>
          <p className="text-xs font-bold uppercase tracking-wider text-rose-200 mt-1">Total Issued</p>
        </div>
      </div>

      {/* Controls & Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center z-20 relative">
        <div className="relative w-full md:w-96">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by patient, doctor, or diagnosis..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all"
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
              className="w-full md:w-auto px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none font-medium text-gray-700"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
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
                <th className="py-4 px-6 font-bold text-xs text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="py-4 px-6 font-bold text-xs text-gray-500 uppercase tracking-wider">Prescribing Doctor</th>
                <th className="py-4 px-6 font-bold text-xs text-gray-500 uppercase tracking-wider">Diagnosis</th>
                <th className="py-4 px-6 font-bold text-xs text-gray-500 uppercase tracking-wider">Medicines</th>
                <th className="py-4 px-6 font-bold text-xs text-gray-500 uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 font-bold text-xs text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin mb-4"></div>
                      <p className="font-medium">Loading prescriptions...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredPrescriptions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Pill className="w-12 h-12 text-gray-300 mb-4" />
                      <p className="font-medium text-lg text-gray-900">No prescriptions found</p>
                      <p className="text-sm">Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPrescriptions.map((prescription) => (
                  <tr key={prescription._id} className="hover:bg-gray-50/50 transition-colors">
                    {/* Patient Column */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {prescription.patient?.avatar ? (
                          <img src={prescription.patient.avatar} alt="Patient" className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center border border-rose-100">
                            <User className="w-5 h-5 text-rose-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-gray-900">{prescription.patient?.name || 'Unknown'}</p>
                          <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            {new Date(prescription.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Doctor Column */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">Dr. {prescription.doctor?.name?.replace(/^Dr\.\s*/i, '') || 'Unknown'}</span>
                      </div>
                    </td>

                    {/* Diagnosis Column */}
                    <td className="py-4 px-6">
                      <p className="font-medium text-gray-900 truncate max-w-[200px]">{prescription.diagnosis || 'N/A'}</p>
                    </td>

                    {/* Medicines Column */}
                    <td className="py-4 px-6">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg">
                        <Pill className="w-4 h-4 text-gray-500" />
                        <span className="font-bold text-gray-700">{prescription.medicines?.length || 0}</span>
                      </div>
                    </td>

                    {/* Status Column */}
                    <td className="py-4 px-6">
                      {getStatusBadge(prescription.status)}
                    </td>

                    {/* Actions Column */}
                    <td className="py-4 px-6 text-right">
                      <button 
                        onClick={() => handleView(prescription)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors tooltip-trigger inline-flex items-center gap-2 font-bold text-sm"
                      >
                        <Eye className="w-4 h-4" /> View
                      </button>
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

      {/* View Prescription Modal */}
      <Modal open={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Prescription Details" width={600}>
        {selectedPrescription && (
          <div className="space-y-6">
            {/* Header / Info */}
            <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-4">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Patient</p>
                <p className="font-bold text-gray-900">{selectedPrescription.patient?.name || 'Unknown'}</p>
                <p className="text-sm text-gray-500">{selectedPrescription.patient?.email}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Doctor</p>
                <p className="font-bold text-gray-900">Dr. {selectedPrescription.doctor?.name?.replace(/^Dr\.\s*/i, '') || 'Unknown'}</p>
                <p className="text-sm text-gray-500">{new Date(selectedPrescription.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Diagnosis & Status */}
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Diagnosis</p>
                <p className="font-bold text-gray-900">{selectedPrescription.diagnosis || 'N/A'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Status</p>
                {getStatusBadge(selectedPrescription.status)}
              </div>
            </div>

            {/* Medicines List */}
            <div>
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Pill className="w-5 h-5 text-rose-500" /> Prescribed Medicines
              </h4>
              <div className="space-y-3">
                {selectedPrescription.medicines?.length > 0 ? (
                  selectedPrescription.medicines.map((med, index) => (
                    <div key={index} className="bg-white border border-gray-100 p-3 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-bold text-gray-900">{med.name}</h5>
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded text-xs font-bold">{med.duration}</span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> {med.dosage}</span>
                        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> {med.frequency}</span>
                        {med.instructions && (
                          <span className="flex items-center gap-1.5 w-full mt-1 text-gray-500 italic">
                            <FileText className="w-3.5 h-3.5" /> {med.instructions}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">No medicines listed.</p>
                )}
              </div>
            </div>

            {/* Notes */}
            {selectedPrescription.notes && (
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" /> Doctor's Notes
                </p>
                <p className="text-sm text-amber-900">{selectedPrescription.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

    </div>
  );
};

export default AdminPrescriptions;
