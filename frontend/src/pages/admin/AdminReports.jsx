import React, { useState, useEffect } from 'react';
import API from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { 
  FileText, Search, Download, Eye, ShieldCheck, 
  Filter, ChevronLeft, ChevronRight, User, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination & Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReports, setTotalReports] = useState(0);

  useEffect(() => {
    fetchReports(currentPage);
  }, [currentPage, statusFilter]);

  const fetchReports = async (page) => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      
      let url = `/api/reports?page=${page}&limit=10`;
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }

      const { data } = await API.get(url, config);
      setReports(data.data || []);
      setTotalPages(data.pages || 1);
      setTotalReports(data.total || 0);
    } catch (error) {
      console.error('Error fetching admin reports:', error);
      toast.error('Failed to load system reports');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (action, id) => {
    toast.success(`Action "${action}" triggered for Report ID: ${id}`);
  };

  // Client-side search filtering (since the API might not support native text search)
  const filteredReports = reports.filter(report => {
    if (!searchTerm) return true;
    const lowerSearch = searchTerm.toLowerCase();
    const patientName = report.patient?.name?.toLowerCase() || '';
    const patientEmail = report.patient?.email?.toLowerCase() || '';
    const title = report.title?.toLowerCase() || '';
    return patientName.includes(lowerSearch) || patientEmail.includes(lowerSearch) || title.includes(lowerSearch);
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'reviewed':
      case 'completed':
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-700 capitalize">{status}</span>;
      case 'pending':
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-700 capitalize">{status}</span>;
      case 'processing':
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-100 text-blue-700 capitalize">{status}</span>;
      default:
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-gray-100 text-gray-700 capitalize">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <ShieldCheck className="w-48 h-48" />
        </div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-widest mb-4 backdrop-blur-md">
            <ShieldCheck className="w-3 h-3 text-indigo-300" /> Admin Access
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-2 text-white">Manage Medical Reports</h1>
          <p className="text-indigo-200 text-lg">
            System-wide overview and management of all patient medical records and reports.
          </p>
        </div>

        <div className="relative z-10 bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/20 text-center min-w-[150px]">
          <p className="text-4xl font-black text-white">{totalReports}</p>
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-200 mt-1">Total Reports</p>
        </div>
      </div>

      {/* Controls & Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center z-20 relative">
        <div className="relative w-full md:w-96">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by patient name, email, or report title..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
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
              className="w-full md:w-auto px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-gray-700"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="processing">Processing</option>
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
                <th className="py-4 px-6 font-bold text-xs text-gray-500 uppercase tracking-wider">Report Info</th>
                <th className="py-4 px-6 font-bold text-xs text-gray-500 uppercase tracking-wider">Date Uploaded</th>
                <th className="py-4 px-6 font-bold text-xs text-gray-500 uppercase tracking-wider">Uploaded By</th>
                <th className="py-4 px-6 font-bold text-xs text-gray-500 uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 font-bold text-xs text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                      <p className="font-medium">Loading reports...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <FileText className="w-12 h-12 text-gray-300 mb-4" />
                      <p className="font-medium text-lg text-gray-900">No reports found</p>
                      <p className="text-sm">Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr key={report._id} className="hover:bg-gray-50/50 transition-colors">
                    {/* Patient Column */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {report.patient?.avatar ? (
                          <img src={report.patient.avatar} alt="Patient" className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100">
                            <User className="w-5 h-5 text-indigo-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-gray-900">{report.patient?.name || 'Unknown Patient'}</p>
                          <p className="text-xs text-gray-500">{report.patient?.email || 'N/A'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Report Info Column */}
                    <td className="py-4 px-6">
                      <p className="font-bold text-gray-900 truncate max-w-[200px]">{report.title}</p>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{report.reportType || 'General'}</p>
                    </td>

                    {/* Date Column */}
                    <td className="py-4 px-6">
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(report.reportDate || report.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </td>

                    {/* Uploaded By Column */}
                    <td className="py-4 px-6">
                      <p className="text-sm font-medium text-gray-900">{report.uploadedBy?.name || 'System'}</p>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{report.uploadedBy?.role || 'User'}</p>
                    </td>

                    {/* Status Column */}
                    <td className="py-4 px-6">
                      {getStatusBadge(report.status)}
                    </td>

                    {/* Actions Column */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleAction('View', report._id)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors tooltip-trigger"
                          title="View Report"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleAction('Download', report._id)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors tooltip-trigger"
                          title="Download PDF"
                        >
                          <Download className="w-5 h-5" />
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

    </div>
  );
};

export default AdminReports;
