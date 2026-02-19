import React, { useState } from 'react';
import { X, MapPin, Clock, Users, User, FileText, CheckCircle, Clock as ClockIcon, XCircle, CreditCard } from 'lucide-react';
import api from '../utility/api'; 
import { useUser } from '../context/userContext'; 

const EventDetailsModal = ({ event, onClose, onJoinSuccess }) => {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

  if (!event) return null;

  const currentUserId = String(user?._id || user?.id);

  const requestsList = Array.isArray(event.requests) ? event.requests : [];
  const approvedCount = requestsList.filter(r => r.status === 'approved').length;
  const capacity = event.requiredPeople || 0;
  const spotsLeft = Math.max(0, capacity - approvedCount);
  const isFull = spotsLeft <= 0;

  const myRequest = requestsList.find(r => {
      const reqUserId = r.user?._id || r.user;
      return String(reqUserId) === currentUserId;
  });
  const myStatus = myRequest?.status; 

  // ==========================================
  // 🟢 THE STRIPE + FREE EVENT ROUTER PIPELINE
  // ==========================================
  const handleRequestJoin = async () => {
    if (!user) {
      alert("Please login to request joining!");
      return;
    }

    setLoading(true);
    try {
      // 1. PAID EVENT PIPELINE
      if (event.isPaid && event.amount > 0) {
        const res = await api.post('/payment/create-checkout-session', { eventId: event._id });
        
        if (res.data.success && res.data.url) {
          // Redirect the browser entirely to the secure Stripe Checkout page
          window.location.href = res.data.url;
        } else {
          alert("Failed to initialize payment session.");
        }
      } 
      // 2. FREE EVENT PIPELINE
      else {
        const res = await api.post(`/event/request/${event._id}`);
        if (res.data.success) {
          alert("Request sent to host! ⏳");
          if (onJoinSuccess) onJoinSuccess(); 
        }
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to process request");
    } finally {
      // Only runs if they don't get redirected
      setLoading(false);
    }
  };

  // 🟢 Dynamic Button Renderer
  const renderButton = () => {
    if (loading) return <button disabled className="w-full py-3.5 rounded-xl font-bold bg-gray-400 text-white">Processing...</button>;
    
    if (myStatus === 'approved') {
      return (
        <button disabled className="w-full py-3.5 rounded-xl font-bold bg-green-500 text-white shadow-lg flex items-center justify-center gap-2 cursor-default">
          <CheckCircle size={20} /> Request Approved! You're in.
        </button>
      );
    }
    
    if (myStatus === 'pending') {
      return (
        <button disabled className="w-full py-3.5 rounded-xl font-bold bg-yellow-500 text-white shadow-lg flex items-center justify-center gap-2 cursor-wait">
          <ClockIcon size={20} /> Request Pending Host Approval...
        </button>
      );
    }

    if (myStatus === 'rejected') {
        return (
          <button disabled className="w-full py-3.5 rounded-xl font-bold bg-red-100 text-red-500 border border-red-200 shadow-sm flex items-center justify-center gap-2 cursor-not-allowed">
            <XCircle size={20} /> Request Declined
          </button>
        );
      }

    if (isFull) {
      return <button disabled className="w-full py-3.5 rounded-xl font-bold bg-gray-300 text-gray-500 cursor-not-allowed">Event Sold Out</button>;
    }

    // 🟢 Dynamic Checkout Text
    if (event.isPaid) {
      return (
        <button 
          onClick={handleRequestJoin}
          className="w-full py-3.5 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition-all shadow-lg flex justify-center items-center gap-2"
        >
          <CreditCard size={20} /> Pay ₹{event.amount} & Join
        </button>
      );
    }

    return (
      <button 
        onClick={handleRequestJoin}
        className="w-full py-3.5 rounded-xl font-bold bg-black text-white hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
      >
        Request to Join
      </button>
    );
  };

  const eventDateObj = event.date ? new Date(event.date) : new Date();
  const day = isNaN(eventDateObj.getDate()) ? '--' : eventDateObj.getDate();
  const month = isNaN(eventDateObj.getMonth()) ? 'MMM' : eventDateObj.toLocaleString('default', { month: 'short' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
        
        {/* Header Image Area */}
        <div className="h-32 bg-gradient-to-r from-indigo-600 to-purple-600 relative">
          <button onClick={onClose} className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-all backdrop-blur-md">
            <X size={20} />
          </button>
          
          <div className="absolute -bottom-8 left-6">
             <div className="bg-white p-1 rounded-2xl shadow-lg">
                <div className="bg-indigo-50 px-4 py-2 rounded-xl text-center min-w-[80px]">
                   <span className="block text-xs font-bold text-indigo-400 uppercase tracking-wider">{event.category}</span>
                   <span className="block text-xl font-black text-gray-800">{day}</span>
                   <span className="block text-xs font-bold text-gray-500 uppercase">{month}</span>
                </div>
             </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="pt-12 px-6 pb-6 overflow-y-auto w-full">
          
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-2xl font-black text-gray-800 leading-tight flex-1">{event.title}</h2>
            {event.isPaid ? (
               <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200">₹{event.amount}</span>
            ) : (
               <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold border border-blue-100">Free</span>
            )}
          </div>

          <p className="text-gray-500 text-sm mb-6 leading-relaxed">{event.description || "No description provided."}</p>

          <div className="space-y-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-6">
             <div className="flex items-center gap-3 text-gray-700">
                <Clock className="text-indigo-500" size={18} />
                <span className="text-sm font-medium">{event.time}</span>
             </div>
             <div className="flex items-center gap-3 text-gray-700">
                <MapPin className="text-red-500" size={18} />
                <span className="text-sm font-medium">{event.venue}, {event.city}</span>
             </div>
             <div className="flex items-center gap-3 text-gray-700">
                <User className="text-green-500" size={18} />
                <span className="text-sm font-medium">Host: {event.creator?.name || "Organizer"}</span>
             </div>
             {event.notes && (
               <div className="flex items-start gap-3 text-gray-700">
                  <FileText className="text-orange-500 mt-1" size={18} />
                  <span className="text-sm font-medium italic">"{event.notes}"</span>
               </div>
             )}
          </div>

          <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-2">
                <Users size={20} className="text-gray-400" />
                <span className="font-bold text-gray-800">{approvedCount} / {capacity} Approved</span>
             </div>
             <div className="text-sm">
                {isFull ? <span className="text-red-500 font-bold">Event Full</span> : <span className="text-green-600 font-bold">{spotsLeft} spots left</span>}
             </div>
          </div>

          {/* Action Button */}
          {renderButton()}

        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;