import React, { useState, useEffect } from 'react';
import { X, Star, MapPin, Briefcase, User as UserIcon, ShieldCheck, Quote, Flag, Ban, Award, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utility/api';
import { useUser } from '../context/userContext';
import FollowButton from './FollowButton';
import { BadgeRow } from './BadgeDisplay';

const UserProfileModal = ({ userId, onClose }) => {
  const { user: currentUser } = useUser();
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reporting, setReporting] = useState(false);
  const [reportReason, setReportReason] = useState('');

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
      <div className="bg-white dark:bg-slate-900 w-[90%] sm:w-full max-w-sm rounded-[2rem] shadow-2xl relative border border-gray-100 dark:border-slate-800 overflow-y-auto max-h-[85vh] custom-scrollbar">
        
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
            <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-500 relative shrink-0">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-10 mix-blend-overlay"></div>
            </div>
            
            <div className="px-6 pb-6 relative text-center">
              <div className="w-28 h-28 mx-auto bg-white dark:bg-slate-900 p-1.5 shadow-xl -mt-16 sm:-mt-14 mb-4 relative z-10 rounded-[24px]">
                <div className="w-full h-full rounded-[18px] bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-4xl font-black shadow-inner border border-indigo-100 dark:border-indigo-800/50">
                  {profileUser.name.charAt(0).toUpperCase()}
                </div>
                {profileUser.averageRating >= 4.5 && profileUser.totalRatings >= 5 && (
                  <div className="absolute bottom-0 right-0 bg-white dark:bg-slate-900 rounded-full p-0.5 shadow-md">
                    <ShieldCheck className="text-blue-500 fill-blue-50 dark:fill-blue-900/20" size={24} />
                  </div>
                )}
              </div>

              <h3 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">{profileUser.name}</h3>
              <p className="text-[11px] font-bold text-gray-400 dark:text-slate-500 mt-1.5 uppercase tracking-widest">
                 {profileUser.age} Y/O • {profileUser.gender}
              </p>

              <div className="inline-flex items-center gap-1.5 bg-yellow-50 dark:bg-yellow-500/10 px-3 py-1.5 rounded-xl border border-yellow-100 dark:border-yellow-500/20 mt-4 shadow-sm">
                <Star className="text-yellow-500 fill-yellow-500" size={14} />
                <span className="font-black text-yellow-700 dark:text-yellow-400">{profileUser.averageRating > 0 ? profileUser.averageRating.toFixed(1) : 'New'}</span>
                <span className="text-xs text-yellow-600 dark:text-yellow-500 font-bold ml-1">({profileUser.totalRatings || 0})</span>
              </div>

              {/* Trust Score + Stats */}
              <div className="flex items-center justify-center gap-4 mt-3">
                {profileUser.trustScore !== undefined && (
                  <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                    <Award size={12} /> Trust: {profileUser.trustScore}%
                  </div>
                )}
                {(profileUser.eventsHosted > 0 || profileUser.eventsCompleted > 0) && (
                  <div className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-lg border border-green-100">
                    <Calendar size={12} /> {profileUser.eventsHosted || 0} hosted · {profileUser.eventsCompleted || 0} done
                  </div>
                )}
              </div>

              {/* Follow Button */}
              {currentUser && String(currentUser._id) !== String(userId) && (
                <div className="mt-4">
                  <FollowButton targetUserId={userId} />
                </div>
              )}

              {/* Badges Row */}
              <div className="mt-3">
                <BadgeRow userId={userId} />
              </div>
            </div>

            <div className="px-6 pb-8 space-y-5 text-left border-t border-gray-100 dark:border-slate-800 pt-6">
              
              <div className="bg-gray-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-gray-100 dark:border-slate-700/50 shadow-sm relative">
                <Quote size={24} className="absolute -top-3 -left-2 text-indigo-100 dark:text-indigo-900/40 fill-indigo-50 dark:fill-indigo-900/20 rotate-180" />
                <p className="text-[15px] text-gray-700 dark:text-slate-300 font-medium relative z-10 leading-relaxed">
                  "{profileUser.bio || "Hi there! I'm looking forward to joining some great events."}"
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4 text-[15px] text-gray-800 dark:text-slate-200 font-bold bg-white dark:bg-slate-900 p-3 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
                  <div className="bg-red-50 dark:bg-red-500/10 p-2.5 rounded-xl text-red-500 dark:text-red-400"><MapPin size={18} /></div>
                  <div className="flex flex-col">
                     <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">Base City</span>
                     {profileUser.city}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-[15px] text-gray-800 dark:text-slate-200 font-bold bg-white dark:bg-slate-900 p-3 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
                  <div className="bg-indigo-50 dark:bg-indigo-500/10 p-2.5 rounded-xl text-indigo-500 dark:text-indigo-400"><Briefcase size={18} /></div>
                  <div className="flex flex-col">
                     <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">Profession</span>
                     {profileUser.profession || 'Not provided'}
                  </div>
                </div>
              </div>

              {/* Report / Block - only show for other users */}
              {currentUser && String(currentUser._id) !== String(userId) && (
                <div className="pt-4 border-t border-gray-100 space-y-3">
                  {!reporting ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setReporting(true)}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-gray-500 hover:text-red-500 hover:bg-red-50 p-2.5 rounded-xl border border-gray-200 transition-all"
                      >
                        <Flag size={14} /> Report
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await api.post('/report/block', { blockedUserId: userId });
                            toast.success('User blocked');
                          } catch(err) {
                            toast.error(err.response?.data?.message || 'Failed to block user');
                          }
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 p-2.5 rounded-xl border border-gray-200 transition-all"
                      >
                        <Ban size={14} /> Block
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <select
                        value={reportReason}
                        onChange={e => setReportReason(e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-red-500 outline-none"
                      >
                        <option value="">Select reason...</option>
                        <option value="spam">Spam</option>
                        <option value="harassment">Harassment</option>
                        <option value="fake_profile">Fake Profile</option>
                        <option value="inappropriate">Inappropriate</option>
                        <option value="other">Other</option>
                      </select>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setReporting(false)}
                          className="flex-1 text-xs font-bold text-gray-500 p-2.5 rounded-xl border border-gray-200"
                        >Cancel</button>
                        <button
                          onClick={async () => {
                            if (!reportReason) return toast.error('Select a reason');
                            try {
                              await api.post('/report', { reportedUserId: userId, reason: reportReason });
                              toast.success('Report submitted');
                              setReporting(false);
                            } catch(err) {
                              toast.error(err.response?.data?.message || 'Failed to report');
                            }
                          }}
                          className="flex-1 text-xs font-bold text-white bg-red-500 hover:bg-red-600 p-2.5 rounded-xl transition-all"
                        >Submit</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
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