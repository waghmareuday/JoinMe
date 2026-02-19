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
  // 🔬 SCIENTIFIC DIAGNOSTIC LOG
  console.log(`Event: ${event.title}`, "Creator Data:", event.creator);

  const getCreatorId = (creator) => {
    if (!creator) return null;
    if (typeof creator === 'string') return creator;
    if (creator._id) return String(creator._id);
    return null;
  };

  return (
    <>
      <div
        className="relative h-80 rounded-3xl overflow-hidden shadow-2xl bg-white/5 backdrop-blur-md border border-white/10 transform transition-transform duration-300 hover:scale-[1.02] hover:shadow-2xl cursor-pointer group"
        onClick={onClick} // This triggers the Modals in Dashboard.jsx
        tabIndex={0}
        role="button"
        aria-label={`Open event: ${event.title || 'event'}`}
      >
        {/* Background Image */}
        {bgImage && (
          <img
            src={bgImage}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity duration-300"
          />
        )}

        {/* Content Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 flex flex-col justify-between">
          
          {/* Top Section */}
          <div className="flex items-start justify-between">
            <div className="min-w-0 pr-4">
              <h3 className="text-white text-xl font-bold drop-shadow-md truncate">{event.title}</h3>
              <div className="text-sm text-gray-200 mt-2 truncate font-medium">
                {event.venue || '--'} • {event.date ? new Date(event.date).toLocaleDateString('en-GB') : '--'}
              </div>

              {/* 🟢 NEW: Clickable Host Name */}
<div className="text-sm text-gray-300 mt-1 truncate">
                Hosted by {' '}
                <span 
                  className="font-bold text-indigo-400 cursor-pointer hover:text-indigo-300 hover:underline relative z-10"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation(); // Stops the event card from opening
                    
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

              {/* Optional Host Rating Badge */}
            
{/* Optional Host Rating Badge */}
              {event.creator?.averageRating > 0 && (
                <div className="mt-3 inline-flex items-center gap-2 text-sm bg-black/40 px-3 py-1.5 rounded-full border border-white/10">
                  <Star size={14} className="text-yellow-400 fill-yellow-400" /> 
                  <strong className="text-white">{event.creator.averageRating.toFixed(1)}</strong> 
                  <span className="text-gray-300 text-xs">
                    Trusted Host ({event.creator.totalRatings})
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col items-end gap-2">
              {/* Dynamic Status Badge */}
              {isFull ? (
                <span className="text-xs font-bold bg-red-500/90 text-white px-3 py-1 rounded-full shadow border border-red-400/50">
                  FULL
                </span>
              ) : (
                <span className="text-xs font-bold bg-green-500/90 text-white px-3 py-1 rounded-full shadow border border-green-400/50">
                  OPEN
                </span>
              )}
              <div className="text-xs text-white/90 font-medium bg-black/30 px-2 py-1 rounded-md backdrop-blur-sm">
                {event.city || '--'}
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="flex items-end justify-between">
            
            {/* Progress Bar & User Count */}
            <div className="w-2/3">
              <div className="flex items-center gap-3 text-sm text-white/90 mb-3">
                <Users size={18} className="text-indigo-300" />
                <span className="font-semibold">{approvedCount} / {capacity} Joined</span>
                <span className="text-xs text-gray-300 font-medium">• {spotsLeft} left</span>
              </div>
              <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-indigo-500 transition-all duration-700 ease-out" style={{ width: `${percent}%` }} />
              </div>
            </div>

            {/* Call to Action Button */}
            <div className="flex items-center gap-2">
              {event.isPaid ? (
                 <span className="px-4 py-2 text-sm font-bold rounded-xl bg-green-500/90 text-white shadow-lg border border-green-400/50">
                   ₹{event.amount || '--'}
                 </span>
              ) : (
                 <button
                  className={`px-5 py-2 rounded-xl text-sm font-bold shadow-lg transition-all ${
                    isFull 
                      ? 'bg-gray-500/80 text-white/80 cursor-not-allowed' 
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