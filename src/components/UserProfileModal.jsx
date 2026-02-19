import React, { useState, useEffect } from 'react';
import { X, Star, MapPin, Briefcase, User as UserIcon, ShieldCheck, Quote } from 'lucide-react';
import api from '../utility/api';

const UserProfileModal = ({ userId, onClose }) => {
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/user/public/${userId}`);
        if (res.data.success) setProfileUser(res.data.user);
      } catch (error) {
        console.error("Failed to load user profile");
      } finally { setLoading(false); }
    };
    if (userId) fetchProfile();
  }, [userId]);

  if (!userId) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-0">
      
      {/* 🟢 CRITICAL FIX: overflow-y-auto and max-h-[85vh] prevents vertical cut-off */}
      <div className="bg-white w-[90%] sm:w-full max-w-sm rounded-[2rem] shadow-2xl relative border border-gray-100 overflow-y-auto max-h-[85vh] custom-scrollbar">
        
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-md z-20 transition-all"
        >
          <X size={18} />
        </button>

        {loading ? (
          <div className="h-72 flex flex-col items-center justify-center gap-3">
             <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        ) : profileUser ? (
          <>
            <div className="h-32 bg-gradient-to-br from-indigo-500 to-purple-600 relative shrink-0"></div>
            
            <div className="px-6 pb-6 relative text-center">
              <div className="w-24 h-24 mx-auto rounded-full bg-white p-1 shadow-xl -mt-12 mb-3 relative z-10">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center text-indigo-600 text-3xl font-black shadow-inner">
                  {profileUser.name.charAt(0).toUpperCase()}
                </div>
                {profileUser.averageRating >= 4.5 && profileUser.totalRatings >= 5 && (
                  <div className="absolute bottom-0 right-0 bg-white rounded-full p-0.5 shadow-md">
                    <ShieldCheck className="text-blue-500 fill-blue-50" size={20} />
                  </div>
                )}
              </div>

              <h3 className="text-xl font-black text-gray-800">{profileUser.name}</h3>
              <p className="text-xs font-bold text-gray-400 mt-1 uppercase">
                 {profileUser.age} Y/O • {profileUser.gender}
              </p>

              <div className="inline-flex items-center gap-1.5 bg-yellow-50 px-3 py-1.5 rounded-xl border border-yellow-100 mt-4 shadow-sm">
                <Star className="text-yellow-500 fill-yellow-500" size={14} />
                <span className="font-black text-yellow-700">{profileUser.averageRating > 0 ? profileUser.averageRating.toFixed(1) : 'New'}</span>
                <span className="text-xs text-yellow-600 font-bold ml-1">({profileUser.totalRatings || 0})</span>
              </div>
            </div>

            <div className="px-6 pb-8 space-y-4 text-left border-t border-gray-50 pt-5">
              <div className="bg-gray-50 p-4 rounded-2xl relative shadow-sm">
                <Quote size={20} className="absolute -top-3 -left-1 text-indigo-200 fill-indigo-50 rotate-180" />
                <p className="text-sm text-gray-600 italic font-medium relative z-10 leading-relaxed pl-2">
                  "{profileUser.bio || "Hi there! I'm looking forward to joining some great events."}"
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 text-sm text-gray-700 font-bold">
                  <div className="bg-red-50 p-2 rounded-xl text-red-500"><MapPin size={16} /></div>
                  {profileUser.city}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700 font-bold">
                  <div className="bg-indigo-50 p-2 rounded-xl text-indigo-500"><Briefcase size={16} /></div>
                  {profileUser.profession || 'Not provided'}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <p className="text-red-500 font-bold">User not found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfileModal;