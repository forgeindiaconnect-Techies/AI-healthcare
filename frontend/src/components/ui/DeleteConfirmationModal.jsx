import React, { useState } from 'react';
import { AlertCircle, Trash2 } from 'lucide-react';

const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  recordName,
  description,
  warningMessage = "This action will soft-delete the record. It can be restored later from the Archives.",
  requireReason = true
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (requireReason && !reason.trim()) return;
    setIsSubmitting(true);
    try {
      await onConfirm({ reason });
      setReason('');
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4 text-red-600 dark:text-red-500">
            <div className="p-2 bg-red-100 dark:bg-red-500/10 rounded-full">
              <Trash2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-semibold">Remove Record</h2>
          </div>
          
          <div className="mb-4">
            <p className="text-gray-900 dark:text-white font-medium mb-1">
              Are you sure you want to remove {recordName ? <span className="font-bold">"{recordName}"</span> : "this record"}?
            </p>
            {description && (
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{description}</p>
            )}
            {warningMessage && (
              <div className="flex items-start gap-2 text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 p-3 rounded-lg text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{warningMessage}</p>
              </div>
            )}
          </div>

          {requireReason && (
            <div className="mt-4">
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reason for removal <span className="text-red-500">*</span>
              </label>
              <textarea
                id="reason"
                rows="3"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm"
                placeholder="Please explain why you are removing this record..."
                required
              />
            </div>
          )}
        </div>
        
        <div className="bg-gray-50 dark:bg-slate-800/50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting || (requireReason && !reason.trim())}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              'Remove'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
