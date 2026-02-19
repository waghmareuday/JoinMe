import React, { useState } from 'react';
import { useUser } from '../context/userContext';
import { Star, MapPin, Briefcase, Mail, User as UserIcon, Edit2, Save, X, ShieldCheck, Calendar, Users, Award } from 'lucide-react';
import api from '../utility/api';

const Profile = () => {
  const { user, setUser } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Local state for the form (Now includes age and gender)
  const [formData, setFormData] = useState({
    bio: user?.bio || '',
    city: user?.city || '',
    profession: user?.profession || '',
    age: user?.age || '',
    gender: user?.gender || ''
  });

  if (!user) {
    return <div className="min-h-screen flex justify-center items-center text-indigo-600 font-bold">Loading Profile...</div>;
  }

  const userInitial = user.name.charAt(0).toUpperCase();
  const displayRating = user.averageRating > 0 ? user.averageRating.toFixed(1) : 'New';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await api.put('/user/profile', formData);
      if (res.data.success) {
        setUser(res.data.user);
        setIsEditing(false);
      }
    } catch (error) {
      alert("Failed to update profile");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* HEADER CARD */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-40 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
             <div className="absolute inset-0 bg-black/10"></div>
          </div>
          
          <div className="px-8 pb-8 relative">
            <div className="flex justify-between items-end -mt-16 mb-4">
              <div className="w-32 h-32 rounded-full bg-white p-2 shadow-lg">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center text-indigo-600 text-5xl font-black shadow-inner border border-indigo-100">
                  {userInitial}
                </div>
              </div>
              
              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="bg-white text-gray-700 hover:bg-gray-50 px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm border border-gray-200 transition-all active:scale-95"
                >
                  <Edit2 size={16} /> Edit Profile
                </button>
              ) : (
                <div className="flex gap-3">
                  <button 
                    onClick={() => { setIsEditing(false); setFormData({ bio: user.bio, city: user.city, profession: user.profession, age: user.age, gender: user.gender }); }}
                    className="bg-gray-100 text-gray-600 hover:bg-gray-200 px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all"
                  >
                    <X size={16} /> Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-70 px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-md transition-all active:scale-95"
                  >
                    <Save size={16} /> {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
                  {user.name}
                  {user.averageRating >= 4.5 && user.totalRatings >= 5 && (
                    <ShieldCheck className="text-blue-500 fill-blue-50" size={24} title="Verified Super Host" />
                  )}
                </h1>
                <p className="text-gray-500 font-medium mt-1 flex items-center gap-2">
                  <Mail size={14} /> {user.email}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center bg-yellow-50 px-4 py-2 rounded-2xl border border-yellow-100">
                  <span className="text-xs font-bold text-yellow-600 uppercase tracking-wider mb-0.5">Trust Score</span>
                  <div className="flex items-center gap-1.5">
                    <Star className="text-yellow-500 fill-yellow-500" size={18} />
                    <span className="font-extrabold text-yellow-700 text-lg">{displayRating}</span>
                  </div>
                </div>
                <div className="flex flex-col items-center bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5">Reviews</span>
                  <div className="flex items-center gap-1.5">
                    <Award className="text-gray-400" size={18} />
                    <span className="font-extrabold text-gray-700 text-lg">{user.totalRatings || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT: About Me */}
          <div className="lg:col-span-2 bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 h-fit">
            <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
              <UserIcon className="text-indigo-500" size={20} /> About Me
            </h3>
            
            {isEditing ? (
              <textarea 
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Write a short bio about yourself..."
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none h-40 transition-all"
              />
            ) : (
              <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 min-h-[160px]">
                <p className="text-gray-600 leading-relaxed text-[15px]">
                  {user.bio || "No bio added yet. Click 'Edit Profile' to let people know a bit about you!"}
                </p>
              </div>
            )}
          </div>

          {/* RIGHT: Details Grid */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-5">Personal Details</h3>
            
            <div className="space-y-5">
              
              {/* City */}
              <div className="flex items-center gap-4">
                <div className="bg-red-50 p-3 rounded-xl text-red-500"><MapPin size={18} /></div>
                <div className="flex-1">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">City</p>
                  {isEditing ? (
                    <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-400 transition-colors" />
                  ) : (
                    <p className="text-sm font-bold text-gray-800 mt-0.5">{user.city}</p>
                  )}
                </div>
              </div>

              {/* Profession */}
              <div className="flex items-center gap-4">
                <div className="bg-purple-50 p-3 rounded-xl text-purple-500"><Briefcase size={18} /></div>
                <div className="flex-1">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Profession</p>
                  {isEditing ? (
                    <input type="text" name="profession" value={formData.profession} onChange={handleChange} className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-400 transition-colors" />
                  ) : (
                    <p className="text-sm font-bold text-gray-800 mt-0.5">{user.profession || 'Not specified'}</p>
                  )}
                </div>
              </div>

              {/* Age */}
              <div className="flex items-center gap-4">
                <div className="bg-green-50 p-3 rounded-xl text-green-500"><Calendar size={18} /></div>
                <div className="flex-1">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Age</p>
                  {isEditing ? (
                    <input type="number" name="age" value={formData.age} onChange={handleChange} className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-400 transition-colors" />
                  ) : (
                    <p className="text-sm font-bold text-gray-800 mt-0.5">{user.age} years old</p>
                  )}
                </div>
              </div>

              {/* Gender */}
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 p-3 rounded-xl text-blue-500"><Users size={18} /></div>
                <div className="flex-1">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Gender</p>
                  {isEditing ? (
                    <select name="gender" value={formData.gender} onChange={handleChange} className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-400 transition-colors">
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <p className="text-sm font-bold text-gray-800 mt-0.5">{user.gender}</p>
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;