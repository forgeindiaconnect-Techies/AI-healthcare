import React, { useState, useRef } from 'react';
import { CreditCard, Shield, Download, FileText, CheckCircle, Clock, Plus, Activity, ChevronRight, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import domtoimage from 'dom-to-image-more';
import { jsPDF } from 'jspdf';

const Billing = () => {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  
  // New modal states
  const [isInvoiceViewerOpen, setIsInvoiceViewerOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [isCoverageModalOpen, setIsCoverageModalOpen] = useState(false);
  const [isSavingCard, setIsSavingCard] = useState(false);
  const invoiceRef = useRef(null);

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
      pdf.save(`${selectedInvoice?.id || 'invoice'}.pdf`);
      toast.success('PDF downloaded successfully!', { id: toastId });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF', { id: toastId });
    }
  };

  const handlePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsPaid(true);
      setTimeout(() => setIsPaymentModalOpen(false), 2000);
    }, 2000);
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
            onClick={() => openInvoice({ title: 'Account Statement', date: 'June 2026', amount: '$45.00', id: 'STM-2026-06', status: 'Generated' })}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
          >
            <Download className="w-4 h-4" /> Statement
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
              <p className="text-xl font-bold text-gray-900">$450.00</p>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center hover:border-amber-100 hover:shadow-md transition-all group">
               <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-amber-100 transition-all">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Pending</p>
              <p className="text-xl font-bold text-gray-900">$45.00</p>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Invoices & Payments */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-full flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Recent Invoices</h2>
                <p className="text-sm text-gray-500 mt-1">Your recent billing history</p>
              </div>
              <button onClick={() => setIsHistoryModalOpen(true)} className="text-indigo-600 text-sm font-semibold hover:text-indigo-700 bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors">
                View All History
              </button>
            </div>

            <div className="space-y-4 flex-1">
              
              {/* Invoice Item 1 - Pending or Paid dynamically */}
              <div className={`group flex items-center justify-between p-5 border rounded-2xl transition-all cursor-pointer ${!isPaid ? 'border-amber-100 bg-gradient-to-r from-amber-50/30 to-transparent hover:shadow-md hover:border-amber-200' : 'border-gray-100 hover:bg-gray-50 hover:shadow-sm hover:border-gray-200'}`}>
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm ${!isPaid ? 'bg-amber-100 text-amber-600' : 'bg-emerald-50 text-emerald-500 border border-emerald-100'}`}>
                    {!isPaid ? <Clock className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
                  </div>
                  <div>
                    <p className={`font-bold text-lg transition-colors ${!isPaid ? 'text-gray-900 group-hover:text-amber-700' : 'text-gray-900 group-hover:text-gray-700'}`}>Blood Test - Lab Services</p>
                    <p className="text-sm text-gray-500 flex items-center gap-2 mt-0.5">
                      <FileText className="w-3.5 h-3.5" /> INV-2026-0610 • June 10, 2026
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="font-bold text-gray-900 text-lg">$45.00</p>
                    <p className={`text-xs font-bold uppercase tracking-wider mt-0.5 ${!isPaid ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {!isPaid ? 'Pending Payment' : 'Paid in Full'}
                    </p>
                  </div>
                  {!isPaid ? (
                    <button 
                      onClick={() => setIsPaymentModalOpen(true)}
                      className="hidden sm:flex items-center justify-center bg-gray-900 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-800 shadow-md transition-all hover:-translate-y-0.5"
                    >
                      Pay Now
                    </button>
                  ) : (
                    <button 
                      onClick={(e) => { e.stopPropagation(); openInvoice({ title: 'Blood Test - Lab Services', date: 'June 10, 2026', amount: '$45.00', id: 'INV-2026-0610', status: 'Paid in Full' }); }}
                      className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 transition-all group-hover:shadow-sm"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Invoice Item 2 - Paid */}
              <div className="group flex items-center justify-between p-5 border border-gray-100 rounded-2xl hover:bg-gray-50 hover:shadow-sm hover:border-gray-200 transition-all cursor-pointer">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-emerald-100">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg group-hover:text-gray-700 transition-colors">Dr. Sarah Jenkins - Consultation</p>
                    <p className="text-sm text-gray-500 flex items-center gap-2 mt-0.5">
                      <FileText className="w-3.5 h-3.5" /> INV-2026-0615 • June 15, 2026
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="font-bold text-gray-900 text-lg">$150.00</p>
                    <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mt-0.5">Paid by Insurance</p>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); openInvoice({ title: 'Dr. Sarah Jenkins - Consultation', date: 'June 15, 2026', amount: '$150.00', id: 'INV-2026-0615', status: 'Paid by Insurance' }); }}
                    className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 transition-all group-hover:shadow-sm"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Invoice Item 3 - Paid */}
              <div className="group flex items-center justify-between p-5 border border-gray-100 rounded-2xl hover:bg-gray-50 hover:shadow-sm hover:border-gray-200 transition-all cursor-pointer">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-emerald-100">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg group-hover:text-gray-700 transition-colors">Annual Physical Exam</p>
                    <p className="text-sm text-gray-500 flex items-center gap-2 mt-0.5">
                      <FileText className="w-3.5 h-3.5" /> INV-2026-0120 • Jan 20, 2026
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="font-bold text-gray-900 text-lg">$250.00</p>
                    <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mt-0.5">Paid (Copay $20)</p>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); openInvoice({ title: 'Annual Physical Exam', date: 'Jan 20, 2026', amount: '$250.00', id: 'INV-2026-0120', status: 'Paid (Copay $20)' }); }}
                    className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 transition-all group-hover:shadow-sm"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
        
      </div>

      {/* Payment Modal Overlay */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">Secure Payment</h2>
              <button 
                onClick={() => !isProcessing && !isPaid && setIsPaymentModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8">
              {!isPaid ? (
                <>
                  <div className="text-center mb-8">
                    <p className="text-sm text-gray-500 font-medium mb-1">Total Amount Due</p>
                    <p className="text-4xl font-extrabold text-gray-900">$45.00</p>
                    <p className="text-sm text-gray-500 mt-2">Blood Test - Lab Services</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 border-2 border-indigo-600 bg-indigo-50/50 rounded-2xl cursor-pointer">
                      <div className="w-10 h-10 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">Visa ending in 4242</p>
                        <p className="text-xs text-gray-500">Expires 12/28</p>
                      </div>
                      <div className="w-5 h-5 rounded-full border-4 border-indigo-600 bg-white"></div>
                    </div>
                  </div>

                  <button 
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="w-full mt-8 bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                    ) : (
                      'Confirm Payment of $45.00'
                    )}
                  </button>
                </>
              ) : (
                <div className="text-center py-6 animate-in zoom-in duration-500">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
                  <p className="text-gray-500">Your invoice has been marked as paid.</p>
                </div>
              )}
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
              {/* The "Paper" Invoice Document */}
              <div ref={invoiceRef} className="bg-white mx-auto max-w-xl shadow-md border border-gray-200 p-10 min-h-[500px]">
                <div className="flex justify-between items-start border-b border-gray-200 pb-8 mb-8">
                  <div>
                    <h1 className="text-3xl font-extrabold text-indigo-900 tracking-tight">HealthAI</h1>
                    <p className="text-gray-500 text-sm mt-1">Healthcare System</p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-xl font-bold text-gray-900 uppercase tracking-widest mb-1">INVOICE</h2>
                    <p className="text-sm font-mono text-gray-500">{selectedInvoice.id}</p>
                  </div>
                </div>

                <div className="flex justify-between mb-12">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-2">Billed To</p>
                    <p className="font-bold text-gray-900">James Miller</p>
                    <p className="text-gray-500 text-sm">Patient ID: P-882910</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-2">Date</p>
                    <p className="font-bold text-gray-900">{selectedInvoice.date}</p>
                    <p className="text-emerald-600 font-bold text-sm mt-1">{selectedInvoice.status}</p>
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
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="font-mono text-gray-900">{selectedInvoice.amount}</span>
                    </div>
                    <div className="flex justify-between py-2 border-t-2 border-gray-900 mt-2 pt-2">
                      <span className="font-bold text-gray-900">Total Due</span>
                      <span className="font-bold font-mono text-xl text-gray-900">{selectedInvoice.status.includes('Pending') ? selectedInvoice.amount : '$0.00'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[85vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900">Full Billing History</h2>
              <button onClick={() => setIsHistoryModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="space-y-3">
                {/* Simulated old history items */}
                {[
                  { title: 'MRI Scan - Lumbar', date: 'Dec 12, 2025', amount: '$850.00', status: 'Paid by Insurance', id: 'INV-2025-1212' },
                  { title: 'Specialist Copay', date: 'Nov 05, 2025', amount: '$45.00', status: 'Paid', id: 'INV-2025-1105' },
                  { title: 'Prescription Refill', date: 'Oct 22, 2025', amount: '$15.00', status: 'Paid', id: 'INV-2025-1022' },
                  { title: 'Annual Physical Exam', date: 'Jan 15, 2025', amount: '$250.00', status: 'Paid by Insurance', id: 'INV-2025-0115' }
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-4 border border-gray-100 rounded-xl hover:bg-gray-50">
                    <div>
                      <p className="font-bold text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-500">{item.date} • {item.id}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{item.amount}</p>
                        <p className="text-xs text-emerald-600 font-semibold">{item.status}</p>
                      </div>
                      <button onClick={() => openInvoice(item)} className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg font-semibold text-sm">
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Method Modal */}
      {isAddPaymentModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">Add Payment Method</h2>
              <button 
                onClick={() => !isSavingCard && setIsAddPaymentModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddPayment} className="p-8">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name on Card</label>
                  <input type="text" required placeholder="e.g., James Miller" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                  <div className="relative">
                    <CreditCard className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                    <input type="text" required pattern="[0-9]{16}" maxLength="16" placeholder="0000 0000 0000 0000" className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                    <input type="text" required placeholder="MM/YY" maxLength="5" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono text-center" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                    <input type="password" required maxLength="4" placeholder="123" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono text-center" />
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSavingCard}
                className="w-full mt-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isSavingCard ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Saving Card...</>
                ) : (
                  'Save Payment Method'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Coverage Details Modal */}
      {isCoverageModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-indigo-600" />
                <h2 className="text-xl font-bold text-gray-900">Coverage Details</h2>
              </div>
              <button 
                onClick={() => setIsCoverageModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1 bg-white">
              <div className="space-y-8">
                
                {/* Plan Overview */}
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

                {/* Deductibles & Out of Pocket */}
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

                {/* Copays & Coinsurance */}
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

                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3 text-sm text-amber-800">
                  <Info className="w-5 h-5 text-amber-600 shrink-0" />
                  <p>This is a summary of benefits. For full details on coverage limitations and exclusions, please refer to your official policy document.</p>
                </div>

              </div>
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button 
                onClick={() => setIsCoverageModalOpen(false)}
                className="px-6 py-2.5 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Billing;
