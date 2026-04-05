import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import api from '../utility/api';

// 🟢 FIX 1: Make sure eventId is accepted as a prop here!
const RatingModal = ({ targetUser, eventId, onClose, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(false);

  if (!targetUser) return null;

  const handleSubmit = async () => {
    if (rating === 0) return alert("Please select a rating first!");
    
    setLoading(true);
    try {
      // 🟢 FIX 2: Send the eventId in the payload
      const res = await api.post('/user/rate', {
        targetUserId: typeof targetUser === 'object' ? targetUser._id : targetUser,
        rating: rating,
        eventId: eventId 
      });
      
      if (res.data.success) {
        onSuccess(); // Triggers the alert and Dashboard refresh
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to submit rating.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const hostName = typeof targetUser === 'object' && targetUser.name ? targetUser.name.split(' ')[0] : 'the host';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden relative border border-gray-100 dark:border-slate-800 p-6 flex flex-col items-center text-center">
        
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-50 dark:bg-slate-800 rounded-full text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 transition-all">
          <X size={18} />
        </button>

        <div className="w-16 h-16 bg-yellow-50 dark:bg-yellow-500/10 rounded-full flex items-center justify-center mb-4 border border-yellow-100 dark:border-yellow-500/20">
          <Star size={32} className="text-yellow-500 fill-yellow-500" />
        </div>

        <h2 className="text-xl font-extrabold text-gray-800 dark:text-white mb-1">Rate {hostName}</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">How was your experience at this event?</p>

        {/* STAR RATING UI */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className="focus:outline-none transition-transform hover:scale-110"
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
            >
              <Star
                size={36}
                className={`transition-colors duration-200 ${
                  star <= (hoverRating || rating)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-200 dark:text-slate-600'
                }`}
              />
            </button>
          ))}
        </div>

        <button 
          onClick={handleSubmit}
          disabled={loading || rating === 0}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95"
        >
          {loading ? 'Submitting...' : 'Submit Rating'}
        </button>

      </div>
    </div>
  );
};

export default RatingModal;