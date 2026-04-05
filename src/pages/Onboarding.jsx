import React, { useState, useEffect } from 'react';
import { useUser } from '../context/userContext';
import api from '../utility/api';
import toast from 'react-hot-toast';
import { ArrowRight, MapPin, Briefcase, Users, Calendar, Sparkles, Compass } from 'lucide-react';
import { CITIES } from '../constants/cities';
import { useNavigate, Navigate } from 'react-router-dom';

const Onboarding = () => {
  const { user, setUser, loading: userLoading } = useUser();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    city: '',
    gender: '',
    age: '',
    profession: ''
  });
  const [loading, setLoading] = useState(false);

  // If user is already "onboarded", bounce them.
  useEffect(() => {
    const isProfileComplete = user && user.age !== 0 && user.city && user.gender && user.gender !== 'Not specified';
    if (isProfileComplete) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.city || !formData.gender || !formData.age) {
        toast.error("Please fill in the required fields to continue.");
        return;
    }
    
    setLoading(true);
    try {
      const res = await api.put('/user/profile', {
          city: formData.city,
          gender: formData.gender,
          age: Number(formData.age),
          profession: formData.profession
      });
      
      if (res.data.success) {
        setUser(res.data.user);
        toast.success("Profile complete! Welcome to your Hub.");
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to save profile.");
    } finally {
      setLoading(false);
    }
  };

  if (userLoading) {
    return <div className="min-h-screen bg-[#07091B] flex items-center justify-center text-indigo-400 font-bold">Loading Gateway...</div>;
  }

  const isProfileComplete = user && user.age !== 0 && user.city && user.gender && user.gender !== 'Not specified';
  
  // Double check in render to avoid flashes
  if (isProfileComplete) {
    return <Navigate to="/dashboard" replace />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const inputClasses = "w-full pl-12 pr-4 py-3.5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all placeholder:text-gray-400 font-medium text-sm";
  const selectClasses = "w-full px-4 py-3.5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all appearance-none font-medium text-sm cursor-pointer";

  return (
    <div className="min-h-screen bg-[#07091B] flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Immersive Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="bg-slate-900/50 backdrop-blur-2xl w-full max-w-xl rounded-[40px] shadow-2xl border border-white/10 relative overflow-hidden z-10">
        
        {/* Header Hero Section */}
        <div className="relative h-44 bg-gradient-to-br from-indigo-600/90 to-purple-800/90 px-10 py-8 flex items-end">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-10 mix-blend-overlay"></div>
           <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
           
           <div className="relative z-10 w-full mb-2">
               <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 text-white shadow-xl">
                 <Compass size={24} />
               </div>
               <div className="flex items-center gap-2 mb-1">
                 <Sparkles className="text-indigo-200" size={16} />
                 <span className="text-indigo-200 font-bold text-xs uppercase tracking-widest outline-none">Final Step</span>
               </div>
               <h2 className="text-3xl font-black text-white outline-none">Set Up Your Profile</h2>
               <p className="text-white/80 text-sm mt-1 outline-none">Unlock immersive, personalized events in your city.</p>
           </div>
        </div>

        <div className="p-10 pb-12">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Age */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Age <span className="text-indigo-500">*</span></label>
                  <div className="relative group">
                    <Calendar className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-indigo-400 transition-colors pointer-events-none" size={18} />
                    <input type="number" name="age" value={formData.age} onChange={handleChange} placeholder="e.g. 26" min="13" max="100" className={`${inputClasses} pl-12`} required />
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Gender <span className="text-indigo-500">*</span></label>
                  <div className="relative group">
                    <Users className="absolute right-4 top-3.5 text-gray-400 group-focus-within:text-indigo-400 transition-colors pointer-events-none" size={18} />
                    <select name="gender" value={formData.gender} onChange={handleChange} className={`${selectClasses} pr-12`} required>
                      <option value="" disabled className="text-gray-500">Pick one...</option>
                      <option value="Male" className="bg-[#07091B] text-white">Male</option>
                      <option value="Female" className="bg-[#07091B] text-white">Female</option>
                      <option value="Other" className="bg-[#07091B] text-white">Other</option>
                    </select>
                  </div>
                </div>
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Base City <span className="text-indigo-500">*</span></label>
              <div className="relative group">
                <MapPin className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-indigo-400 transition-colors pointer-events-none" size={18} />
                <select name="city" value={formData.city} onChange={handleChange} className={`${selectClasses} pl-12 tracking-wide font-bold`} required>
                  <option value="" disabled className="text-gray-500 font-normal">Where do you want to explore?</option>
                  {CITIES.map(city => <option key={city} value={city} className="bg-[#07091B] text-white">{city}</option>)}
                </select>
              </div>
            </div>

            {/* Profession */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex justify-between">
                <span>Profession</span>
                <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full lowercase tracking-normal">Optional</span>
              </label>
              <div className="relative group">
                <Briefcase className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-indigo-400 transition-colors pointer-events-none" size={18} />
                <input name="profession" value={formData.profession} onChange={handleChange} placeholder="e.g. UX Designer, Student..." className={`${inputClasses}`} />
              </div>
            </div>

            {/* Submit */}
            <div className="pt-4">
              <button type="submit" disabled={loading} className="w-full py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 bg-[length:200%_auto] hover:bg-[position:right_center] text-white font-black rounded-2xl text-base shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)] transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-3 group/btn">
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                  <>
                    <span className="tracking-wide">Launch Dashboard</span> 
                    <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
            
            <p className="text-center text-xs text-slate-500 font-medium">
               You can always update these details later in Settings.
            </p>

          </form>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
