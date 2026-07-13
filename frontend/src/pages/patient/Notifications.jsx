import React, { useState, useEffect } from 'react';
import API from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Bell, CheckCircle2, Calendar, FileText, AlertCircle, 
  CheckCheck, Info, X, HeartPulse, Activity, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import DeleteConfirmationModal from '../../components/ui/DeleteConfirmationModal';

const PatientNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [notificationToRemove, setNotificationToRemove] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await API.get('/api/notifications', config);
      setNotifications(data.data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await API.put(`/api/notifications/${id}/read`, {}, config);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await API.put('/api/notifications/read-all', {}, config);
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const handleRemoveNotification = async ({ reason }) => {
    if (!notificationToRemove) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await API.patch(`/api/notifications/${notificationToRemove._id}/remove`, { reason }, config);
      toast.success('Notification removed successfully');
      setNotifications(notifications.filter(n => n._id !== notificationToRemove._id));
      setIsDeleteModalOpen(false);
      setNotificationToRemove(null);
    } catch (error) {
      console.error(error);
      toast.error('Failed to remove notification');
      setIsDeleteModalOpen(false);
      setNotificationToRemove(null);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'appointment': return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'report': return <FileText className="w-5 h-5 text-emerald-500" />;
      case 'system': return <Info className="w-5 h-5 text-gray-500" />;
      case 'alert': return <AlertCircle className="w-5 h-5 text-rose-500" />;
      case 'health': return <HeartPulse className="w-5 h-5 text-pink-500" />;
      default: return <Bell className="w-5 h-5 text-cyan-500" />;
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 font-medium flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-cyan-200 border-t-cyan-600 rounded-full animate-spin"></div>
          Loading your notifications...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 max-w-4xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Bell className="w-48 h-48" />
        </div>
        
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest mb-4 backdrop-blur-md">
            <Activity className="w-3 h-3 text-cyan-400" /> Alerts & Updates
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-3 text-white">Notifications Center</h1>
          <p className="text-slate-300 text-lg leading-relaxed">
            Stay updated with your latest appointment reminders, lab results, and health alerts.
          </p>
        </div>

        <div className="relative z-10 flex flex-col items-end gap-4">
          <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10 text-center min-w-[120px]">
            <p className="text-4xl font-black text-cyan-400">{unreadCount}</p>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-300 mt-1">Unread</p>
          </div>
          
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 transition-colors rounded-xl text-sm font-bold flex items-center gap-2 border border-white/10"
            >
              <CheckCheck className="w-4 h-4" /> Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
              <Bell className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">All caught up!</h3>
            <p className="text-gray-500 mt-2">
              You don't have any notifications at the moment.
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div 
              key={notification._id} 
              onClick={() => !notification.isRead && markAsRead(notification._id)}
              className={`relative flex gap-4 p-5 rounded-2xl border transition-all duration-300 ${
                !notification.isRead 
                  ? 'bg-white border-cyan-200 shadow-md hover:shadow-lg cursor-pointer' 
                  : 'bg-gray-50/50 border-gray-100 shadow-sm opacity-80 hover:opacity-100'
              }`}
            >
              {/* Unread Indicator dot */}
              {!notification.isRead && (
                <div className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-3 h-3 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
              )}

              {/* Icon */}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                !notification.isRead ? 'bg-cyan-50' : 'bg-gray-100'
              }`}>
                {getNotificationIcon(notification.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-4 mb-1">
                  <h3 className={`text-base truncate ${!notification.isRead ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                    {notification.title}
                  </h3>
                  <span className="text-xs font-medium text-gray-400 whitespace-nowrap shrink-0">
                    {formatTimeAgo(notification.createdAt)}
                  </span>
                </div>
                <p className={`text-sm ${!notification.isRead ? 'text-gray-600 font-medium' : 'text-gray-500'}`}>
                  {notification.message}
                </p>
              </div>

              {/* Action */}
                <div className="shrink-0 flex items-center gap-2">
                  {!notification.isRead && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification._id);
                      }}
                      className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-full transition-colors tooltip-trigger"
                      title="Mark as read"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  )}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setNotificationToRemove(notification);
                      setIsDeleteModalOpen(true);
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors tooltip-trigger"
                    title="Remove"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
            </div>
          ))
        )}
      </div>

      <DeleteConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setNotificationToRemove(null); }}
        onConfirm={handleRemoveNotification}
        recordName={notificationToRemove?.title || 'Notification'}
        description={`This will remove the notification.`}
        requireReason={true}
      />
    </div>
  );
};

export default PatientNotifications;
