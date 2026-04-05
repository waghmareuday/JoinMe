import React, { useState } from 'react';
import { Users, Star, MapPin, Clock, Calendar, Zap, Crown, CreditCard, ArrowRight, ArrowUpRight } from 'lucide-react';
import UserProfileModal from './UserProfileModal';

const EventCard = ({ event = {}, bgImage, onClick, variant = 'explore', currentUserId, onChat, onManage, onRate }) => {
  const [viewProfileId, setViewProfileId] = useState(null);

  const capacity = typeof event.requiredPeople === 'number' ? event.requiredPeople : (event.requiredPeople || 0);
  const approvedCount = event.requests ? event.requests.filter(r => r.status === 'approved').length : 0;
  const pendingCount = event.requests ? event.requests.filter(r => r.status === 'pending').length : 0;
  const spotsLeft = Math.max(0, capacity - approvedCount);
  const percent = capacity > 0 ? Math.min(100, Math.round((approvedCount / capacity) * 100)) : 0;
  const isFull = spotsLeft <= 0;

  const getCreatorId = (creator) => {
    if (!creator) return null;
    if (typeof creator === 'string') return creator;
    if (creator._id) return String(creator._id);
    return null;
  };

  const eventDate = event.date ? new Date(event.date) : null;
  const dayNum = eventDate && !isNaN(eventDate.getDate()) ? eventDate.getDate() : '--';
  const monthShort = eventDate && !isNaN(eventDate.getMonth()) ? eventDate.toLocaleString('default', { month: 'short' }).toUpperCase() : 'TBD';
  const dayName = eventDate && !isNaN(eventDate.getDay()) ? eventDate.toLocaleString('default', { weekday: 'short' }) : 'Unknown';

  const isCompleted = event.status === 'completed';
  const isCancelled = event.status === 'cancelled';
  const isLive = event.status === 'live';
  const isPast = isCompleted || isCancelled;

  const myRequest = currentUserId ? event.requests?.find(r => String(r.user?._id || r.user) === currentUserId) : null;
  const myStatus = myRequest?.status;

  const getGradient = (category) => {
    const gradients = {
      'Sports': 'from-orange-500 via-red-500 to-pink-500',
      'Gaming': 'from-indigo-600 via-purple-600 to-fuchsia-600',
      'Food': 'from-emerald-400 via-teal-500 to-cyan-500',
      'Party': 'from-pink-500 via-rose-500 to-red-500',
      'Music': 'from-blue-600 via-indigo-600 to-violet-600',
    };
    return gradients[category] || 'from-indigo-500 via-purple-500 to-pink-500';
  };

  // ========================================
  // VARIANT: EXPLORE — Clean Premium Split Card Layout
  // ========================================
  if (variant === 'explore') {
    return (
      <>
        <div
          className="bg-white dark:bg-slate-900 rounded-[28px] overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-indigo-500/10 dark:shadow-none border border-gray-100 dark:border-slate-800 transition-all duration-500 transform-gpu hover:-translate-y-1 cursor-pointer flex flex-col group min-h-[340px]"
          onClick={onClick}
        >
          {/* Top Header / Image Area */}
          <div className={`relative h-[160px] flex-shrink-0 bg-gradient-to-br ${getGradient(event.category)} overflow-hidden`}>
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-10 mix-blend-overlay"></div>
             {bgImage && <img src={bgImage} className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50 group-hover:scale-105 transition-transform duration-700 ease-out" alt="event bg" />}
             
             <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
                <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-md rounded-xl p-2 text-center shadow-lg border border-white/20 dark:border-slate-700/50 min-w-[55px]">
                   <span className="block text-[10px] uppercase font-black text-indigo-500 dark:text-indigo-400 tracking-widest">{monthShort}</span>
                   <span className="block text-xl font-black text-gray-900 dark:text-white leading-none my-0.5">{dayNum}</span>
                </div>
                
                <div className="flex flex-col gap-2 items-end">
                   <span className="bg-white/20 text-white text-[10px] uppercase font-black tracking-widest px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20 shadow-sm">{event.category}</span>
                   {event.isPaid ? (
                      <span className="bg-emerald-500 text-white text-[10px] uppercase font-black tracking-widest px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)] flex items-center gap-1"><CreditCard size={12}/> ₹{event.amount}</span>
                   ) : (
                      <span className="bg-white/90 text-gray-900 text-[10px] uppercase font-black tracking-widest px-3 py-1.5 rounded-full shadow-lg">Free</span>
                   )}
                </div>
             </div>
             
             {isLive && (
                <div className="absolute bottom-3 left-4 z-10">
                   <span className="bg-red-500/90 text-white text-[10px] font-black tracking-wide px-3 py-1.5 rounded-xl border border-red-400/50 flex items-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.5)] backdrop-blur-md">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> LIVE NOW
                   </span>
                </div>
             )}
          </div>

          {/* Bottom Card Area */}
          <div className="flex-1 p-5 flex flex-col justify-between">
             <div>
               <h3 className="text-lg font-black text-gray-900 dark:text-white leading-tight mb-2 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{event.title}</h3>
               
               <div className="flex flex-col gap-2 text-xs text-gray-500 dark:text-slate-400 font-semibold mt-3">
                 <span className="flex items-center gap-2"><Clock size={16} className="text-purple-500/70" />{dayName}, {event.time}</span>
                 <span className="flex items-center gap-2 line-clamp-1"><MapPin size={16} className="text-indigo-500/70" />{event.venue || event.city}</span>
               </div>
             </div>

             {/* Host Line & Pill */}
             <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-800 pt-4 mt-5">
                <div 
                  className="flex items-center gap-2.5 group/host cursor-pointer" 
                  onClick={(e) => { e.stopPropagation(); const id = getCreatorId(event.creator); if(id) setViewProfileId(id); }}
                >
                   <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-xs border border-indigo-200 dark:border-indigo-500/20 shadow-inner">
                     {(event.creator?.name || '?').charAt(0).toUpperCase()}
                   </div>
                   <div className="flex flex-col">
                     <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-500 tracking-widest leading-none mb-0.5">Hosted By</span>
                     <span className="text-xs font-black text-gray-800 dark:text-slate-200 group-hover/host:text-indigo-600 dark:group-hover/host:text-indigo-400 transition-colors leading-none">{event.creator?.name || 'Organizer'}</span>
                   </div>
                </div>

                {isFull ? (
                   <span className="text-[10px] uppercase font-black text-red-500 bg-red-50 dark:bg-red-500/10 px-2.5 py-1.5 rounded-lg border border-red-100 dark:border-red-500/20">Sold Out</span>
                ) : (
                   <span className="text-[10px] uppercase font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-500/20">{spotsLeft} Spots left</span>
                )}
             </div>
          </div>
        </div>
        {viewProfileId && <UserProfileModal userId={viewProfileId} onClose={() => setViewProfileId(null)} />}
      </>
    );
  }

  // ========================================
  // VARIANT: HOSTED — Card for "Events I'm Hosting"
  // ========================================
  if (variant === 'hosted') {
    return (
      <div className={`bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-xl shadow-indigo-900/5 dark:shadow-none overflow-hidden transition-all hover:border-indigo-200 dark:hover:border-indigo-500/30 group ${isPast ? 'opacity-70 grayscale-[20%]' : ''}`}>
        <div className={`h-2 w-full ${isCompleted ? 'bg-emerald-500' : isCancelled ? 'bg-red-500' : isLive ? 'bg-orange-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`} />
        
        <div className="p-5 sm:p-6">
           <div className="flex justify-between items-start mb-3">
              <div className="flex-1 pr-4">
                 <h4 className="text-lg font-black text-gray-900 dark:text-white leading-tight group-hover:text-indigo-600 dark:group-hover:text-amber-400 transition-colors cursor-pointer" onClick={onClick}>{event.title}</h4>
                 <div className="flex items-center gap-2 text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mt-2 block">
                    <Calendar size={12} className="inline mr-0.5 text-indigo-400" /> {monthShort} {dayNum} <span className="mx-1 text-gray-300 dark:text-slate-700">|</span> <Clock size={12} className="inline mr-0.5 text-purple-400" /> {event.time}
                 </div>
              </div>
              <span className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                 isCompleted ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' :
                 isCancelled ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' :
                 isLive ? 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20' :
                 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20'
              }`}>
                 {event.status || 'UPCOMING'}
              </span>
           </div>

           {/* Metrics Grid */}
           <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-3 flex items-center justify-between border border-gray-100 dark:border-slate-700/50">
                 <div className="flex items-center gap-2"><Users size={14} className="text-indigo-500" /><span className="text-xs font-bold text-gray-600 dark:text-slate-300">Guests</span></div>
                 <span className="text-sm font-black text-gray-900 dark:text-white">{approvedCount}<span className="text-gray-400 text-xs">/{capacity}</span></span>
              </div>
              <div className="bg-orange-50 dark:bg-orange-500/5 rounded-xl p-3 flex items-center justify-between border border-orange-100/50 dark:border-orange-500/10">
                 <div className="flex items-center gap-2"><Zap size={14} className="text-orange-500" /><span className="text-xs font-bold text-orange-700 dark:text-orange-400">Pending</span></div>
                 <span className="text-sm font-black text-orange-600 dark:text-orange-400">{pendingCount}</span>
              </div>
           </div>

           <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden mb-5">
              <div className={`h-full rounded-full transition-all duration-700 ${isFull ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`} style={{ width: `${percent}%` }} />
           </div>

           {!isPast && (
             <div className="flex gap-2">
               {onManage && (
                 <button onClick={(e) => { e.stopPropagation(); onManage(event); }} className="flex-1 py-3 bg-gray-900 dark:bg-amber-500/10 text-white dark:text-amber-400 rounded-xl font-bold text-xs hover:bg-gray-800 dark:hover:bg-amber-500/20 transition-colors flex items-center justify-center gap-2 border border-gray-900 dark:border-amber-500/20">
                   ⚙️ Dashboard
                 </button>
               )}
               {onChat && (
                 <button onClick={(e) => { e.stopPropagation(); onChat(event); }} className="px-5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold hover:bg-indigo-100 transition-colors flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
                   💬
                 </button>
               )}
             </div>
           )}
        </div>
      </div>
    );
  }

  // ========================================
  // VARIANT: JOINED — Card for "Events I Joined"
  // ========================================
  if (variant === 'joined') {
    const statusConfig = {
      approved: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-500/20', label: 'APPROVED', icon: 'bg-emerald-500' },
      pending: { bg: 'bg-orange-50 dark:bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-500/20', label: 'PENDING', icon: 'bg-orange-500' },
      rejected: { bg: 'bg-red-50 dark:bg-red-500/10', text: 'text-red-600 dark:text-red-400', border: 'border-red-200 dark:border-red-500/20', label: 'DECLINED', icon: 'bg-red-500' },
      waitlisted: { bg: 'bg-purple-50 dark:bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-500/20', label: 'WAITLISTED', icon: 'bg-purple-500' },
    };
    const st = statusConfig[myStatus] || statusConfig.pending;

    return (
      <div className={`bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-xl shadow-indigo-900/5 dark:shadow-none overflow-hidden transition-all hover:border-indigo-200 dark:hover:border-indigo-500/30 group ${isPast ? 'opacity-70' : ''}`}>
        <div className={`h-2 w-full ${isPast ? (isCompleted ? 'bg-emerald-500' : 'bg-red-500') : st.icon.replace('bg-', 'bg-')}`} />
        
        <div className="p-5 sm:p-6">
           <div className="flex justify-between items-start mb-3">
              <div className="flex-1 pr-4">
                 <h4 className="text-lg font-black text-gray-900 dark:text-white leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors cursor-pointer" onClick={onClick}>{event.title}</h4>
                 <div className="flex items-center gap-2 text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mt-2 block">
                    <Calendar size={12} className="inline mr-0.5 text-indigo-400" /> {monthShort} {dayNum} <span className="mx-1 text-gray-300 dark:text-slate-700">|</span> <Clock size={12} className="inline mr-0.5 text-purple-400" /> {event.time}
                 </div>
              </div>
              {!isPast ? (
                <span className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${st.bg} ${st.text} ${st.border}`}>
                  {st.label}
                </span>
              ) : (
                <span className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${isCompleted ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10' : 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10'}`}>
                  {isCompleted ? 'COMPLETED' : 'CANCELLED'}
                </span>
              )}
           </div>

           {/* Location & Host block */}
           <div className="flex flex-col gap-2 mb-5">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-gray-100 dark:border-slate-700/50">
                 <Crown size={16} className="text-amber-500 shrink-0" />
                 <span className="truncate flex-1">{event.creator?.name || 'Authorized Host'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-gray-100 dark:border-slate-700/50">
                 <MapPin size={16} className="text-indigo-500 shrink-0" />
                 <span className="truncate flex-1">{event.venue || event.city}</span>
              </div>
           </div>

           {!isPast && myStatus === 'approved' && onChat && (
             <button onClick={(e) => { e.stopPropagation(); onChat(event); }} className="w-full py-3.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl font-black text-xs hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors flex items-center justify-center gap-2 border border-indigo-100 dark:border-indigo-500/20 group uppercase tracking-widest">
               <span className="text-base group-hover:scale-110 transition-transform">💬</span> Connect Lobby
             </button>
           )}

           {isPast && isCompleted && onRate && (
             <button
               onClick={(e) => { e.stopPropagation(); onRate(event); }}
               className={`w-full py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2 ${
                 event.ratedBy?.includes(currentUserId)
                   ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 cursor-default'
                   : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 border border-amber-200 dark:border-amber-500/20 group'
               }`}
               disabled={event.ratedBy?.includes(currentUserId)}
             >
               {event.ratedBy?.includes(currentUserId) ? '✅ FEEDBACK SUBMITTED' : (<><Star size={16} className="group-hover:fill-amber-400 transition-colors" /> RATE YOUR EXPERIENCE</>)}
             </button>
           )}
        </div>
      </div>
    );
  }

  return null;
};

export default EventCard;
