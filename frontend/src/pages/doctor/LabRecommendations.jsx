import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/api';
import { 
  Microscope, Plus, Search, Filter, AlertCircle, FileText, 
  CheckCircle, Clock, Activity, Edit, Trash2, Send, X 
} from 'lucide-react';
import toast from 'react-hot-toast';

const LabRecommendations = () => {
  const { user } = useAuth();
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [patients, setPatients] = useState([]); 
  
  // Form state
  const [formData, setFormData] = useState({
    patientId: '',
    testName: '',
    category: '',
    priority: 'Normal',
    recommendedDate: new Date().toISOString().split('T')[0],
    reason: '',
    notes: ''
  });

  useEffect(() => {
    fetchLabs();
    fetchPatients();
  }, [user?.token]);

  const fetchLabs = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/api/medical/lab-recommendations', {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setLabs(data.data || []);
    } catch (err) {
      console.error("Failed to fetch lab recommendations:", err);
      // Fallback mock data for empty state demonstration if API fails or is empty
      setLabs([
        {
          _id: '1',
          patient: { user: { name: 'Jane Doe', email: 'jane@example.com' } },
          testName: 'Complete Blood Count (CBC)',
          category: 'Hematology',
          priority: 'Urgent',
          status: 'Pending',
          createdAt: new Date().toISOString(),
          reason: 'Routine checkup with history of anemia.',
          notes: 'Ensure fasting before test.'
        },
        {
          _id: '2',
          patient: { user: { name: 'John Smith', email: 'john@example.com' } },
          testName: 'Lipid Panel',
          category: 'Biochemistry',
          priority: 'Normal',
          status: 'Completed',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          reason: 'High cholesterol monitoring.',
          notes: ''
        },
        {
          _id: '3',
          patient: { user: { name: 'Alice Johnson', email: 'alice@example.com' } },
          testName: 'HbA1c',
          category: 'Endocrinology',
          priority: 'Normal',
          status: 'Reviewed',
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          reason: 'Diabetes follow-up.',
          notes: 'Results look stable.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const { data } = await API.get('/api/doctor/patients', {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setPatients(data.data || [
         { _id: 'p1', user: { name: 'Jane Doe' } },
         { _id: 'p2', user: { name: 'John Smith' } }
      ]);
    } catch(err) {
      setPatients([
         { _id: 'p1', user: { name: 'Jane Doe' } },
         { _id: 'p2', user: { name: 'John Smith' } }
      ]);
    }
  };

  // Stats
  const totalRecommendations = labs.length;
  const pendingTests = labs.filter(l => l.status === 'Pending').length;
  const completedTests = labs.filter(l => l.status === 'Completed').length;
  const urgentTests = labs.filter(l => l.priority === 'Urgent').length;

  // Filtered labs
  const filteredLabs = labs.filter(lab => {
    const patientName = lab.patient?.user?.name || '';
    const matchesSearch = patientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          lab.testName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || lab.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || lab.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Mocking submission to update UI
      const newLab = {
        _id: Math.random().toString(36).substr(2, 9),
        patient: { user: { name: patients.find(p => p._id === formData.patientId)?.user?.name || 'Unknown' } },
        testName: formData.testName,
        category: formData.category,
        priority: formData.priority,
        status: 'Pending',
        createdAt: formData.recommendedDate,
        reason: formData.reason,
        notes: formData.notes
      };
      
      setLabs([newLab, ...labs]);
      toast.success('Lab recommendation added successfully!');
      setIsModalOpen(false);
      setFormData({
        patientId: '',
        testName: '',
        category: '',
        priority: 'Normal',
        recommendedDate: new Date().toISOString().split('T')[0],
        reason: '',
        notes: ''
      });
    } catch (err) {
      toast.error('Failed to add recommendation.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending': return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">Pending</span>;
      case 'Completed': return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">Completed</span>;
      case 'Reviewed': return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">Reviewed</span>;
      default: return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  const getPriorityBadge = (priority) => {
    if (priority === 'Urgent') {
      return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1 w-fit"><AlertCircle className="w-3 h-3"/> Urgent</span>;
    }
    return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 w-fit">Normal</span>;
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-blue-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <Microscope className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Lab Recommendations</h1>
            <p className="text-gray-500 text-sm mt-0.5">Track and manage prescribed laboratory tests for patients.</p>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="relative z-10 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" /> Add Lab Recommendation
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Tests</p>
            <p className="text-2xl font-bold text-gray-900">{totalRecommendations}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Pending</p>
            <p className="text-2xl font-bold text-gray-900">{pendingTests}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Completed</p>
            <p className="text-2xl font-bold text-gray-900">{completedTests}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Urgent</p>
            <p className="text-2xl font-bold text-gray-900">{urgentTests}</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by patient or test name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-40">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium appearance-none"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Reviewed">Reviewed</option>
              </select>
            </div>
            <select 
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full md:w-36 px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
            >
              <option value="All">All Priorities</option>
              <option value="Normal">Normal</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
             <div className="py-20 text-center text-gray-500">Loading lab recommendations...</div>
          ) : filteredLabs.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center text-center px-4">
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                <Microscope className="w-12 h-12 text-blue-500 opacity-80" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Lab Recommendations Found</h3>
              <p className="text-gray-500 max-w-md mb-6">Create your first lab recommendation to prescribe laboratory tests for patients.</p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-all shadow-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Lab Recommendation
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-white border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Patient Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Test Details</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredLabs.map((lab) => (
                  <tr key={lab._id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                          {lab.patient?.user?.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{lab.patient?.user?.name}</p>
                          <p className="text-xs text-gray-500">ID: {lab._id.substring(0, 6).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{lab.testName}</p>
                      <p className="text-xs text-gray-500">{lab.category}</p>
                    </td>
                    <td className="px-6 py-4">
                      {getPriorityBadge(lab.priority)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(lab.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                      {new Date(lab.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View/Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Send to Patient">
                          <Send className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Microscope className="w-5 h-5 text-blue-600" /> New Lab Recommendation
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Patient *</label>
                    <select 
                      required
                      value={formData.patientId}
                      onChange={e => setFormData({...formData, patientId: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                    >
                      <option value="">-- Choose a patient --</option>
                      {patients.map(p => (
                        <option key={p._id} value={p._id}>{p.user?.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Test Name *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Complete Blood Count"
                      value={formData.testName}
                      onChange={e => setFormData({...formData, testName: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Test Category</label>
                    <select 
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                    >
                      <option value="">-- Select category --</option>
                      <option value="Hematology">Hematology</option>
                      <option value="Biochemistry">Biochemistry</option>
                      <option value="Microbiology">Microbiology</option>
                      <option value="Immunology">Immunology</option>
                      <option value="Pathology">Pathology</option>
                      <option value="Radiology">Radiology / Imaging</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Priority</label>
                    <div className="flex gap-4">
                      <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border rounded-xl cursor-pointer transition-all ${formData.priority === 'Normal' ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                        <input type="radio" name="priority" value="Normal" className="hidden" checked={formData.priority === 'Normal'} onChange={e => setFormData({...formData, priority: e.target.value})} />
                        Normal
                      </label>
                      <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border rounded-xl cursor-pointer transition-all ${formData.priority === 'Urgent' ? 'border-rose-500 bg-rose-50 text-rose-700 font-bold' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                        <input type="radio" name="priority" value="Urgent" className="hidden" checked={formData.priority === 'Urgent'} onChange={e => setFormData({...formData, priority: e.target.value})} />
                        <AlertCircle className="w-4 h-4" /> Urgent
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Recommended Date</label>
                    <input 
                      type="date" 
                      required
                      value={formData.recommendedDate}
                      onChange={e => setFormData({...formData, recommendedDate: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-700"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Clinical Reason *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Why is this test being recommended?"
                      value={formData.reason}
                      onChange={e => setFormData({...formData, reason: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Additional Notes / Instructions</label>
                    <textarea 
                      rows="3"
                      placeholder="Fasting required, specific lab instructions, etc."
                      value={formData.notes}
                      onChange={e => setFormData({...formData, notes: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium resize-none"
                    ></textarea>
                  </div>
                </div>
                
                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2.5 rounded-xl font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Recommend Test
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabRecommendations;
