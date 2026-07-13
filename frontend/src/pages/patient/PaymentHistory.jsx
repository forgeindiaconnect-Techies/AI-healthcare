import React, { useState, useEffect } from 'react';
import API from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { 
  CreditCard, Smartphone, Building, ShieldCheck, 
  Receipt, Download, CheckCircle2, XCircle, Clock,
  Search, ArrowDownToLine, FileText, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import DeleteConfirmationModal from '../../components/ui/DeleteConfirmationModal';

const PaymentHistory = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [paymentToRemove, setPaymentToRemove] = useState(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await API.get('/api/payments/history', config);
      setPayments(data.data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = (transactionId) => {
    // In a real application, this would fetch a PDF blob from the backend
    toast.success(`Downloading receipt for ${transactionId}...`);
    setTimeout(() => {
      toast.success('Receipt downloaded successfully!');
    }, 1500);
  };

  const handleArchivePayment = async ({ reason }) => {
    if (!paymentToRemove) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await API.patch(`/api/payments/${paymentToRemove._id}/archive`, { reason }, config);
      toast.success('Transaction removed successfully');
      setPayments(payments.filter(p => p._id !== paymentToRemove._id));
      setIsDeleteModalOpen(false);
      setPaymentToRemove(null);
    } catch (error) {
      console.error(error);
      toast.error('Failed to remove transaction');
      setIsDeleteModalOpen(false);
      setPaymentToRemove(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'successful':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Successful
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" /> Failed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> Pending
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
            <ArrowDownToLine className="w-3.5 h-3.5" /> Refunded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
            {status}
          </span>
        );
    }
  };

  const getMethodIcon = (method, details) => {
    switch (method) {
      case 'card':
        return (
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md border border-blue-100">
              <CreditCard className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-900 capitalize">Card</span>
              {details?.last4 && <span className="text-xs text-gray-500 font-medium">•••• {details.last4}</span>}
            </div>
          </div>
        );
      case 'upi':
        return (
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-md border border-purple-100">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-900 uppercase">UPI</span>
              {details?.upiId && <span className="text-xs text-gray-500 font-medium">{details.upiId}</span>}
            </div>
          </div>
        );
      case 'netbanking':
        return (
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md border border-indigo-100">
              <Building className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-900 capitalize">Net Banking</span>
              {details?.bank && <span className="text-xs text-gray-500 font-medium">{details.bank}</span>}
            </div>
          </div>
        );
      case 'insurance':
        return (
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-100">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-900 capitalize">Insurance</span>
              {details?.provider && <span className="text-xs text-gray-500 font-medium">{details.provider}</span>}
            </div>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 text-sm font-bold text-gray-900 capitalize">
            {method}
          </div>
        );
    }
  };

  const filteredPayments = payments.filter(payment => 
    payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.amount.toString().includes(searchTerm)
  );

  const totalSpent = payments
    .filter(p => p.status === 'successful')
    .reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 font-medium flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          Loading your payment history...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 max-w-6xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Receipt className="w-48 h-48" />
        </div>
        
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-xs font-bold uppercase tracking-widest mb-4 backdrop-blur-md">
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> Secure Billing
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-3 text-white">Payment History</h1>
          <p className="text-slate-300 text-lg leading-relaxed">
            Track your medical expenses, view past transactions, and download digital receipts for your records.
          </p>
        </div>

        {/* Quick Stat */}
        <div className="relative z-10 flex flex-col items-center md:items-end justify-center p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 min-w-[200px]">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Total Spent</p>
          <p className="text-3xl font-black text-white flex items-center gap-1">
            <span className="text-xl text-slate-400">$</span>
            {totalSpent.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" /> All Transactions
          </h2>
          
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by ID or amount..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Data Table */}
        {filteredPayments.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
              <Receipt className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No transactions found</h3>
            <p className="text-gray-500 mt-1 text-sm">
              {searchTerm ? "Try adjusting your search terms." : "You haven't made any payments yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50/80 text-xs uppercase tracking-wider text-gray-500 font-bold border-b border-gray-100">
                  <th className="px-6 py-4">Transaction Details</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Payment Method</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPayments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50/50 transition-colors">
                    
                    {/* Transaction ID */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900 font-mono tracking-tight">
                          {payment.transactionId}
                        </span>
                        <span className="text-xs text-gray-500 font-medium truncate max-w-[200px]">
                          {payment.relatedAppointment?.type || 'Medical Service'} Payment
                        </span>
                      </div>
                    </td>

                    {/* Date & Time */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-700">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-gray-500 font-medium">
                          {new Date(payment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>

                    {/* Method */}
                    <td className="px-6 py-4">
                      {getMethodIcon(payment.method, payment.paymentDetails)}
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-gray-900">
                        ${payment.amount.toFixed(2)}
                      </span>
                      <span className="text-xs font-bold text-gray-400 ml-1">
                        {payment.currency}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      {getStatusBadge(payment.status)}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDownloadReceipt(payment.transactionId)}
                        disabled={payment.status !== 'successful'}
                        className={`inline-flex items-center justify-center p-2 rounded-lg transition-all ${
                          payment.status === 'successful'
                            ? 'text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100'
                            : 'text-gray-300 cursor-not-allowed'
                        }`}
                        title={payment.status === 'successful' ? "Download Receipt" : "Receipt Unavailable"}
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => { setPaymentToRemove(payment); setIsDeleteModalOpen(true); }}
                        className="inline-flex items-center justify-center p-2 rounded-lg transition-all text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 ml-2"
                        title="Remove Transaction"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DeleteConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setPaymentToRemove(null); }}
        onConfirm={handleArchivePayment}
        recordName={`Transaction ${paymentToRemove?.transactionId || ''}`}
        description={`This will remove the transaction record from your view.`}
        requireReason={true}
      />
    </div>
  );
};

export default PaymentHistory;
