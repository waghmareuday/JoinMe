import React, { useState, useMemo } from 'react';
import { useUser } from '../context/userContext';
import { Star, MapPin, Briefcase, Mail, User as UserIcon, Edit2, Save, X, ShieldCheck, Calendar, Users, Award, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';
import api from '../utility/api';
import BadgeDisplay from '../components/BadgeDisplay';
import CalendarExportButton from '../components/CalendarExportButton';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, setUser } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    bio: user?.bio || '',
    city: user?.city || '',
    profession: user?.profession || '',
    age: user?.age || '',
    gender: user?.gender || ''
  });

  // Calculate Profile Completion
  const completion = useMemo(() => {
    if (!user) return 0;
    const fields = ['bio', 'city', 'profession', 'age', 'gender'];
    const filled = fields.filter(f => user[f] && String(user[f]).trim() !== '' && user[f] !== 0);
    return Math.round((filled.length / fields.length) * 100);
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-gray-500 dark:text-slate-400 font-bold animate-pulse">Synchronizing Profile...</p>
        </div>
      </div>
    );
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
        toast.success("Profile updated perfectly!");
      }
    } catch (error) {
      toast.error("Correction failed. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] pt-20 pb-20 px-4 transition-colors duration-500">

      {/* BACKGROUND DECORATIONS */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-[120px] delay-1000 animate-pulse"></div>
      </div>

      <div className="max-w-5xl mx-auto space-y-8 relative z-10 animate-fade-in">

        {/* ─── HERO HEADER SECTION ─── */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[40px] blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>

          <div className="relative bg-white dark:bg-slate-900 rounded-[36px] shadow-2xl dark:shadow-none border border-white dark:border-slate-800/50 overflow-hidden">

            {/* Dynamic Banner */}
            <div className="h-44 sm:h-56 bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black/20 to-transparent"></div>

              {/* Mesh Gradient Overlay */}
              <div className="absolute -top-1/2 -left-1/4 w-full h-full bg-blue-400/20 rounded-full blur-[100px] animate-pulse"></div>
              <div className="absolute -bottom-1/2 -right-1/4 w-full h-full bg-purple-400/20 rounded-full blur-[100px] delay-700 animate-pulse"></div>
            </div>

            <div className="px-6 sm:px-12 pb-12">

              {/* Profile Bar (Avatar overlap) */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end -mt-20 sm:-mt-24 mb-10 gap-6">

                <div className="relative group/avatar">
                  <div className="absolute -inset-2 bg-white dark:bg-slate-900 rounded-[42px] shadow-xl"></div>
                  <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-[36px] bg-white dark:bg-slate-900 p-2 shadow-2xl z-10">
                    <div className="w-full h-full rounded-[28px] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-6xl font-black shadow-inner relative overflow-hidden group-hover/avatar:scale-[0.98] transition-transform duration-500">
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/micro-carbon.png')] opacity-10"></div>
                      <span className="relative drop-shadow-2xl">{userInitial}</span>
                    </div>
                  </div>
                  {completion === 100 && (
                    <div className="absolute -bottom-1 -right-1 bg-green-500 p-2.5 rounded-2xl shadow-lg border-4 border-white dark:border-slate-900 z-20 animate-bounce">
                      <CheckCircle2 size={24} className="text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1 w-full md:w-auto">
                  <div className="flex flex-wrap items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                          {user.name}
                        </h1>
                        {user.averageRating >= 4.5 && (
                          <div className="bg-indigo-100 dark:bg-indigo-500/20 px-3 py-1 rounded-full flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
                            <ShieldCheck size={16} className="fill-indigo-500/10" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Top Tier</span>
                          </div>
                        )}
                      </div>
                      <p className="flex items-center gap-2 text-gray-500 dark:text-slate-400 font-bold group/email transition-colors">
                        <Mail size={16} className="text-indigo-500" />
                        <span className="group-hover/email:text-indigo-600 transition-colors uppercase text-[11px] tracking-widest">{user.email}</span>
                      </p>
                    </div>

                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="group flex items-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-2xl font-black text-sm transition-all hover:scale-105 active:scale-95 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)] dark:shadow-none"
                      >
                        <Edit2 size={18} className="group-hover:rotate-12 transition-transform" /> Edit Profile
                      </button>
                    ) : (
                      <div className="flex gap-4 w-full md:w-auto">
                        <button
                          onClick={() => { setIsEditing(false); setFormData({ bio: user.bio, city: user.city, profession: user.profession, age: user.age, gender: user.gender }); }}
                          className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 px-6 py-4 rounded-2xl font-black text-sm transition-all hover:bg-gray-200 dark:hover:bg-slate-700 active:scale-95"
                        >
                          <X size={18} /> Cancel
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={loading}
                          className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-10 py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                        >
                          <Save size={18} /> {loading ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Profile Completion Meter */}
                  <div className="mt-8 bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-slate-800 max-w-md shadow-inner">
                    <div className="flex justify-between items-center mb-2.5">
                      <span className="text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Sparkles size={14} className="text-amber-500" /> Member Hub Status
                      </span>
                      <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{completion}%</span>
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden p-0.5 shadow-sm">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 bg-[length:200%_100%] animate-gradient rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all duration-1000 ease-out"
                        style={{ width: `${completion}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

              </div>

              {/* STATS STRIP */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/5 dark:to-orange-500/5 p-5 rounded-3xl border border-amber-100 dark:border-amber-500/20 group hover:scale-[1.02] transition-transform shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-2">Rating</span>
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm"><Star className="text-amber-500 fill-amber-500" size={20} /></div>
                      <span className="text-2xl font-black text-gray-900 dark:text-amber-100">{displayRating}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-500/5 dark:to-indigo-500/5 p-5 rounded-3xl border border-blue-100 dark:border-blue-500/20 group hover:scale-[1.02] transition-transform shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">Trust Score</span>
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm"><Award className="text-blue-500" size={20} /></div>
                      <span className="text-2xl font-black text-gray-900 dark:text-blue-100">{user.trustScore || 50}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-500/5 dark:to-teal-500/5 p-5 rounded-3xl border border-emerald-100 dark:border-emerald-500/20 group hover:scale-[1.02] transition-transform shadow-sm text-left">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">Events Hosted</span>
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm"><Users className="text-emerald-500" size={20} /></div>
                      <span className="text-2xl font-black text-gray-900 dark:text-emerald-100">{user.eventsHosted || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-500/5 dark:to-indigo-500/5 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 group hover:scale-[1.02] transition-transform shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Reviews</span>
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm"><Edit2 className="text-slate-500" size={20} /></div>
                      <span className="text-2xl font-black text-gray-900 dark:text-slate-100">{user.totalRatings || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ─── MAIN CONTENT GRID ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT: About & Achievements */}
          <div className="lg:col-span-2 space-y-8">

            {/* About Box */}
            <div className="bg-white dark:bg-slate-900 rounded-[36px] p-8 sm:p-10 shadow-xl dark:shadow-none border border-white dark:border-slate-800/50 group/card relative overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                  <div className="p-3 bg-indigo-500 text-white rounded-2xl shadow-lg shadow-indigo-500/20"><UserIcon size={20} /></div>
                  About Story
                </h3>
                <Sparkles size={20} className="text-indigo-200 dark:text-slate-700" />
              </div>

              {isEditing ? (
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-10 group-focus-within:opacity-30 transition duration-500"></div>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Share your join-worthy story..."
                    className="relative w-full min-h-[160px] bg-white dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700/50 rounded-2xl p-6 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-all font-medium leading-relaxed placeholder-gray-300"
                  />
                </div>
              ) : (
                <div className="relative">
                  <div className="bg-gray-50/50 dark:bg-slate-800/30 p-8 rounded-3xl border border-gray-100/50 dark:border-slate-800/50 group-hover/card:border-indigo-100 transition-colors">
                    <p className="text-gray-700 dark:text-slate-300 leading-[1.8] text-[16px] font-medium italic">
                      {user.bio ? `"${user.bio}"` : "This story is yet to be told. Click edit to bring your profile to life!"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Achievements Box */}
            <div className="bg-white dark:bg-slate-900 rounded-[36px] p-8 sm:p-10 shadow-xl dark:shadow-none border border-white dark:border-slate-800/50">
              <div className="flex flex-col sm:flex-row items-center justify-between mb-10 gap-6">
                <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                  <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-lg shadow-amber-500/20"><Award size={20} /></div>
                  Achievements
                </h3>
                <div className="hover:scale-105 transition-transform">
                  <CalendarExportButton label="Export Schedule" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6">
                <BadgeDisplay userId={user._id || user.id} />
              </div>
            </div>

          </div>

          {/* RIGHT: Personal Details */}
          <div className="space-y-8">
            <div className="bg-slate-900 text-white rounded-[40px] p-8 sm:p-10 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

              <h3 className="text-xl font-black mb-8 flex items-center gap-3 relative z-10">
                <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md"><Briefcase size={20} className="text-indigo-400" /></div>
                Member Details
              </h3>

              <div className="space-y-6 relative z-10">
                {[
                  { label: 'Location', name: 'city', icon: MapPin, val: user.city, type: 'text' },
                  { label: 'Profession', name: 'profession', icon: Briefcase, val: user.profession, type: 'text' },
                  { label: 'Age', name: 'age', icon: Calendar, val: user.age, type: 'number' },
                  { label: 'Gender', name: 'gender', icon: Users, val: user.gender, type: 'select' }
                ].map((field) => (
                  <div key={field.name} className="group/field">
                    <div className="flex items-center gap-4 mb-2 opacity-60 group-hover/field:opacity-100 transition-opacity">
                      <field.icon size={14} className="text-slate-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{field.label}</span>
                    </div>
                    {isEditing ? (
                      field.type === 'select' ? (
                        <select
                          name={field.name}
                          value={formData[field.name]}
                          onChange={handleChange}
                          className="w-full bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl px-5 py-3.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-white transition-all appearance-none cursor-pointer"
                        >
                          <option value="Male" className="bg-slate-900">Male</option>
                          <option value="Female" className="bg-slate-900">Female</option>
                          <option value="Other" className="bg-slate-900">Other</option>
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          name={field.name}
                          value={formData[field.name]}
                          onChange={handleChange}
                          className="w-full bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl px-5 py-3.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-white transition-all placeholder-white/20"
                        />
                      )
                    ) : (
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center justify-between group-hover/field:bg-white/10 transition-colors">
                        <p className="text-[15px] font-bold text-white">{field.val || '—'}</p>
                        <ChevronRight size={14} className="text-white/20" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {isEditing && (
                <div className="mt-10 p-5 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-sm animate-fade-in text-center">
                  <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-tighter">Your Hub presence updates instantly</p>
                </div>
              )}
            </div>

            {/* Help/Support Box */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-[32px] p-1 shadow-lg shadow-indigo-500/20 group hover:-translate-y-1 transition-transform">
              <div className="bg-white dark:bg-slate-900 rounded-[28px] p-6 h-full flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400 group-hover:rotate-12 transition-transform">
                  <Sparkles size={24} />
                </div>
                <h4 className="font-black text-gray-900 dark:text-white mb-1">Stay Active</h4>
                <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Hosting events boosts your Trust Score and Hub visibility.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
