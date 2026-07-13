import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, Trash2 } from 'lucide-react';
import API from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import DeleteConfirmationModal from '../../components/ui/DeleteConfirmationModal';

const DoctorNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [notificationToRemove, setNotificationToRemove] = useState(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
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
    
    fetchNotifications();
  }, [user.token]);

  const markAllRead = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await API.put('/api/notifications/read-all', {}, config);
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to update notifications');
    }
  };

  const markAsRead = async (id) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await API.put(`/api/notifications/${id}/read`, {}, config);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      toast.error('Failed to update notification');
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

  if (loading) return <div className="p-12 text-center text-gray-500">Loading notifications...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <Bell className="w-6 h-6 mr-3 text-primary-500" /> Notifications
        </h1>
        {notifications.some(n => !n.isRead) && (
          <button 
            onClick={markAllRead}
            className="flex items-center text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors bg-primary-50 dark:bg-primary-900/30 px-4 py-2 rounded-lg"
          >
            <CheckCircle className="w-4 h-4 mr-2" /> Mark all as read
          </button>
        )}
      </div>
      
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            <Bell className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-lg font-medium">No new notifications</p>
            <p className="text-sm mt-1">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {notifications.map(notif => (
              <div 
                key={notif._id} 
                className={`p-6 transition-colors flex items-start justify-between ${
                  !notif.isRead ? 'bg-primary-50/50 dark:bg-primary-900/20' : 'hover:bg-gray-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    notif.type === 'appointment' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 
                    notif.type === 'report' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                    'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-400'
                  }`}>
                    {notif.type === 'appointment' ? '📅' : notif.type === 'report' ? '📄' : '🔔'}
                  </div>
                  <div>
                    <h3 className={`font-semibold ${!notif.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                      {notif.title}
                    </h3>
                    <p className={`mt-1 text-sm ${!notif.isRead ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>
                      {notif.message}
                    </p>
                    <p className="mt-2 text-xs text-gray-400">
                      {new Date(notif.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {!notif.isRead && (
                    <button 
                      onClick={() => markAsRead(notif._id)}
                      className="flex-shrink-0 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 bg-white dark:bg-slate-900 px-3 py-1.5 rounded border border-gray-200 dark:border-slate-700 hover:border-primary-300 transition-all"
                    >
                      Mark as read
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      setNotificationToRemove(notif);
                      setIsDeleteModalOpen(true);
                    }}
                    className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 bg-white dark:bg-slate-900 rounded border border-gray-200 dark:border-slate-700 transition-all"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
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

export default DoctorNotifications;
