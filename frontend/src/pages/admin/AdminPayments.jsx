import React, { useState, useEffect } from 'react';
import API from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { 
  CreditCard, Search, Download, Filter, ChevronLeft, ChevronRight, 
  User, DollarSign, Activity, FileText, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import DeleteConfirmationModal from '../../components/ui/DeleteConfirmationModal';

const AdminPayments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  
  // Pagination & Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      // Backend /api/payments returns ALL system payments for admin
      const { data } = await API.get('/api/payments', config);
      setPayments(data.data || []);
    } catch (error) {
      console.error('Error fetching admin payments:', error);
      toast.error('Failed to load system payments');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (id) => {
    toast.success(`Downloading receipt for Transaction ID: ${id}`);
  };

  const handleArchive = async ({ reason }) => {
    if (!selectedPayment) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await API.patch(`/api/payments/${selectedPayment._id}/archive`, { reason }, config);
      toast.success("Payment archived successfully");
      fetchPayments();
    } catch (error) {
      console.error("Error archiving payment:", error);
      toast.error("Failed to archive payment");
    }
  };

  const openDeleteModal = (payment) => {
    setSelectedPayment(payment);
    setIsDeleteModalOpen(true);
  };

  // Client-side filtering and pagination
  const filteredPayments = payments.filter(payment => {
    // Status Filter
    if (statusFilter !== 'all' && payment.status !== statusFilter) {
      return false;
    }
    // Search Filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      const patientName = payment.patient?.name?.toLowerCase() || '';
      const transactionId = payment.transactionId?.toLowerCase() || '';
      return patientName.includes(lowerSearch) || transactionId.includes(lowerSearch);
    }
    return true;
  });

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage) || 1;
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Metrics Calculation
  const totalRevenue = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-700 capitalize">Successful</span>;
      case 'pending':
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-700 capitalize">Pending</span>;
      case 'failed':
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-700 capitalize">Failed</span>;
      case 'refunded':
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-purple-100 text-purple-700 capitalize">Refunded</span>;
      default:
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-gray-100 text-gray-700 capitalize">{status || 'Unknown'}</span>;
    }
  };

  const getMethodBadge = (method) => {
    switch (method) {
      case 'card':
        return <span className="font-bold text-gray-700 uppercase tracking-wider text-xs">Card</span>;
      case 'upi':
        return <span className="font-bold text-gray-700 uppercase tracking-wider text-xs">UPI</span>;
      case 'netbanking':
        return <span className="font-bold text-gray-700 uppercase tracking-wider text-xs">Net Banking</span>;
      default:
        return <span className="font-bold text-gray-700 uppercase tracking-wider text-xs">{method || 'N/A'}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-sky-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <CreditCard className="w-48 h-48" />
        </div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-widest mb-4 backdrop-blur-md">
            <DollarSign className="w-3 h-3 text-sky-300" /> Financial Overview
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-2 text-white">Manage Payments</h1>
          <p className="text-sky-200 text-lg max-w-lg">
            System-wide administration of all financial transactions, revenue, and billing history.
          </p>
        </div>

        <div className="relative z-10 flex gap-4">
          <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-sm border border-white/20 text-center min-w-[140px]">
            <p className="text-3xl font-black text-white">{payments.length}</p>
            <p className="text-xs font-bold uppercase tracking-wider text-sky-200 mt-1">Transactions</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-lg border border-sky-100 text-center min-w-[180px]">
            <p className="text-3xl font-black text-slate-900">{formatCurrency(totalRevenue)}</p>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-1">Total Revenue</p>
          </div>
        </div>
      </div>

      {/* Controls & Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center z-20 relative">
        <div className="relative w-full md:w-96">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by patient name or transaction ID..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
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
              className="w-full md:w-auto px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none font-medium text-gray-700"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Successful</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
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
                <th className="py-4 px-6 font-bold text-xs text-gray-500 uppercase tracking-wider">Transaction Details</th>
                <th className="py-4 px-6 font-bold text-xs text-gray-500 uppercase tracking-wider">Patient Info</th>
                <th className="py-4 px-6 font-bold text-xs text-gray-500 uppercase tracking-wider">Amount & Method</th>
                <th className="py-4 px-6 font-bold text-xs text-gray-500 uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 font-bold text-xs text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <div className="w-8 h-8 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin mb-4"></div>
                      <p className="font-medium">Loading ledger...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedPayments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <FileText className="w-12 h-12 text-gray-300 mb-4" />
                      <p className="font-medium text-lg text-gray-900">No transactions found</p>
                      <p className="text-sm">Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedPayments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50/50 transition-colors">
                    {/* Transaction Column */}
                    <td className="py-4 px-6">
                      <p className="font-bold text-gray-900 font-mono text-sm">{payment.transactionId || 'N/A'}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(payment.createdAt).toLocaleDateString(undefined, { 
                          month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                        })}
                      </p>
                    </td>

                    {/* Patient Column */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {payment.patient?.avatar ? (
                          <img src={payment.patient.avatar} alt="Patient" className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center border border-sky-100">
                            <User className="w-5 h-5 text-sky-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-gray-900">{payment.patient?.name || 'Unknown Patient'}</p>
                          <p className="text-xs text-gray-500">{payment.patient?.email || 'N/A'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Amount Column */}
                    <td className="py-4 px-6">
                      <p className="font-black text-gray-900 text-lg">{formatCurrency(payment.amount)}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <CreditCard className="w-3 h-3 text-gray-400" />
                        {getMethodBadge(payment.method)}
                      </div>
                    </td>

                    {/* Status Column */}
                    <td className="py-4 px-6">
                      {getStatusBadge(payment.status)}
                    </td>

                    {/* Actions Column */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {payment.status === 'completed' ? (
                          <button 
                            onClick={() => handleDownload(payment.transactionId)}
                            className="p-2 text-sky-600 hover:bg-sky-50 rounded-xl transition-colors tooltip-trigger inline-flex items-center gap-2 font-bold text-sm border border-transparent hover:border-sky-100"
                          >
                            <Download className="w-4 h-4" /> Receipt
                          </button>
                        ) : (
                          <span className="text-xs font-bold text-gray-400 px-3">Unavailable</span>
                        )}
                        <button 
                          onClick={() => openDeleteModal(payment)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors tooltip-trigger" 
                          title="Archive Payment"
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
        onConfirm={handleArchive}
        recordName={`Transaction ${selectedPayment?.transactionId || 'Payment'}`}
        description={`This will soft-delete and archive the payment record.`}
        requireReason={true}
      />
    </div>
  );
};

export default AdminPayments;
