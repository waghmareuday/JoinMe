import React, { useState, useEffect } from 'react';
import { X, Star, MapPin, Briefcase, User as UserIcon, ShieldCheck } from 'lucide-react';
import api from '../utility/api';

const UserProfileModal = ({ userId, onClose }) => {
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/user/public/${userId}`);
        if (res.data.success) {
          setProfileUser(res.data.user);
        }
      } catch (error) {
        console.error("Failed to load user profile");
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchProfile();
  }, [userId]);

  if (!userId) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden relative border border-gray-100 transform transition-all">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-md z-10 transition-all"
        >
          <X size={18} />
        </button>

        {loading ? (
          <div className="h-64 flex items-center justify-center text-indigo-500 font-bold animate-pulse">
            Loading Profile...
          </div>
        ) : profileUser ? (
          <>
            {/* Header / Avatar */}
            <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 relative"></div>
            
            <div className="px-6 pb-8 relative text-center">
              <div className="w-24 h-24 mx-auto rounded-full bg-white p-1.5 shadow-lg -mt-12 mb-3 relative">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-600 text-3xl font-black shadow-inner border border-indigo-50">
                  {profileUser.name.charAt(0).toUpperCase()}
                </div>
                {profileUser.averageRating >= 4.5 && profileUser.totalRatings >= 5 && (
                  <div className="absolute bottom-0 right-0 bg-white rounded-full p-0.5 shadow-sm">
                    <ShieldCheck className="text-blue-500 fill-blue-50" size={20} />
                  </div>
                )}
              </div>

              <h3 className="text-xl font-extrabold text-gray-900">{profileUser.name}</h3>
              <p className="text-sm font-medium text-gray-500 mt-0.5 flex items-center justify-center gap-1">
                 {profileUser.age} y/o • {profileUser.gender}
              </p>

              {/* Trust Badge */}
              <div className="inline-flex items-center gap-1.5 bg-yellow-50 px-3 py-1.5 rounded-xl border border-yellow-100 mt-4">
                <Star className="text-yellow-500 fill-yellow-500" size={16} />
                <span className="font-bold text-yellow-700">{profileUser.averageRating > 0 ? profileUser.averageRating.toFixed(1) : 'New'}</span>
                <span className="text-xs text-yellow-600 font-medium ml-1">({profileUser.totalRatings || 0} reviews)</span>
              </div>
            </div>

            {/* Details Section */}
            <div className="px-6 pb-6 space-y-4 text-left">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <p className="text-sm text-gray-600 italic">
                  "{profileUser.bio || "Hi there! I'm looking forward to joining some great events."}"
                </p>
              </div>

              <div className="flex flex-col gap-3 px-2">
                <div className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                  <div className="bg-red-50 p-1.5 rounded-lg text-red-500"><MapPin size={16} /></div>
                  {profileUser.city}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                  <div className="bg-purple-50 p-1.5 rounded-lg text-purple-500"><Briefcase size={16} /></div>
                  {profileUser.profession || 'Profession hidden'}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="h-64 flex items-center justify-center text-red-500 font-bold">
            User not found.
          </div>
        )}

      </div>
    </div>
  );
};

export default UserProfileModal;