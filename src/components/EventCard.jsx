import React, { useState } from 'react';
import { Users, Star } from 'lucide-react';
import UserProfileModal from './UserProfileModal';

const EventCard = ({ event = {}, bgImage, onClick }) => {
  // 🟢 1. Modal State for the Host Profile
  const [viewProfileId, setViewProfileId] = useState(null);

  // 2. Calculate Spots based ONLY on 'approved' requests
  const capacity = typeof event.requiredPeople === 'number' ? event.requiredPeople : (event.requiredPeople || 0);
  const approvedCount = event.requests ? event.requests.filter(r => r.status === 'approved').length : 0;
  
  const spotsLeft = Math.max(0, capacity - approvedCount);
  const percent = capacity > 0 ? Math.min(100, Math.round((approvedCount / capacity) * 100)) : 0;
  const isFull = spotsLeft <= 0;

  const getCreatorId = (creator) => {
    if (!creator) return null;
    if (typeof creator === 'string') return creator;
    if (creator._id) return String(creator._id);
    return null;
  };

  return (
    <>
      <div
        className="relative h-72 sm:h-80 rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg bg-white/5 backdrop-blur-md border border-white/10 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl cursor-pointer group flex flex-col"
        onClick={onClick} 
        tabIndex={0}
        role="button"
        aria-label={`Open event: ${event.title || 'event'}`}
      >
        {/* Background Image */}
        {bgImage && (
          <img
            src={bgImage}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-105"
          />
        )}

        {/* Content Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/20 p-4 sm:p-6 flex flex-col justify-between transition-all duration-300">
          
          {/* Top Section */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {/* Title & Details */}
              <h3 className="text-white text-lg sm:text-xl font-black drop-shadow-md truncate tracking-tight">{event.title}</h3>
              <div className="text-xs sm:text-sm text-gray-300 mt-1 truncate font-medium drop-shadow-sm">
                {event.venue || '--'} • {event.date ? new Date(event.date).toLocaleDateString('en-GB') : '--'}
              </div>

              {/* Clickable Host Name & Rating */}
              <div className="mt-2 flex flex-col items-start gap-1.5">
                <div className="text-xs text-gray-300 truncate">
                  Hosted by {' '}
                  <span 
                    className="font-extrabold text-indigo-400 cursor-pointer hover:text-indigo-300 hover:underline relative z-10"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation(); 
                      
                      const creatorId = getCreatorId(event.creator);
                      if (creatorId) {
                        setViewProfileId(creatorId);
                      } else {
                        alert("Host information is unavailable for this older event.");
                      }
                    }}
                  >
                    {event.creator?.name || 'Unknown User'}
                  </span>
                </div>
                
                {/* Host Rating Badge */}
                {event.creator?.averageRating > 0 && (
                  <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs bg-black/50 px-2 sm:px-3 py-1 rounded-full border border-white/10 backdrop-blur-md">
                    <Star size={12} className="text-yellow-400 fill-yellow-400" /> 
                    <strong className="text-white">{event.creator.averageRating.toFixed(1)}</strong> 
                    <span className="text-gray-400">
                      ({event.creator.totalRatings})
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Top Right Badges */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              {isFull ? (
                <span className="text-[10px] sm:text-xs font-black bg-red-500/90 text-white px-2.5 py-1 rounded-full shadow-sm border border-red-400/50 tracking-wider">
                  FULL
                </span>
              ) : (
                <span className="text-[10px] sm:text-xs font-black bg-green-500/90 text-white px-2.5 py-1 rounded-full shadow-sm border border-green-400/50 tracking-wider">
                  OPEN
                </span>
              )}
              <div className="text-[10px] sm:text-xs text-white/90 font-bold bg-black/40 px-2 py-1 rounded-md backdrop-blur-md border border-white/5">
                {event.city || '--'}
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="flex items-end justify-between gap-4 mt-4">
            
            {/* Progress Bar & User Count */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-white/90 mb-2 truncate">
                <Users size={16} className="text-indigo-400 shrink-0" />
                <span className="font-bold truncate">{approvedCount} / {capacity} Joined</span>
                <span className="text-[10px] sm:text-xs text-gray-400 font-bold shrink-0">• {spotsLeft} left</span>
              </div>
              <div className="w-full h-1.5 sm:h-2 bg-white/10 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-indigo-500 transition-all duration-1000 ease-out rounded-full" style={{ width: `${percent}%` }} />
              </div>
            </div>

            {/* Call to Action Button */}
            <div className="shrink-0">
              {event.isPaid ? (
                 <span className="inline-flex items-center justify-center px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-black rounded-xl bg-green-500 text-white shadow-lg border border-green-400/50 tracking-wide">
                   ₹{event.amount || '--'}
                 </span>
              ) : (
                 <button
                  className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black shadow-lg transition-all tracking-wide ${
                    isFull 
                      ? 'bg-gray-600/80 text-white/60 cursor-not-allowed border border-white/10' 
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/50'
                  }`}
                >
                  {isFull ? 'Sold Out' : 'View'}
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* 🟢 RENDER THE PROFILE MODAL OUTSIDE THE CLICKABLE CARD AREA */}
      {viewProfileId && (
         <UserProfileModal userId={viewProfileId} onClose={() => setViewProfileId(null)} />
      )}
    </>
  );
};

export default EventCard;