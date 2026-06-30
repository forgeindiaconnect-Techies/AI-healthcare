import React, { useState } from 'react';
import { Star, XCircle, MessageSquareQuote } from 'lucide-react';
import API from '../../../api/api';
import toast from 'react-hot-toast';

const ReviewModal = ({ appointment, onClose, onSuccess, userToken }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return toast.error('Please provide a rating');

    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${userToken}` } };
      const docId = appointment.doctor._id || appointment.doctor;
      await API.post(`/api/doctors/${docId}/rate`, { rating, comment }, config);
      toast.success('Review submitted successfully!');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <MessageSquareQuote className="w-6 h-6 mr-2 text-indigo-600" /> Rate Your Experience
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-white border border-transparent hover:border-gray-200 transition-all">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 bg-indigo-50/30 border-b border-indigo-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xl">
            {appointment.doctor?.name?.charAt(4) || 'D'}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Doctor</p>
            <p className="text-lg font-black text-indigo-900">Dr. {appointment.doctor?.name}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="text-center">
            <label className="block text-sm font-bold text-gray-700 mb-3">Overall Rating</label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-all hover:scale-110"
                >
                  <Star 
                    className={`w-10 h-10 transition-colors ${(hoverRating || rating) >= star ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} 
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Write a review (optional)</label>
            <textarea
              rows="4"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was your consultation experience?"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm font-medium bg-gray-50 resize-none"
            ></textarea>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Submit Review'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
