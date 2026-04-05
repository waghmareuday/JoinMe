import React, { useState } from 'react';
import { X, MapPin, Clock, Users, FileText, Clock as ClockIcon, XCircle, CreditCard, ListPlus, RefreshCw, Star, ArrowRight, ShieldCheck, Ticket, QrCode, Crown, CheckCircle, Calendar, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utility/api';
import { useUser } from '../context/userContext';
import CalendarExportButton from './CalendarExportButton';
import UserProfileModal from './UserProfileModal';

const EventDetailsModal = ({ event, onClose, onJoinSuccess }) => {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [viewProfileId, setViewProfileId] = useState(null);

  if (!event) return null;

  const currentUserId = String(user?._id || user?.id);
  const requestsList = Array.isArray(event.requests) ? event.requests : [];
  const approvedCount = requestsList.filter(r => r.status === 'approved').length;
  const capacity = event.requiredPeople || 0;
  const spotsLeft = Math.max(0, capacity - approvedCount);
  const isFull = spotsLeft <= 0;
  const fillPct = capacity > 0 ? Math.min(100, Math.round((approvedCount / capacity) * 100)) : 0;

  const myRequest = requestsList.find(r => String(r.user?._id || r.user) === currentUserId);
  const myStatus = myRequest?.status;
  const waitlistList = Array.isArray(event.waitlist) ? event.waitlist : [];
  const isOnWaitlist = waitlistList.some(w => String(w.user?._id || w.user) === currentUserId);

  const isCreator = String(event.creator?._id || event.creator) === currentUserId;
  const hostName = event.creator?.name || 'Organizer';
  const hostRating = event.creator?.averageRating || 0;
  const hostId = event.creator?._id || event.creator;

  const showTicketPass = isCreator || myStatus === 'approved';
  const isHostPass = isCreator;

  const handleRequestJoin = async () => {
    if (!user) { toast.error("Please login to request joining!"); return; }
    setLoading(true);
    try {
      if (event.isPaid && event.amount > 0) {
        const res = await api.post('/payment/create-checkout-session', { eventId: event._id });
        if (res.data.success && res.data.url) { window.location.href = res.data.url; }
        else { toast.error("Failed to initialize payment session."); }
      } else {
        const res = await api.post(`/event/request/${event._id}`);
        if (res.data.success) { toast.success(res.data.message || "Request sent to host! ⏳"); if (onJoinSuccess) onJoinSuccess(); }
      }
    } catch (error) { toast.error(error.response?.data?.message || "Failed to process request"); }
    finally { setLoading(false); }
  };

  const handleReRequest = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/event/request/${event._id}`);
      if (res.data.success) { toast.success("Re-request sent to host!"); if (onJoinSuccess) onJoinSuccess(); }
    } catch (error) { toast.error(error.response?.data?.message || "Failed to send re-request"); }
    finally { setLoading(false); }
  };

  const handleJoinWaitlist = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/event/request/${event._id}`);
      if (res.data.success) { toast.success(res.data.message || "Added to waitlist!"); if (onJoinSuccess) onJoinSuccess(); }
    } catch (error) { toast.error(error.response?.data?.message || "Failed to join waitlist"); }
    finally { setLoading(false); }
  };

  const renderButton = () => {
    if (loading) return <button disabled className="w-full py-4 rounded-xl font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 text-sm">Processing...</button>;
    
    if (myStatus === 'pending') {
      return <button disabled className="w-full py-4 rounded-xl font-bold bg-amber-500 text-white shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-wait"><ClockIcon size={18} /> Pending host approval...</button>;
    }
    if (myStatus === 'rejected') {
      return <button onClick={handleReRequest} disabled={loading} className="w-full py-4 rounded-xl font-bold bg-orange-500 text-white shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 hover:bg-orange-600 active:scale-[0.98] transition-all"><RefreshCw size={18} /> Re-request to Join</button>;
    }
    if (myStatus === 'waitlisted' || isOnWaitlist) {
      return <button disabled className="w-full py-4 rounded-xl font-bold bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 flex items-center justify-center gap-2 cursor-wait"><ListPlus size={18} /> On Waitlist position</button>;
    }
    if (isFull) {
      return <button onClick={handleJoinWaitlist} disabled={loading} className="w-full py-4 rounded-xl font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"><ListPlus size={18} /> Join Waitlist</button>;
    }
    if (event.isPaid) {
      return <button onClick={handleRequestJoin} className="w-full py-4 rounded-xl font-semibold bg-indigo-600 text-white hover:shadow-lg hover:shadow-indigo-500/30 active:scale-[0.98] transition-all flex justify-center items-center gap-2"><CreditCard size={18} /> Pay ₹{event.amount} & Join Event</button>;
    }
    return <button onClick={handleRequestJoin} className="w-full py-4 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm">Request to Join</button>;
  };

  const eventDate = event.date ? new Date(event.date) : new Date();
  const day = isNaN(eventDate.getDate()) ? '--' : eventDate.getDate();
  const month = isNaN(eventDate.getMonth()) ? 'MMM' : eventDate.toLocaleString('default', { month: 'short' });
  const year = eventDate.getFullYear();
  const dayName = isNaN(eventDate.getDay()) ? '' : eventDate.toLocaleString('default', { weekday: 'long' });

  // ── FEATURE: VIRTUAL EVENT PASS TICKET VIEW ──
  if (showTicketPass) {
    const ticketId = `${event._id.slice(-6).toUpperCase()}-${(currentUserId || 'GUEST').slice(-4).toUpperCase()}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=JoinMe-Ticket-${event._id}-${currentUserId}`;
    return (
      <div className="fixed inset-0 z-[150] flex flex-col items-center justify-center bg-gray-900/40 dark:bg-black/60 backdrop-blur-md p-4 sm:p-6">
        <div className="w-full max-w-[360px] animate-scale-in group">
          <div className="bg-white dark:bg-[#111827] rounded-[24px] overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800 relative">
            
            <button onClick={onClose} className="absolute top-4 right-4 z-10 bg-black/10 hover:bg-black/20 text-black dark:text-white dark:bg-white/10 dark:hover:bg-white/20 p-2 rounded-full transition-all">
              <X size={16} />
            </button>

            <div className="h-32 bg-indigo-50 dark:bg-indigo-900/20 relative flex items-center justify-center overflow-hidden border-b border-indigo-100 dark:border-indigo-500/10">
               {isHostPass ? (
                 <Crown size={40} className="text-amber-500 opacity-90" />
               ) : (
                 <Ticket size={40} className="text-indigo-500 opacity-90 -rotate-12" />
               )}
            </div>

            <div className="px-6 pt-6 pb-6 text-center relative bg-white dark:bg-[#111827]">
               <div className="mt-2">
                 <span className={`inline-block px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest mb-3 border ${isHostPass ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800' : 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800'}`}>
                   {isHostPass ? 'HOST ALL-ACCESS PASS' : 'ADMIT ONE'}
                 </span>
                 <h2 className="text-xl font-semibold text-gray-900 dark:text-white leading-tight line-clamp-2">{event.title}</h2>
                 <p className="text-gray-500 dark:text-gray-400 text-xs font-medium mt-2">{dayName}, {month} {day}, {year} at {event.time}</p>
                 <p className="text-gray-700 dark:text-gray-300 text-xs font-semibold mt-2 flex items-center justify-center gap-1"><MapPin size={12} className="text-rose-500"/>{event.venue || event.city}</p>
               </div>
            </div>

            {/* Perforated Line */}
            <div className="relative flex items-center bg-white dark:bg-[#111827]">
               <div className="h-5 w-5 rounded-full bg-gray-900/40 dark:bg-black/60 absolute -left-2.5"></div>
               <div className="flex-1 border-t-2 border-dashed border-gray-200 dark:border-gray-800"></div>
               <div className="h-5 w-5 rounded-full bg-gray-900/40 dark:bg-black/60 absolute -right-2.5"></div>
            </div>

            {/* Ticket Base string & QR */}
            <div className="px-6 py-6 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between border-t border-gray-100 dark:border-gray-800">
              <div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">{isHostPass ? 'Verified Host' : 'Guest Name'}</p>
                <p className="text-gray-900 dark:text-white font-semibold text-base leading-tight mt-1">{user?.name || hostName}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 font-mono">ID: {ticketId}</p>
              </div>
              <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center overflow-hidden">
                 <img src={qrUrl} alt="QR Digital Pass" className="w-16 h-16 object-contain mix-blend-multiply" />
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4 max-w-[360px] mx-auto">
             <CalendarExportButton eventId={event._id} />
             <button onClick={onClose} className="flex-1 py-3 bg-white/90 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold rounded-xl transition-colors shadow-sm text-sm">
               Close Pass
             </button>
          </div>
        </div>
      </div>
    );
  }

  // ── FEATURE: ULTRA MINIMAL EXPLORE PREVIEW ──
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-gray-900/40 dark:bg-black/60 backdrop-blur-md p-4 sm:p-6 animate-fade-in">
      {viewProfileId && <UserProfileModal userId={viewProfileId} onClose={() => setViewProfileId(null)} />}

      <div className="bg-white dark:bg-[#111827] w-full max-w-[420px] rounded-[24px] overflow-hidden shadow-2xl animate-scale-in border border-gray-200/60 dark:border-gray-800 flex flex-col max-h-[85vh]">
        
        {/* Clean Header */}
        <div className="relative pt-6 px-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <button onClick={onClose} className="absolute top-4 right-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 p-2 rounded-full transition-all">
            <X size={16} />
          </button>
          
          <div className="flex gap-2 mb-3 mt-1">
             <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded text-center">{event.category}</span>
             {event.isPaid ? (
               <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded flex items-center gap-1"><CreditCard size={12}/> ₹{event.amount}</span>
             ) : (
               <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">Free</span>
             )}
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight tracking-tight pr-6">{event.title}</h2>
          {event.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">{event.description}</p>}
        </div>

        {/* Scroll Content - clean list layout */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          
          <div className="flex flex-col gap-5 mb-6">
            <div className="flex items-start gap-4">
               <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-800">
                  <Calendar size={18} className="text-indigo-600 dark:text-indigo-400" />
               </div>
               <div>
                  <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">Date & Time</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{month} {day}, {year} at {event.time}</p>
               </div>
            </div>

            <div className="flex items-start gap-4">
               <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-800">
                  <MapPin size={18} className="text-rose-600 dark:text-rose-400" />
               </div>
               <div>
                  <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">Location</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{event.venue || 'No Venue Specified'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{event.city}</p>
               </div>
            </div>

            <div 
               className="flex items-center gap-4 p-2 -mx-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
               onClick={() => hostId && setViewProfileId(String(hostId))}
            >
               <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-200 font-bold shrink-0 border border-gray-200 dark:border-gray-700">
                  {hostName.charAt(0).toUpperCase()}
               </div>
               <div className="flex-1">
                  <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">Hosted By</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    {hostName} 
                    {hostRating > 0 && <span className="flex items-center text-xs text-amber-500 font-bold"><Star size={12} className="fill-amber-500 mr-0.5"/> {hostRating.toFixed(1)}</span>}
                  </p>
               </div>
               <ArrowRight size={16} className="text-gray-300 dark:text-gray-600" />
            </div>
          </div>

          {/* Capacity Progress */}
          <div className="mb-2 p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Users size={16} className="text-indigo-500" /> 
                  Capacity
                </p>
              </div>
              <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                <span className="text-gray-900 dark:text-white">{approvedCount}</span> / {capacity}
              </span>
            </div>
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-3">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${fillPct >= 100 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                style={{ width: `${Math.max(5, Math.min(100, fillPct))}%` }}
              />
            </div>
          </div>
          
        </div>

        {/* Action Area */}
        <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-[#111827]">
           {renderButton()}
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;