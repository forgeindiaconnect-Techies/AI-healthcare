import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import API from '../../api/api';
import { Send, Paperclip, Check, CheckCheck, Clock, FileText, Download } from 'lucide-react';
import toast from 'react-hot-toast';

const PatientChat = ({ doctorId, appointmentId, doctorName, doctorAvatar }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchChatHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId, appointmentId]);

  useEffect(() => {
    if (socket) {
      const handleNewMessage = (msg) => {
        if (msg.sender._id === doctorId || msg.sender === doctorId) {
          setMessages(prev => [...prev, msg]);
          // Mark as read (mock logic, ideally call API)
          socket.emit('read_receipt', { senderId: doctorId, receiverId: user.id });
        }
      };

      const handleReadReceipt = ({ by }) => {
        if (by === doctorId) {
          setMessages(prev => prev.map(m => (!m.isRead && (m.sender._id === user.id || m.sender === user.id) ? { ...m, isRead: true } : m)));
        }
      };

      socket.on('chat_message', handleNewMessage);
      socket.on('messages_read', handleReadReceipt);

      return () => {
        socket.off('chat_message', handleNewMessage);
        socket.off('messages_read', handleReadReceipt);
      };
    }
  }, [socket, doctorId, user.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchChatHistory = async () => {
    try {
      const { data } = await API.get(`/api/chat/${doctorId}${appointmentId ? `?appointmentId=${appointmentId}` : ''}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setMessages(data.data || []);
      
      // Mark as read
      await API.put(`/api/chat/${doctorId}/read`, {}, { headers: { Authorization: `Bearer ${user.token}` } });
      if (socket) socket.emit('read_receipt', { senderId: doctorId, receiverId: user.id });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const tempId = Date.now().toString();
    const newMsg = {
      _id: tempId,
      text: newMessage,
      sender: { _id: user.id, name: user.name },
      receiver: doctorId,
      createdAt: new Date().toISOString(),
      isRead: false
    };

    setMessages(prev => [...prev, newMsg]);
    setNewMessage('');

    try {
      const { data } = await API.post('/api/chat', {
        receiver: doctorId,
        appointment: appointmentId,
        text: newMsg.text
      }, { headers: { Authorization: `Bearer ${user.token}` } });

      // Replace temp msg with real one
      setMessages(prev => prev.map(m => m._id === tempId ? data.data : m));
      
      // Emit socket
      if (socket) {
        socket.emit('chat_message', data.data);
      }
    } catch (error) {
      toast.error('Failed to send message');
      setMessages(prev => prev.filter(m => m._id !== tempId));
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading chat...</div>;

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-indigo-50/50 border-b border-indigo-100 flex items-center gap-3">
        <img src={doctorAvatar || 'https://via.placeholder.com/150'} alt={doctorName} className="w-10 h-10 rounded-full border border-white shadow-sm" />
        <div>
          <h3 className="font-bold text-gray-900">{doctorName || 'Doctor'}</h3>
          <p className="text-xs text-emerald-600 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Online</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-3">
              <Clock className="w-8 h-8 text-indigo-200" />
            </div>
            <p className="font-medium">Start a conversation with Dr. {doctorName}</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.sender._id === user.id || msg.sender === user.id;
            return (
              <div key={msg._id || i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${isMe ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white border border-gray-100 text-gray-800 shadow-sm rounded-tl-sm'}`}>
                  {msg.fileUrl ? (
                    <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-black/10 rounded-xl hover:bg-black/20 transition-colors">
                      <FileText className="w-5 h-5" />
                      <span className="text-sm font-medium underline">View Attachment</span>
                      <Download className="w-4 h-4 ml-2" />
                    </a>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-1 px-1">
                  <span className="text-[10px] text-gray-400">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {isMe && (
                    msg.isRead ? <CheckCheck className="w-3 h-3 text-emerald-500" /> : <Check className="w-3 h-3 text-gray-400" />
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex items-center gap-2">
        <button type="button" className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors">
          <Paperclip className="w-5 h-5" />
        </button>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
        />
        <button 
          type="submit" 
          disabled={!newMessage.trim()}
          className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full transition-colors shadow-sm"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default PatientChat;
