import React, { useState, useEffect } from 'react';
import { Eye, CheckCircle, AlertCircle, ArrowRight, FileText, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import API from '../../../api/api';

const ReportReviewCard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingReports();
  }, []);

  const fetchPendingReports = async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await API.get('/api/medical/reports', config);
      // Show only the first 2 pending reports in the dashboard widget
      const pending = (data.data || []).filter(r => r.status?.toLowerCase() !== 'reviewed').slice(0, 2);
      setReports(pending);
    } catch (err) {
      console.error('Failed to load report widget:', err);
      // Fallback to empty — don't crash the dashboard
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Report Review</h2>
        </div>
        <div className="flex items-center justify-center py-8 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Report Review</h2>
        {reports.length > 0 && (
          <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-semibold px-2 py-1 rounded-full">
            {reports.length} Pending
          </span>
        )}
      </div>

      <div className="space-y-3">
        {reports.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <p className="text-sm font-medium text-gray-700">All caught up!</p>
            <p className="text-xs text-gray-400 mt-1">No reports pending review.</p>
          </div>
        ) : (
          reports.map((report) => (
            <div
              key={report._id}
              className="p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/30 hover:border-indigo-200 hover:bg-indigo-50/20 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {report.patient?.name || 'Patient'}
                  </h4>
                  {report.priority === 'Critical' && (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(report.reportDate || report.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{report.reportType || report.title}</p>

              <div className="flex gap-2">
                <button
                  onClick={() => navigate('/dashboard/review-reports')}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-lg bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" /> View
                </button>
                <button
                  onClick={() => navigate('/dashboard/review-reports')}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Review
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Link to full review page */}
      <button
        onClick={() => navigate('/dashboard/review-reports')}
        className="w-full mt-4 flex items-center justify-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 py-2 border border-dashed border-indigo-200 rounded-xl hover:bg-indigo-50 transition-all group"
      >
        View All Reports <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </button>
    </div>
  );
};

export default ReportReviewCard;
