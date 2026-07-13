import React, { useState, useEffect } from 'react';
import API from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { Archive, RefreshCcw, Search, Filter, Loader, Calendar, User, FileText, Activity } from 'lucide-react';
import { Badge, Button, Card } from '../../components/ui/SharedUI';
import toast from 'react-hot-toast';

const ArchivedRecords = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await API.get('/api/admin/archived', config);
      setLogs(data.data || []);
    } catch (error) {
      console.error('Error fetching archived records:', error);
      toast.error('Failed to load archived records');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (log) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      let endpoint = '';
      if (log.resourceType === 'User' || log.resourceType === 'Patient') {
        endpoint = `/api/admin/users/${log.resourceId}/restore`;
      } else if (log.resourceType === 'Doctor') {
        endpoint = `/api/admin/doctors/${log.resourceId}/restore`;
      } else {
        toast.error(`Restore not implemented for ${log.resourceType}`);
        return;
      }
      
      await API.patch(endpoint, {}, config);
      toast.success(`${log.resourceType} restored successfully`);
      fetchLogs();
    } catch (error) {
      console.error('Error restoring record:', error);
      toast.error('Failed to restore record');
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.resourceId?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All' || log.resourceType === filterType;
    return matchesSearch && matchesType;
  });

  const getResourceIcon = (type) => {
    switch (type) {
      case 'User':
      case 'Patient': return <User className="w-5 h-5 text-blue-500" />;
      case 'Doctor': return <Activity className="w-5 h-5 text-emerald-500" />;
      case 'MedicalReport': return <FileText className="w-5 h-5 text-purple-500" />;
      case 'Appointment': return <Calendar className="w-5 h-5 text-orange-500" />;
      default: return <Archive className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Archive className="w-7 h-7 text-gray-700" /> Archived Records
          </h1>
          <p className="text-gray-500 mt-1">View and restore soft-deleted records across the system.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white"
          >
            <option value="All">All Resource Types</option>
            <option value="User">User / Patient</option>
            <option value="Doctor">Doctor</option>
            <option value="MedicalReport">Medical Report</option>
            <option value="Appointment">Appointment</option>
            <option value="Prescription">Prescription</option>
            <option value="Payment">Payment</option>
          </select>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="text-center py-20">
            <Archive className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900">No archived records found</h3>
            <p className="text-gray-500">There are no records matching your criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 text-xs uppercase tracking-wider text-gray-500 font-bold border-b border-gray-100">
                  <th className="px-6 py-4">Resource</th>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Deleted By</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          {getResourceIcon(log.resourceType)}
                        </div>
                        <span className="font-semibold text-gray-900">{log.resourceType}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-gray-600">
                      {log.resourceId}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{log.performedBy?.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{log.performedByRole}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700 max-w-[200px] truncate" title={log.reason}>
                        {log.reason || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {(log.resourceType === 'User' || log.resourceType === 'Patient' || log.resourceType === 'Doctor') && (
                        <button
                          onClick={() => handleRestore(log)}
                          className="inline-flex items-center justify-center p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-all"
                          title="Restore Record"
                        >
                          <RefreshCcw className="w-5 h-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchivedRecords;
