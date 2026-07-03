import React from 'react';
import { AlertTriangle, FileText, Activity, ArrowRight } from 'lucide-react';
import { Skeleton } from '../../ui/Skeleton';
import { useNavigate } from 'react-router-dom';

const ActionItems = ({ loading }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Action Items</h2>
        <div className="space-y-3">
          {[1, 2].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Action Items</h2>
      
      <div className="space-y-3">
        {/* Critical Lab Results → Review Reports */}
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-red-900 dark:text-red-300">Critical Lab Results</h4>
            <p className="text-xs text-red-700 dark:text-red-400/80 mt-1">Patients have uploaded reports requiring your review.</p>
            <button
              onClick={() => navigate('/dashboard/review-reports')}
              className="mt-2 text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-800 flex items-center gap-1 transition-colors group"
            >
              Review Now <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Prescription Renewals → Prescriptions */}
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300">Prescription Renewals</h4>
            <p className="text-xs text-blue-700 dark:text-blue-400/80 mt-1">Patients need prescription renewals and medication refills.</p>
            <button
              onClick={() => navigate('/dashboard/prescriptions')}
              className="mt-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 flex items-center gap-1 transition-colors group"
            >
              Manage Requests <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* System Maintenance - informational only */}
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-400 shadow-sm shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-200">System Maintenance</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Scheduled for tonight at 2:00 AM.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionItems;
