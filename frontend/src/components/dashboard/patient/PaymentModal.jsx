import React, { useState } from 'react';
import { CreditCard, XCircle, ShieldCheck, CheckCircle } from 'lucide-react';
import API from '../../../api/api';
import toast from 'react-hot-toast';

const PaymentModal = ({ appointment, onClose, onSuccess, userToken }) => {
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState('card');
  const [success, setSuccess] = useState(false);

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        amount: appointment.consultationFee || 100,
        currency: 'USD',
        method,
        relatedAppointment: appointment._id,
        description: `Consultation with Dr. ${appointment.doctor?.name}`,
        paymentData: method === 'card' 
          ? { cardNumber: '4111111111111111', cvv: '123', expiry: '12/25', name: 'Test User' }
          : { upiId: 'test@upi' }
      };

      const config = { headers: { Authorization: `Bearer ${userToken}` } };
      await API.post('/api/payments/process', payload, config);
      
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl w-full max-w-md p-8 text-center shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-500 mb-6">Your meeting has been scheduled and the link has been generated.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <CreditCard className="w-6 h-6 mr-2 text-indigo-600" /> Complete Payment
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-white border border-transparent hover:border-gray-200 transition-all">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 bg-indigo-50/30 border-b border-indigo-100">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Consultation Fee</p>
            <p className="text-2xl font-black text-indigo-900">${appointment.consultationFee || 100}</p>
          </div>
          <p className="text-sm text-gray-600">Dr. {appointment.doctor?.name} • {appointment.doctorProfile?.specialization || 'General'}</p>
          <p className="text-xs text-gray-400 mt-1">{new Date(appointment.appointmentDate).toDateString()} at {appointment.appointmentTime}</p>
        </div>

        <form onSubmit={handlePayment} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">Payment Method</label>
            <div className="grid grid-cols-2 gap-4">
              <label className={`cursor-pointer p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${method === 'card' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-200'}`}>
                <input type="radio" name="method" value="card" checked={method === 'card'} onChange={() => setMethod('card')} className="sr-only" />
                <CreditCard className={`w-6 h-6 ${method === 'card' ? 'text-indigo-600' : 'text-gray-400'}`} />
                <span className={`font-bold ${method === 'card' ? 'text-indigo-900' : 'text-gray-600'}`}>Credit Card</span>
              </label>
              <label className={`cursor-pointer p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${method === 'upi' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-200'}`}>
                <input type="radio" name="method" value="upi" checked={method === 'upi'} onChange={() => setMethod('upi')} className="sr-only" />
                <div className={`w-6 h-6 flex items-center justify-center font-black rounded ${method === 'upi' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>U</div>
                <span className={`font-bold ${method === 'upi' ? 'text-indigo-900' : 'text-gray-600'}`}>UPI</span>
              </label>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs text-gray-500 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <p>This is a secure, encrypted payment gateway. For this demo, a test payment will be processed automatically without real charges.</p>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Pay Now'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
