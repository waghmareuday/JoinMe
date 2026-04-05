import React, { useState } from 'react';
import { X, MapPin, Calendar, Clock, Users, DollarSign, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utility/api';
import { CITIES, CATEGORIES } from '../constants/cities';

const PostEventModal = ({ open, onClose, defaultCategory = '', defaultCity = '' }) => {
  if (!open) return null;

  // --- Form State ---
  const [category, setCategory] = useState(defaultCategory || 'Cricket');
  const [city, setCity] = useState(defaultCity);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(''); 
  const [time, setTime] = useState(''); 
  const [venue, setVenue] = useState('');
  const [requiredPeople, setRequiredPeople] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState(''); 
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title || !city || !date || !time || !venue || !requiredPeople) {
      toast.error("Please fill in all required fields (Title, City, Date, Time, Venue, People)");
      return;
    }
    if (new Date(`${date}T${time}`) <= new Date()) {
      toast.error("Event date/time must be in the future");
      return;
    }

    setLoading(true);
    try {
      const eventData = {
        title,
        description, 
        category,
        city,
        venue,
        date,
        time,
        requiredPeople: Number(requiredPeople),
        isPaid,
        amount: isPaid ? Number(amount) : 0,
        notes 
      };

      const res = await api.post('/event/create', eventData);

      if (res.data) {
        toast.success('Event Posted Successfully! 🚀');
        onClose(); 
      }
    } catch (error) {
      console.error("Create event error:", error);
      toast.error(error.response?.data?.message || "Failed to post event");
    } finally {
      setLoading(false);
    }
  };

  return (
    // 🟢 FIX 1: Switched to z-[100] and CSS Grid for flawless mathematical centering
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 backdrop-blur-sm p-4 sm:p-0">
      
      {/* 🟢 FIX 2: Bulletproof width (w-[95%] for mobile, max-w-[500px] for desktop) */}
      <div className="bg-white dark:bg-slate-900 w-[95%] max-w-[500px] mx-auto rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-800 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Post New Event</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X size={20} className="text-gray-500 dark:text-slate-400" />
          </button>
        </div>

        {/* 🟢 FIX 3: Removed custom-scrollbar class that was causing the purple UI glitch */}
        <div className="p-6 overflow-y-auto w-full">
          <div className="space-y-4">
            
            {/* Category & City Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Category</label>
                <select 
                  value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">City</label>
                <select 
                  value={city} onChange={e => setCity(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                >
                  {CITIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Event Title *</label>
              <input 
                value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Ex: Sunday Morning Cricket Match"
                className="w-full p-2.5 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

             {/* Description */}
             <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Description</label>
              <textarea 
                value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Brief details about the plan..."
                rows="2"
                className="w-full p-2.5 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              />
            </div>

            {/* Date & Time Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Date *</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 text-gray-400" size={16} />
                  <input 
                    type="date" 
                    value={date} 
                    onChange={e => setDate(e.target.value)}
                    className="w-full pl-10 p-2.5 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Time *</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 text-gray-400" size={16} />
                  <input 
                    type="time" 
                    value={time} 
                    onChange={e => setTime(e.target.value)}
                    className="w-full pl-10 p-2.5 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Venue */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Venue / Location *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400" size={16} />
                <input 
                  value={venue} onChange={e => setVenue(e.target.value)}
                  placeholder="Ex: Turf Club, Civil Lines"
                  className="w-full pl-10 p-2.5 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* People & Payment Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Required People *</label>
                <div className="relative">
                  <Users className="absolute left-3 top-3 text-gray-400" size={16} />
                  <input 
                    type="number" 
                    value={requiredPeople} onChange={e => setRequiredPeople(e.target.value)}
                    placeholder="Ex: 5"
                    className="w-full pl-10 p-2.5 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
              
              <div className="flex flex-col justify-center">
                 <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsPaid(!isPaid)}>
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${isPaid ? 'bg-indigo-600 border-indigo-600' : 'border-gray-400'}`}>
                        {isPaid && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <label className="text-sm text-gray-700 dark:text-slate-300 cursor-pointer">Paid Event?</label>
                 </div>
              </div>
            </div>

            {/* Amount */}
            {isPaid && (
              <div className="animate-fade-in-down">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Amount per person (₹)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 text-gray-400" size={16} />
                  <input 
                    type="number" 
                    value={amount} onChange={e => setAmount(e.target.value)}
                    placeholder="Ex: 200"
                    className="w-full pl-10 p-2.5 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-green-50 dark:bg-green-900/20"
                  />
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Additional Notes</label>
              <div className="relative">
                 <FileText className="absolute left-3 top-3 text-gray-400" size={16} />
                 <textarea 
                   value={notes} onChange={e => setNotes(e.target.value)}
                   placeholder="Ex: Bring your own kit, meet at Gate 2..."
                   rows="2"
                   className="w-full pl-10 p-2.5 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                 />
              </div>
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800 flex gap-3 justify-end flex-shrink-0">
          <button 
            onClick={onClose} 
            className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-gray-800 dark:hover:text-white border border-transparent hover:border-gray-200 dark:hover:border-slate-600 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={loading}
            className="px-6 py-2.5 text-sm font-medium bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100"
          >
            {loading ? 'Posting...' : '🚀 Post Event'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default PostEventModal;
