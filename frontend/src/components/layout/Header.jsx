import React, { useState, useEffect, useRef } from 'react';
import { Avatar } from '../ui/SharedUI';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useChat } from '../../context/ChatContext';
import toast from 'react-hot-toast';
import { Bell, Menu, CheckCircle2, XCircle, Info, CheckCheck, MessageCircle } from 'lucide-react';
import API from '../../api/api';

const Header = ({ onToggleSidebar }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { openChat } = useChat();
  const [showNotif, setShowNotif] = useState(false);
  const dropdownRef = useRef(null);

  const [notifications, setNotifications] = useState([]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownRef]);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        if (!user || !user.token) return;
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await API.get('/api/notifications', config);

        if (data.success && data.data) {
          const formatted = data.data.map((n) => ({
            id: n._id,
            type: n.metadata?.conversationId ? 'chat' : n.type === 'ai_alert' ? 'info' : n.priority === 'high' ? 'warning' : 'success',
            message: n.title,
            detail: n.message,
            time: new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: n.isRead,
            metadata: n.metadata || null,
          }));
          setNotifications(formatted);
        }
      } catch (error) {
        console.error('Error fetching notifications', error);
      }
    };

    fetchNotifications();
  }, [user]);

  useEffect(() => {
    if (socket) {
      const handleNewNotification = (notif) => {
        const isChat = notif.type === 'chat_message';

        // Show toast
        toast.custom(
          (t) => (
            <div
              className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex border border-gray-100 mt-2 overflow-hidden ring-1 ring-black/5`}
            >
              <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                  <div className="shrink-0 mt-0.5">
                    {isChat ? (
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <MessageCircle className="w-4 h-4 text-indigo-600" />
                      </div>
                    ) : (
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-bold text-gray-900">{notif.title}</p>
                    <p className="mt-0.5 text-sm text-gray-500">{notif.message}</p>
                  </div>
                </div>
              </div>
              <div className="flex border-l border-gray-100">
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="w-full border border-transparent rounded-none p-4 flex items-center justify-center text-sm font-bold text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          ),
          { duration: 6000 }
        );

        // Add to local state
        setNotifications((prev) => [
          {
            id: notif._id || Date.now().toString(),
            type: isChat ? 'chat' : 'success',
            message: notif.title,
            detail: notif.message,
            time: 'Just now',
            read: false,
            metadata: notif.metadata || null,
          },
          ...prev,
        ]);
      };

      socket.on('new_notification', handleNewNotification);
      return () => socket.off('new_notification', handleNewNotification);
    }
  }, [socket]);

  const unread = notifications.filter((n) => !n.read).length;

  const markAllAsRead = async () => {
    try {
      if (!user || !user.token) return;
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await API.put('/api/notifications/read-all', {}, config);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read', error);
    }
  };

  const handleNotificationClick = async (notif) => {
    // Mark as read
    if (!notif.read) {
      try {
        await API.put(`/api/notifications/${notif.id}/read`, {}, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
        );
      } catch (_) {}
    }

    // If it's a chat notification, open the chat
    if (notif.type === 'chat' && notif.metadata?.senderId) {
      const senderRole = notif.metadata.senderRole;
      const senderName = notif.message.replace('New message from ', '').replace('Dr. ', '');
      openChat({
        otherUserId: notif.metadata.senderId,
        otherUserName: senderName,
        otherUserRole: senderRole,
      });
      setShowNotif(false);
    }
  };

  if (!user) return null;

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200/80 flex items-center px-4 lg:px-8 gap-4 sticky top-0 z-50 transition-all">
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <Menu className="w-6 h-6" />
      </button>

      <div className="flex-1" />

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowNotif(!showNotif)}
          className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors relative focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <Bell className="w-6 h-6" />
          {unread > 0 && (
            <span className="absolute top-1 right-1.5 bg-red-500 text-white rounded-full w-4 h-4 text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-sm">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        {showNotif && (
          <div className="absolute -right-2 sm:-right-4 top-full mt-3 w-80 md:w-96 z-[200] origin-top-right animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute -top-1.5 right-6 sm:right-8 w-3.5 h-3.5 bg-gray-50 border-t border-l border-gray-200 transform rotate-45 z-10 rounded-tl-sm" />

            <div className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden ring-1 ring-black/5 relative z-20">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-gray-900">Notifications</h3>
                {unread > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                  >
                    <CheckCheck className="w-4 h-4" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-[380px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 bg-white">
                    <Bell className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm">No notifications yet.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`w-full text-left p-4 border-b border-gray-50 flex gap-4 transition-colors hover:bg-gray-50 ${n.read ? 'bg-white opacity-75' : 'bg-indigo-50/30'}`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {n.type === 'chat' && (
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                            <MessageCircle className="w-4 h-4 text-indigo-600" />
                          </div>
                        )}
                        {n.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-1.5" />}
                        {n.type === 'warning' && <XCircle className="w-5 h-5 text-red-500 mt-1.5" />}
                        {n.type === 'info' && <Info className="w-5 h-5 text-blue-500 mt-1.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${n.read ? 'text-gray-600 font-medium' : 'text-gray-900 font-bold'}`}>
                          {n.message}
                        </p>
                        {n.detail && <p className="text-xs text-gray-500 mt-0.5">{n.detail}</p>}
                        <p className="text-xs text-gray-400 mt-1 font-medium">{n.time}</p>
                        {n.type === 'chat' && !n.read && (
                          <span className="inline-block mt-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                            Click to open chat
                          </span>
                        )}
                      </div>
                      {!n.read && (
                        <div className="shrink-0 flex items-center mt-1">
                          <div className="w-2 h-2 rounded-full bg-indigo-500" />
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="h-8 w-px bg-gray-200 hidden sm:block mx-1" />

      <div className="flex items-center gap-3 pl-2">
        <div className="hidden sm:block text-right">
          <p className="text-sm font-bold text-gray-900 leading-none">{user.name}</p>
          <p className="text-xs text-gray-500 mt-1 font-medium uppercase tracking-wider">{user.role}</p>
        </div>
        <div className="ring-2 ring-white shadow-sm rounded-full">
          <Avatar name={user.name} size={38} className="rounded-full" />
        </div>
      </div>
    </header>
  );
};

export default Header;
