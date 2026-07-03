import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import API from '../../api/api';
import {
  Send,
  Paperclip,
  Check,
  CheckCheck,
  FileText,
  Download,
  UserCircle,
  Loader2,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Shared WhatsApp-style chat window.
 *
 * Props:
 *  - otherUserId       : ID of the doctor/patient on the other end
 *  - otherUserName     : display name
 *  - otherUserRole     : 'doctor' | 'patient'
 *  - otherUserAvatar   : optional avatar URL
 *  - onClose           : callback to close the modal
 */
const ChatWindow = ({
  otherUserId,
  otherUserName,
  otherUserRole,
  otherUserAvatar,
  onClose,
}) => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingStatus, setTypingStatus] = useState('');
  const [otherUserOnline, setOtherUserOnline] = useState(true);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const textareaRef = useRef(null);

  // ─── Determine doctor/patient IDs ─────────────────────────────────────────
  const doctorId = user.role === 'doctor' ? user._id : otherUserId;
  const patientId = user.role === 'patient' ? user._id : otherUserId;
  const myRole = user.role === 'doctor' ? 'doctor' : 'patient';

  // ─── Fetch conversation & messages on mount ────────────────────────────────
  useEffect(() => {
    fetchConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otherUserId]);

  const fetchConversation = async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };

      const { data: convData } = await API.get(
        `/api/chat/conversation?doctorId=${doctorId}&patientId=${patientId}`,
        config
      );
      const conv = convData.data;
      setConversationId(conv._id);

      const { data: msgData } = await API.get(
        `/api/chat/messages?conversationId=${conv._id}`,
        config
      );
      setMessages(msgData.data || []);

      // Mark as read immediately
      const unreadCount =
        myRole === 'doctor' ? conv.unreadCountDoctor : conv.unreadCountPatient;
      if (unreadCount > 0) {
        await API.post(
          '/api/chat/mark-read',
          { conversationId: conv._id, userId: user._id },
          config
        );
      }
    } catch (err) {
      console.error(err);
      toast.error('Unable to load chat.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Auto-scroll ──────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Socket listeners ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !conversationId) return;

    const handleNewMessage = (msg) => {
      if (msg.conversationId === conversationId || msg.conversationId?._id === conversationId) {
        setMessages((prev) => {
          const exists = prev.find((m) => m._id === msg._id);
          if (exists) return prev;
          return [...prev, msg];
        });
        // Mark as read since window is open
        API.post(
          '/api/chat/mark-read',
          { conversationId, userId: user._id },
          { headers: { Authorization: `Bearer ${user.token}` } }
        ).catch(() => {});
      }
    };

    const handleReadReceipt = ({ by, conversationId: readConvId }) => {
      if (readConvId === conversationId && by === otherUserId) {
        setMessages((prev) =>
          prev.map((m) => {
            const sId = m.senderId?._id || m.senderId;
            if (!m.isRead && sId === user._id) return { ...m, isRead: true };
            return m;
          })
        );
      }
    };

    const handleTyping = ({ conversationId: typingConvId, senderName, isTyping }) => {
      if (typingConvId === conversationId) {
        setTypingStatus(isTyping ? `${senderName} is typing…` : '');
      }
    };

    socket.on('chat_message', handleNewMessage);
    socket.on('messages_read', handleReadReceipt);
    socket.on('user_typing', handleTyping);

    return () => {
      socket.off('chat_message', handleNewMessage);
      socket.off('messages_read', handleReadReceipt);
      socket.off('user_typing', handleTyping);
    };
  }, [socket, conversationId, otherUserId, user._id, user.token]);

  // ─── Typing event emitter ─────────────────────────────────────────────────
  const handleTypingInput = (e) => {
    setNewMessage(e.target.value);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';

    if (!socket || !conversationId) return;
    socket.emit('typing_start', {
      receiverId: otherUserId,
      senderName: user.name,
      conversationId,
    });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', { receiverId: otherUserId, conversationId });
    }, 1500);
  };

  // ─── Send message ─────────────────────────────────────────────────────────
  const handleSend = useCallback(
    async (e) => {
      e?.preventDefault();
      const trimmed = newMessage.trim();
      if (!trimmed || sending || !conversationId) return;

      setSending(true);
      setNewMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      // Stop typing indicator
      if (socket) socket.emit('typing_stop', { receiverId: otherUserId, conversationId });

      const tempId = `temp_${Date.now()}`;
      const optimistic = {
        _id: tempId,
        conversationId,
        senderId: { _id: user._id, name: user.name },
        receiverId: otherUserId,
        senderRole: myRole,
        message: trimmed,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);

      try {
        const { data } = await API.post(
          '/api/chat/send',
          {
            conversationId,
            receiverId: otherUserId,
            senderRole: myRole,
            message: trimmed,
          },
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        setMessages((prev) =>
          prev.map((m) => (m._id === tempId ? data.messageData : m))
        );
      } catch (err) {
        toast.error('Message not sent. Please try again.');
        setMessages((prev) => prev.filter((m) => m._id !== tempId));
        setNewMessage(trimmed);
      } finally {
        setSending(false);
        textareaRef.current?.focus();
      }
    },
    [newMessage, sending, conversationId, otherUserId, myRole, user, socket]
  );

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const isMe = (msg) => {
    const sId = msg.senderId?._id || msg.senderId;
    return sId === user._id || sId === user.id;
  };

  const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const displayName =
    otherUserRole === 'doctor' ? `Dr. ${otherUserName || 'Doctor'}` : otherUserName || 'Patient';

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      className="flex flex-col bg-white rounded-2xl overflow-hidden shadow-2xl border border-gray-200"
      style={{ height: '680px', width: '100%' }}
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shrink-0">
        <div className="relative">
          {otherUserAvatar ? (
            <img
              src={otherUserAvatar}
              alt={displayName}
              className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
              {(otherUserName || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          {otherUserOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-indigo-600 rounded-full" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[15px] leading-tight truncate">{displayName}</p>
          <p className="text-[11px] text-indigo-100 leading-tight">
            {typingStatus || (otherUserOnline ? 'Online' : 'Offline')}
          </p>
        </div>
        <button
          onClick={onClose}
          className="ml-auto p-1.5 rounded-full hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* ── Messages area ── */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
          <Loader2 className="w-8 h-8 animate-spin mb-2 text-indigo-400" />
          <p className="text-sm">Loading chat…</p>
        </div>
      ) : (
        <div
          className="flex-1 overflow-y-auto px-4 py-4 space-y-2"
          style={{
            background: 'linear-gradient(180deg, #f0f4ff 0%, #fafafe 100%)',
          }}
        >
          {messages.length === 0 ? (
            <div className="flex justify-center mt-12">
              <div className="bg-white border border-gray-100 shadow-sm text-gray-500 px-5 py-3 rounded-2xl text-sm text-center max-w-xs">
                <p className="text-2xl mb-1">💬</p>
                No messages yet. Start the conversation.
              </div>
            </div>
          ) : (
            messages.map((msg, i) => {
              const mine = isMe(msg);
              const showDate =
                i === 0 ||
                new Date(messages[i - 1].createdAt).toDateString() !==
                  new Date(msg.createdAt).toDateString();

              return (
                <React.Fragment key={msg._id || i}>
                  {showDate && (
                    <div className="flex justify-center my-2">
                      <span className="text-[11px] text-gray-400 bg-white border border-gray-100 px-3 py-1 rounded-full shadow-sm">
                        {new Date(msg.createdAt).toLocaleDateString([], {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                  <div className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`relative max-w-[72%] px-3.5 pt-2 pb-6 rounded-2xl shadow-sm text-[14.5px] leading-relaxed break-words ${
                        mine
                          ? 'bg-indigo-600 text-white rounded-tr-sm'
                          : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
                      }`}
                    >
                      {msg.attachmentUrl ? (
                        <a
                          href={msg.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 bg-black/10 rounded-xl hover:bg-black/15 transition-colors"
                        >
                          <FileText className="w-5 h-5" />
                          <span className="text-sm font-medium underline">Attachment</span>
                          <Download className="w-4 h-4 ml-auto" />
                        </a>
                      ) : (
                        <span className="whitespace-pre-wrap">{msg.message}</span>
                      )}
                      {/* Timestamp & read status */}
                      <div className="absolute bottom-1.5 right-2.5 flex items-center gap-1">
                        <span className={`text-[10px] ${mine ? 'text-indigo-100' : 'text-gray-400'}`}>
                          {formatTime(msg.createdAt)}
                        </span>
                        {mine &&
                          (msg.isRead ? (
                            <CheckCheck className="w-3.5 h-3.5 text-sky-300" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-indigo-200" />
                          ))}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })
          )}
          <div ref={messagesEndRef} className="h-1" />
        </div>
      )}

      {/* ── Input ── */}
      <form
        onSubmit={handleSend}
        className="shrink-0 px-3 py-2.5 bg-gray-50 border-t border-gray-100 flex items-end gap-2"
      >
        <div className="flex-1 bg-white rounded-2xl border border-gray-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all shadow-sm flex items-end">
          <button type="button" className="p-2.5 text-gray-400 hover:text-indigo-500 transition-colors shrink-0">
            <Paperclip className="w-5 h-5" />
          </button>
          <textarea
            ref={textareaRef}
            value={newMessage}
            onChange={handleTypingInput}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            rows={1}
            className="flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-[14.5px] py-2.5 pr-2 resize-none max-h-32 scrollbar-thin placeholder-gray-400"
            style={{ height: 'auto', minHeight: '42px' }}
          />
        </div>
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="w-11 h-11 shrink-0 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-indigo-300"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4 ml-0.5" />
          )}
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
