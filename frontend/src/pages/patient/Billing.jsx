import React, { useState, useEffect, useRef } from 'react';
import { CreditCard, Shield, Download, FileText, CheckCircle, Clock, Plus, Activity, ChevronRight, X, Loader2, Landmark, Smartphone, UploadCloud, Building, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import domtoimage from 'dom-to-image-more';
import { jsPDF } from 'jspdf';
import { useAuth } from '../../context/AuthContext';

const Billing = () => {
  const { user } = useAuth();
  
  // Data States
  const [invoices, setInvoices] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [activePaymentTab, setActivePaymentTab] = useState('card');
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  
  const [isInvoiceViewerOpen, setIsInvoiceViewerOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [isCoverageModalOpen, setIsCoverageModalOpen] = useState(false);
  const [isSavingCard, setIsSavingCard] = useState(false);

  // Forms State
  const [cardForm, setCardForm] = useState({ name: '', number: '', expiry: '', cvv: '', address: '', saveCard: false });
  const [netBankingForm, setNetBankingForm] = useState({ bank: '', accountName: '' });
  const [upiForm, setUpiForm] = useState({ upiId: '' });
  const [insuranceForm, setInsuranceForm] = useState({ provider: 'BlueCross', policyNumber: 'ABC123456789' });

  const invoiceRef = useRef(null);

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      
      // Fetch appointments to generate pending invoices (appointments with pending payment)
      const aptsRes = await axios.get('/api/appointments', config);
      const allApts = aptsRes.data.data || [];
      
      const pendingInvoices = allApts
        .filter(apt => apt.paymentStatus === 'pending' && apt.consultationFee > 0)
        .map(apt => ({
          id: apt._id,
          invoiceId: `INV-${apt._id.substring(0, 8).toUpperCase()}`,
          title: `${apt.type === 'general' ? 'General Consultation' : 'Specialist Visit'} - Dr. ${apt.doctor?.name || 'Assigned'}`,
          date: new Date(apt.appointmentDate).toLocaleDateString(),
          amount: apt.consultationFee,
          status: 'Pending Payment',
          rawDate: apt.appointmentDate
        }));

      setInvoices(pendingInvoices);

      // Fetch actual payment history
      const paymentsRes = await axios.get('/api/payments/history', config);
      setPaymentHistory(paymentsRes.data.data || []);
      
    } catch (error) {
      console.error('Error fetching billing data:', error);
      toast.error('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) {
      fetchData();
    }
  }, [user]);

  const openInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setIsInvoiceViewerOpen(true);
  };

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    
    const toastId = toast.loading('Generating proper PDF...');
    try {
      const node = invoiceRef.current;
      const scale = 2;
      
      const imgData = await domtoimage.toPng(node, {
        height: node.offsetHeight * scale,
        width: node.offsetWidth * scale,
        style: {
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: `${node.offsetWidth}px`,
          height: `${node.offsetHeight}px`
        }
      });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (node.offsetHeight * pdfWidth) / node.offsetWidth;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${selectedInvoice?.invoiceId || 'invoice'}.pdf`);
      toast.success('PDF downloaded successfully!', { id: toastId });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF', { id: toastId });
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInvoiceForPayment) return;

    setIsProcessing(true);
    
    // Construct payment payload based on active tab
    const payload = {
      amount: selectedInvoiceForPayment.amount,
      currency: 'USD',
      relatedAppointment: selectedInvoiceForPayment.id,
      description: selectedInvoiceForPayment.title,
      method: activePaymentTab === 'insurance' ? 'insurance' : 
              activePaymentTab === 'upi' ? 'upi' : 
              activePaymentTab === 'netbanking' ? 'netbanking' : 'card'
    };

    if (activePaymentTab === 'card' || activePaymentTab === 'debit') {
      if (!cardForm.number || !cardForm.cvv || !cardForm.expiry) {
        setIsProcessing(false);
        return toast.error('Please fill all card details');
      }
      payload.paymentData = { cardNumber: cardForm.number, cvv: cardForm.cvv, expiry: cardForm.expiry, name: cardForm.name };
    } else if (activePaymentTab === 'netbanking') {
      if (!netBankingForm.bank) {
        setIsProcessing(false);
        return toast.error('Please select a bank');
      }
      payload.paymentData = { bank: netBankingForm.bank, accountName: netBankingForm.accountName };
    } else if (activePaymentTab === 'upi') {
      if (!upiForm.upiId) {
        setIsProcessing(false);
        return toast.error('Please enter UPI ID');
      }
      payload.paymentData = { upiId: upiForm.upiId };
    } else if (activePaymentTab === 'insurance') {
      payload.paymentData = { provider: insuranceForm.provider };
      
      // Also submit to insurance claim endpoint
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        await axios.post('/api/insurance/claims', {
          insuranceProvider: insuranceForm.provider,
          policyNumber: insuranceForm.policyNumber,
          claimAmount: selectedInvoiceForPayment.amount,
          relatedAppointment: selectedInvoiceForPayment.id,
          documents: ['https://dummy-doc-url.com/doc.pdf']
        }, config);
      } catch (err) {
        console.error("Failed to submit claim", err);
        // Continue with payment processing anyway for simulation
      }
    }

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post('/api/payments/process', payload, config);
      
      setIsProcessing(false);
      setIsPaid(true);
      
      // Refresh data
      fetchData();
      
      setTimeout(() => {
        setIsPaymentModalOpen(false);
        setIsPaid(false);
        setSelectedInvoiceForPayment(null);
      }, 2500);

    } catch (error) {
      console.error(error);
      setIsProcessing(false);
      toast.error(error.response?.data?.message || 'Payment failed. Please try again.');
    }
  };

  const handleAddPayment = (e) => {
    e.preventDefault();
    setIsSavingCard(true);
    setTimeout(() => {
      setIsSavingCard(false);
      setIsAddPaymentModalOpen(false);
      toast.success('Payment method added successfully!');
    }, 1500);
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Header Section */}
      <div className="relative overflow-hidden bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-center z-10">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full blur-3xl opacity-50 z-0"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Billing & Insurance</h1>
          </div>
          <p className="text-gray-500 ml-16">Manage your payment methods, view invoices, and track your insurance coverage.</p>
        </div>
        <div className="relative z-10 hidden md:flex items-center gap-3">
          <button 
            onClick={() => setIsHistoryModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
          >
            <FileText className="w-4 h-4" /> Payment History
          </button>
          <button onClick={() => setIsAddPaymentModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-all shadow-md">
            <Plus className="w-4 h-4" /> Add Payment Method
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Insurance Card & Summary */}
        <div className="space-y-8 lg:col-span-1">
          {/* Premium Insurance Card */}
          <div className="relative p-7 rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white shadow-xl shadow-indigo-200 hover:-translate-y-1 transition-transform duration-300">
            {/* Glass effect background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-400 opacity-20 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>
            <div className="absolute top-6 right-6 opacity-20 group-hover:opacity-40 transition-opacity">
              <Shield className="w-24 h-24" />
            </div>

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h3 className="font-bold text-xl tracking-wide">BlueCross</h3>
                  <h3 className="font-light text-indigo-200 tracking-wide text-sm uppercase mt-0.5">BlueShield</h3>
                </div>
                <div className="bg-emerald-500/20 border border-emerald-400/30 text-emerald-100 text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md flex items-center gap-1.5 shadow-sm">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div> Active
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-indigo-200/70 text-[10px] uppercase tracking-widest font-bold mb-1">Member ID</p>
                  <p className="font-mono text-xl tracking-wider text-white drop-shadow-md">ABC 1234 567 89</p>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-indigo-200/70 text-[10px] uppercase tracking-widest font-bold mb-1">Group #</p>
                    <p className="font-mono tracking-wider">987654</p>
                  </div>
                  <div className="text-right">
                    <p className="text-indigo-200/70 text-[10px] uppercase tracking-widest font-bold mb-1">Office Copay</p>
                    <p className="font-bold text-2xl drop-shadow-md">$20</p>
                  </div>
                </div>
              </div>

              <button onClick={() => setIsCoverageModalOpen(true)} className="w-full mt-8 bg-white/10 hover:bg-white/20 border border-white/20 text-white py-3 rounded-xl font-medium backdrop-blur-md transition-colors flex items-center justify-center gap-2">
                View Coverage Details <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Stats Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center hover:border-indigo-100 hover:shadow-md transition-all group">
              <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-indigo-100 transition-all">
                <Activity className="w-5 h-5 text-indigo-600" />
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">YTD Spent</p>
              <p className="text-xl font-bold text-gray-900">
                ${paymentHistory.filter(p => p.status === 'successful').reduce((acc, curr) => acc + curr.amount, 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center hover:border-amber-100 hover:shadow-md transition-all group">
               <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-amber-100 transition-all">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Pending Due</p>
              <p className="text-xl font-bold text-gray-900">
                ${invoices.reduce((acc, curr) => acc + curr.amount, 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Invoices & Payments */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-full flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Pending Invoices</h2>
                <p className="text-sm text-gray-500 mt-1">Invoices requiring your attention</p>
              </div>
              <button onClick={() => {fetchData(); toast.success('Data refreshed');}} className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-full transition-colors">
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
              </button>
            </div>

            <div className="space-y-4 flex-1">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-3 text-indigo-500" />
                  <p>Loading invoices...</p>
                </div>
              ) : invoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
                  <CheckCircle className="w-10 h-10 text-emerald-400 mb-3" />
                  <p className="font-medium text-gray-600">You're all caught up!</p>
                  <p className="text-sm mt-1">No pending invoices.</p>
                </div>
              ) : (
                invoices.map((inv) => (
                  <div key={inv.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-amber-100 bg-gradient-to-r from-amber-50/30 to-transparent rounded-2xl hover:shadow-md transition-all gap-4">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-amber-100 text-amber-600 shadow-sm">
                        <Clock className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-lg text-gray-900">{inv.title}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-2 mt-0.5">
                          <FileText className="w-3.5 h-3.5" /> {inv.invoiceId} • {inv.date}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                      <div className="text-left sm:text-right">
                        <p className="font-bold text-gray-900 text-lg">${inv.amount.toFixed(2)}</p>
                        <p className="text-xs font-bold uppercase tracking-wider mt-0.5 text-amber-600">
                          {inv.status}
                        </p>
                      </div>
                      <button 
                        onClick={() => { setSelectedInvoiceForPayment(inv); setIsPaymentModalOpen(true); }}
                        className="flex items-center justify-center bg-gray-900 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-800 shadow-md transition-all hover:-translate-y-0.5"
                      >
                        Pay Now
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-8 pt-8 border-t border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-gray-900">Recent Transactions</h3>
                <button onClick={() => setIsHistoryModalOpen(true)} className="text-indigo-600 text-sm font-semibold hover:text-indigo-700">
                  View All &rarr;
                </button>
              </div>
              <div className="space-y-3">
                {paymentHistory.slice(0, 3).map((item) => (
                  <div key={item._id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.status === 'successful' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                        {item.status === 'successful' ? <CheckCircle className="w-5 h-5" /> : <X className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{item.description || 'Payment'}</p>
                        <p className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleDateString()} • {item.method.toUpperCase()}</p>
                      </div>
                    </div>
                    <p className="font-bold text-gray-900">${item.amount.toFixed(2)}</p>
                  </div>
                ))}
                {paymentHistory.length === 0 && !loading && (
                   <p className="text-sm text-gray-500 text-center py-4">No recent transactions found.</p>
                )}
              </div>
            </div>

          </div>
        </div>
        
      </div>

      {/* Modern Multi-tab Payment Modal */}
      {isPaymentModalOpen && selectedInvoiceForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col md:flex-row">
            
            {/* Left Side: Invoice Summary */}
            <div className="bg-gradient-to-br from-indigo-900 to-indigo-700 w-full md:w-1/3 p-8 text-white flex flex-col justify-between">
              <div>
                <h3 className="text-indigo-200 text-sm font-bold uppercase tracking-wider mb-2">Payment Summary</h3>
                <p className="text-3xl font-extrabold text-white mb-6">${selectedInvoiceForPayment.amount.toFixed(2)}</p>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-indigo-300 text-xs uppercase font-bold tracking-wider mb-1">Invoice ID</p>
                    <p className="font-medium text-sm">{selectedInvoiceForPayment.invoiceId}</p>
                  </div>
                  <div>
                    <p className="text-indigo-300 text-xs uppercase font-bold tracking-wider mb-1">Description</p>
                    <p className="font-medium text-sm leading-relaxed">{selectedInvoiceForPayment.title}</p>
                  </div>
                  <div>
                    <p className="text-indigo-300 text-xs uppercase font-bold tracking-wider mb-1">Date</p>
                    <p className="font-medium text-sm">{selectedInvoiceForPayment.date}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-indigo-500/30">
                <div className="flex items-center gap-2 text-indigo-200 text-xs">
                  <Shield className="w-4 h-4" /> Secure 256-bit SSL Encryption
                </div>
              </div>
            </div>

            {/* Right Side: Payment Methods */}
            <div className="w-full md:w-2/3 p-8 bg-gray-50 relative flex flex-col">
              <button 
                onClick={() => !isProcessing && !isPaid && setIsPaymentModalOpen(false)}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {!isPaid ? (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Payment Method</h2>
                  
                  {/* Tabs */}
                  <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-6 border-b border-gray-200">
                    {[
                      { id: 'card', icon: CreditCard, label: 'Credit Card' },
                      { id: 'debit', icon: CreditCard, label: 'Debit Card' },
                      { id: 'netbanking', icon: Landmark, label: 'Net Banking' },
                      { id: 'upi', icon: Smartphone, label: 'UPI' },
                      { id: 'insurance', icon: Shield, label: 'Insurance' }
                    ].map(tab => (
                      <button 
                        key={tab.id}
                        onClick={() => setActivePaymentTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activePaymentTab === tab.id ? 'bg-white text-indigo-700 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100 border border-transparent'}`}
                      >
                        <tab.icon className="w-4 h-4" /> {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Form Container */}
                  <div className="flex-1 overflow-y-auto">
                    <form id="payment-form" onSubmit={handlePaymentSubmit}>
                      
                      {/* Card Form */}
                      {(activePaymentTab === 'card' || activePaymentTab === 'debit') && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Card Holder Name *</label>
                            <input type="text" required value={cardForm.name} onChange={e => setCardForm({...cardForm, name: e.target.value})} className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium" placeholder="John Doe" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Card Number *</label>
                            <div className="relative">
                              <CreditCard className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                              <input type="text" required pattern="[0-9]{16}" maxLength="16" value={cardForm.number} onChange={e => setCardForm({...cardForm, number: e.target.value.replace(/\D/g, '')})} className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono" placeholder="0000 0000 0000 0000" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Expiry (MM/YY) *</label>
                              <input type="text" required maxLength="5" value={cardForm.expiry} onChange={e => setCardForm({...cardForm, expiry: e.target.value})} className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono text-center" placeholder="MM/YY" />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">CVV *</label>
                              <input type="password" required maxLength="4" value={cardForm.cvv} onChange={e => setCardForm({...cardForm, cvv: e.target.value.replace(/\D/g, '')})} className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono text-center" placeholder="123" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Billing Address</label>
                            <input type="text" value={cardForm.address} onChange={e => setCardForm({...cardForm, address: e.target.value})} className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium" placeholder="123 Main St, City, Zip" />
                          </div>
                          <div className="flex items-center gap-2 pt-2">
                            <input type="checkbox" id="saveCard" checked={cardForm.saveCard} onChange={e => setCardForm({...cardForm, saveCard: e.target.checked})} className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" />
                            <label htmlFor="saveCard" className="text-sm font-medium text-gray-700">Save card for future payments</label>
                          </div>
                        </div>
                      )}

                      {/* Net Banking Form */}
                      {activePaymentTab === 'netbanking' && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Bank *</label>
                            <select required value={netBankingForm.bank} onChange={e => setNetBankingForm({...netBankingForm, bank: e.target.value})} className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium">
                              <option value="">-- Choose your Bank --</option>
                              <option value="HDFC">HDFC Bank</option>
                              <option value="SBI">State Bank of India</option>
                              <option value="ICICI">ICICI Bank</option>
                              <option value="AXIS">Axis Bank</option>
                              <option value="KOTAK">Kotak Mahindra</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Account Holder Name *</label>
                            <input type="text" required value={netBankingForm.accountName} onChange={e => setNetBankingForm({...netBankingForm, accountName: e.target.value})} className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium" placeholder="John Doe" />
                          </div>
                          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex gap-3 mt-4">
                            <Building className="w-6 h-6 text-indigo-500 shrink-0" />
                            <p className="text-sm text-indigo-800">You will be securely redirected to your bank's portal to complete the transaction.</p>
                          </div>
                        </div>
                      )}

                      {/* UPI Form */}
                      {activePaymentTab === 'upi' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Virtual Payment Address (UPI ID) *</label>
                            <input type="text" required value={upiForm.upiId} onChange={e => setUpiForm({...upiForm, upiId: e.target.value})} className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium" placeholder="username@okbank" />
                          </div>
                          
                          <div className="relative flex py-2 items-center">
                            <div className="flex-grow border-t border-gray-300"></div>
                            <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-bold uppercase">OR SCAN QR CODE</span>
                            <div className="flex-grow border-t border-gray-300"></div>
                          </div>

                          <div className="flex justify-center">
                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center">
                              {/* Mock QR Code Pattern */}
                              <div className="w-32 h-32 bg-gray-100 flex items-center justify-center p-2 rounded-lg border border-gray-200">
                                <div className="grid grid-cols-4 grid-rows-4 gap-1 w-full h-full opacity-60">
                                  {[...Array(16)].map((_, i) => <div key={i} className={`bg-gray-800 ${i%2===0 ? 'rounded-tl-md' : i%3===0 ? 'rounded-br-md' : ''}`}></div>)}
                                </div>
                              </div>
                              <p className="text-xs text-gray-500 mt-3 font-medium">Scan with any UPI App</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Insurance Claim Form */}
                      {activePaymentTab === 'insurance' && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
                            <p className="text-sm text-emerald-800 font-medium">By submitting a claim, we will process this invoice through your insurance provider. You will be responsible for any unpaid copays.</p>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Insurance Provider</label>
                            <select value={insuranceForm.provider} onChange={e => setInsuranceForm({...insuranceForm, provider: e.target.value})} className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium">
                              <option value="BlueCross">BlueCross BlueShield</option>
                              <option value="Aetna">Aetna</option>
                              <option value="Cigna">Cigna</option>
                              <option value="UnitedHealthcare">UnitedHealthcare</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Policy / Member ID</label>
                            <input type="text" value={insuranceForm.policyNumber} onChange={e => setInsuranceForm({...insuranceForm, policyNumber: e.target.value})} className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Supporting Documents</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-white hover:bg-gray-50 cursor-pointer transition-colors">
                              <UploadCloud className="w-8 h-8 text-indigo-400 mb-2" />
                              <p className="text-sm font-bold text-gray-700">Click to upload insurance card & documents</p>
                              <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG up to 10MB</p>
                            </div>
                          </div>
                        </div>
                      )}

                    </form>
                  </div>

                  <div className="mt-8">
                    <button 
                      type="submit"
                      form="payment-form"
                      disabled={isProcessing}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                      {isProcessing ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Processing Payment...</>
                      ) : activePaymentTab === 'insurance' ? (
                        'Submit Insurance Claim'
                      ) : (
                        `Pay $${selectedInvoiceForPayment.amount.toFixed(2)} Securely`
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-6 animate-in zoom-in duration-500">
                  <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-inner border-4 border-white">
                    <CheckCircle className="w-12 h-12" />
                  </div>
                  <h3 className="text-3xl font-extrabold text-gray-900 mb-2">Payment Successful!</h3>
                  <p className="text-gray-500 max-w-sm mx-auto">Your payment has been processed securely. A receipt has been sent to your email.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[85vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900">Full Payment History</h2>
              <button onClick={() => setIsHistoryModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="space-y-3">
                {paymentHistory.map((item) => (
                  <div key={item._id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-gray-100 rounded-xl hover:bg-gray-50 gap-4">
                    <div>
                      <p className="font-bold text-gray-900">{item.description || 'Payment'}</p>
                      <p className="text-sm text-gray-500 font-mono mt-0.5">TXN: {item.transactionId}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(item.createdAt).toLocaleString()} • Via {item.method.toUpperCase()}</p>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-left sm:text-right">
                        <p className="font-bold text-gray-900 text-lg">${item.amount.toFixed(2)}</p>
                        <p className={`text-xs font-bold uppercase tracking-wider mt-0.5 ${item.status === 'successful' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {item.status}
                        </p>
                      </div>
                      <button onClick={() => {
                        setSelectedInvoice({ title: item.description, date: new Date(item.createdAt).toLocaleDateString(), amount: `$${item.amount.toFixed(2)}`, id: item.transactionId, status: item.status });
                        setIsInvoiceViewerOpen(true);
                      }} className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg font-semibold text-sm">
                        Receipt
                      </button>
                    </div>
                  </div>
                ))}
                {paymentHistory.length === 0 && (
                  <div className="text-center py-10 text-gray-500">
                    <FileText className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                    <p className="font-medium text-lg text-gray-600">No payment history found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Viewer Modal */}
      {isInvoiceViewerOpen && selectedInvoice && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-indigo-600" />
                <h2 className="text-xl font-bold text-gray-900">Document Viewer</h2>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 font-semibold transition-colors"
                >
                  <Download className="w-4 h-4" /> Download PDF
                </button>
                <button 
                  onClick={() => setIsInvoiceViewerOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-8 overflow-y-auto bg-gray-100 flex-1">
              <div ref={invoiceRef} className="bg-white mx-auto max-w-xl shadow-md border border-gray-200 p-10 min-h-[500px]">
                <div className="flex justify-between items-start border-b border-gray-200 pb-8 mb-8">
                  <div>
                    <h1 className="text-3xl font-extrabold text-indigo-900 tracking-tight">HealthAI</h1>
                    <p className="text-gray-500 text-sm mt-1">Healthcare System</p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-xl font-bold text-gray-900 uppercase tracking-widest mb-1">RECEIPT / INVOICE</h2>
                    <p className="text-sm font-mono text-gray-500">{selectedInvoice.id}</p>
                  </div>
                </div>

                <div className="flex justify-between mb-12">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-2">Billed To</p>
                    <p className="font-bold text-gray-900">{user?.name || 'Patient'}</p>
                    <p className="text-gray-500 text-sm">Email: {user?.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-2">Date</p>
                    <p className="font-bold text-gray-900">{selectedInvoice.date}</p>
                    <p className={`font-bold text-sm mt-1 ${selectedInvoice.status === 'successful' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {selectedInvoice.status.toUpperCase()}
                    </p>
                  </div>
                </div>

                <table className="w-full mb-8">
                  <thead>
                    <tr className="border-b-2 border-gray-900">
                      <th className="text-left py-3 text-xs uppercase tracking-widest text-gray-500 font-bold">Description</th>
                      <th className="text-right py-3 text-xs uppercase tracking-widest text-gray-500 font-bold">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="py-4 text-gray-900 font-medium">{selectedInvoice.title}</td>
                      <td className="py-4 text-right font-mono text-gray-900">{selectedInvoice.amount}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="flex justify-end pt-4">
                  <div className="text-right w-1/2">
                    <div className="flex justify-between py-2 border-t-2 border-gray-900 mt-2 pt-2">
                      <span className="font-bold text-gray-900">Total Paid</span>
                      <span className="font-bold font-mono text-xl text-gray-900">{selectedInvoice.amount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Coverage Details Modal (Kept from previous impl) */}
      {isCoverageModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-indigo-600" />
                <h2 className="text-xl font-bold text-gray-900">Coverage Details</h2>
              </div>
              <button onClick={() => setIsCoverageModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1 bg-white">
              <div className="space-y-8">
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 flex flex-col md:flex-row justify-between gap-6">
                  <div>
                    <h3 className="text-sm uppercase tracking-wider font-bold text-indigo-500 mb-1">Current Plan</h3>
                    <p className="text-xl font-extrabold text-indigo-900">BlueShield Premium EPO</p>
                    <p className="text-sm text-indigo-700 mt-1">Status: Active through Dec 31, 2026</p>
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="bg-white text-indigo-700 font-bold px-4 py-2 rounded-xl text-center shadow-sm border border-indigo-100">
                      Member ID: ABC 1234 567 89
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Deductibles & Out of Pocket</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                      <div className="flex justify-between items-end mb-2">
                        <p className="text-sm font-semibold text-gray-600">In-Network Deductible</p>
                        <p className="text-sm font-bold text-gray-900">$450 / $1,500</p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                        <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: '30%' }}></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">$1,050 remaining</p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                      <div className="flex justify-between items-end mb-2">
                        <p className="text-sm font-semibold text-gray-600">Out-of-Pocket Max</p>
                        <p className="text-sm font-bold text-gray-900">$1,200 / $5,000</p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                        <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: '24%' }}></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">$3,800 remaining</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Copays & Coinsurance</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { service: 'Primary Care Visit', cost: '$20 Copay' },
                      { service: 'Specialist Visit', cost: '$45 Copay' },
                      { service: 'Urgent Care', cost: '$50 Copay' },
                      { service: 'Emergency Room', cost: '$250 Copay' },
                      { service: 'Generic Rx', cost: '$10 Copay' },
                      { service: 'Lab Services', cost: '20% Coinsurance' }
                    ].map((item, idx) => (
                      <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 flex justify-between items-center shadow-sm">
                        <span className="text-sm font-medium text-gray-700">{item.service}</span>
                        <span className="text-sm font-bold text-gray-900">{item.cost}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button onClick={() => setIsCoverageModalOpen(false)} className="px-6 py-2.5 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors shadow-sm">
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Method Modal (Kept simple for now) */}
      {isAddPaymentModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">Add Payment Method</h2>
              <button onClick={() => !isSavingCard && setIsAddPaymentModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddPayment} className="p-8">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name on Card</label>
                  <input type="text" required placeholder="e.g., James Miller" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                  <div className="relative">
                    <CreditCard className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                    <input type="text" required pattern="[0-9]{16}" maxLength="16" placeholder="0000 0000 0000 0000" className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry (MM/YY)</label>
                    <input type="text" required placeholder="MM/YY" maxLength="5" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono text-center" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                    <input type="password" required maxLength="4" placeholder="123" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono text-center" />
                  </div>
                </div>
              </div>
              <button type="submit" disabled={isSavingCard} className="w-full mt-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-70 flex items-center justify-center gap-2">
                {isSavingCard ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</> : 'Save Payment Method'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Billing;
