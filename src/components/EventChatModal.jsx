import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageCircle } from 'lucide-react';
import api from '../utility/api';
import { useUser } from '../context/userContext';
import socket from '../utility/socket'; 

const EventChatModal = ({ event, onClose }) => {
  const { user } = useUser();
  const currentUserId = String(user?._id || user?.id);
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  const messagesEndRef = useRef(null);

  // 1. Auto-scroll to the bottom when a new message arrives
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 2. Fetch Chat History & Setup Socket
  useEffect(() => {
    let mounted = true;

    const fetchMessages = async () => {
      try {
        const res = await api.get(`/event/chat/${event._id}`);
        if (res.data.success && mounted) {
          setMessages(res.data.messages);
        }
      } catch (error) {
        console.error("Failed to load chat history", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchMessages();

    // Join the specific event's socket room
    socket.connect();
    socket.emit('joinEventChat', event._id);

    // Listen for incoming messages
    const handleReceiveMessage = (message) => {
      if (!mounted) return;
      setMessages((prev) => [...prev, message]);
    };

    socket.on('receiveMessage', handleReceiveMessage);

    return () => {
      mounted = false;
      socket.off('receiveMessage', handleReceiveMessage);
      socket.emit('leaveEventChat', event._id);
    };
  }, [event._id]);

  // 3. Send Message Function
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Send via socket
    socket.emit('sendMessage', {
      eventId: event._id,
      senderId: currentUserId,
      text: newMessage
    });

    setNewMessage(''); // Clear input instantly for snappy UX
  };

  // 4. Format time
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-gray-50 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative flex flex-col h-[80vh] border border-gray-200">
        
        {/* Header */}
        <div className="bg-white px-6 py-4 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-full text-indigo-600">
              <MessageCircle size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg leading-tight">{event.title}</h3>
              <p className="text-xs text-green-500 font-medium">Live Chat</p>
            </div>
          </div>
          <button onClick={onClose} className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-full transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
          {loading ? (
            <div className="flex h-full items-center justify-center text-gray-400 font-medium animate-pulse">
              Loading chat history...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full items-center justify-center flex-col text-gray-400">
              <MessageCircle size={40} className="mb-2 opacity-20" />
              <p>No messages yet. Say hi!</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = String(msg.sender?._id || msg.sender) === currentUserId;
              const senderName = msg.sender?.name || 'User';

              return (
                <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && <span className="text-[10px] text-gray-500 ml-2 mb-1 font-medium">{senderName.split(' ')[0]}</span>}
                  
                  <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl shadow-sm text-sm relative ${
                    isMe 
                    ? 'bg-indigo-600 text-white rounded-br-sm' 
                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
                  }`}>
                    <p className="leading-relaxed">{msg.text}</p>
                    <span className={`text-[9px] block text-right mt-1 ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                      {formatTime(msg.createdAt || new Date())}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white p-4 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] z-10">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2 relative">
            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..." 
              className="flex-1 bg-gray-100 border-transparent focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 px-4 py-3 rounded-full outline-none transition-all text-sm"
            />
            <button 
              type="submit" 
              disabled={!newMessage.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-3 rounded-full transition-all shadow-md active:scale-95 flex items-center justify-center"
            >
              <Send size={18} className={newMessage.trim() ? 'ml-0.5' : ''} />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default EventChatModal;