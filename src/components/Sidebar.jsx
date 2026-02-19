import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Trophy, Search, Filter, X } from 'lucide-react';
import { useUser } from '../context/userContext'; 

const cities = [
  "Nagpur", "Pune", "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Jaipur"
];

const Sidebar = ({ onCityChange, onCategorySelect, categoryCounts = [], currentCategory = 'All' }) => {
  const { user } = useUser(); 
  const defaultCity = user?.city || 'Nagpur';
  const [selectedCity, setSelectedCity] = useState(defaultCity);
  
  // 🟢 NEW: Mobile Drawer State
  const [isOpen, setIsOpen] = useState(false); 

  useEffect(() => {
    setSelectedCity(user?.city || 'Nagpur');
  }, [user?.city]);

  useEffect(() => {
    if (onCityChange) onCityChange(selectedCity);
  }, [selectedCity, onCityChange]);

  // Helper to auto-close the drawer on mobile after tapping a category
  const handleCategoryClick = (cat) => {
    if (onCategorySelect) onCategorySelect(cat);
    setIsOpen(false); 
  };

  return (
    <>
      {/* 🟢 MOBILE FLOATING ACTION BUTTON */}
      <button 
        onClick={() => setIsOpen(true)} 
        className="md:hidden fixed bottom-24 right-6 z-40 bg-indigo-600 text-white p-4 rounded-full shadow-2xl hover:bg-indigo-700 hover:scale-105 transition-all flex items-center justify-center"
      >
        <Filter size={24} />
      </button>

      {/* 🟢 MOBILE DARK OVERLAY */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 🟢 THE SIDEBAR (Fixed Drawer on Mobile, Sticky on Desktop) */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 shadow-2xl p-6 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:min-h-screen md:sticky md:top-16 overflow-y-auto ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <Filter size={24} className="text-indigo-600" /> Filters
          </h2>
          {/* Mobile Close Button */}
          <button onClick={() => setIsOpen(false)} className="md:hidden p-2 bg-gray-50 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute top-3.5 left-3.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search events..."
            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium"
          />
        </div>

        <div className="space-y-8">
          
          {/* City Filter */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Location</label>
            <div className="relative">
              <MapPin className="absolute top-3.5 left-3.5 text-indigo-500" size={18} />
              <select
                value={selectedCity}
                onChange={e => { setSelectedCity(e.target.value); setIsOpen(false); }}
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none text-sm font-bold text-gray-800 shadow-sm"
              >
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Date</label>
            <div className="relative">
              <Calendar className="absolute top-3.5 left-3.5 text-indigo-500" size={18} />
              <input
                type="date"
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-gray-800 shadow-sm"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <h3 className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Categories</h3>
            <ul className="space-y-2">
              <li 
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${currentCategory === 'All' ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-100' : 'hover:bg-gray-50 text-gray-600 font-medium border border-transparent'}`} 
                onClick={() => handleCategoryClick('All')}
              >
                <div className="flex items-center gap-3"><Trophy size={18} className={currentCategory === 'All' ? 'text-indigo-600' : 'text-gray-400'} /> All Events</div>
                <span className="bg-white border border-gray-100 px-2.5 py-1 rounded-lg text-xs font-black shadow-sm">{categoryCounts.reduce((s, c) => s + c.count, 0) || '—'}</span>
              </li>
              
              {categoryCounts.map(c => (
                <li 
                  key={c.category} 
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${currentCategory === c.category ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-100' : 'hover:bg-gray-50 text-gray-600 font-medium border border-transparent'}`} 
                  onClick={() => handleCategoryClick(c.category)}
                >
                  <div className="flex items-center gap-3"><Trophy size={18} className={currentCategory === c.category ? 'text-indigo-600' : 'text-gray-400'} /> {c.category}</div>
                  <span className="bg-white border border-gray-100 px-2.5 py-1 rounded-lg text-xs font-black shadow-sm">{c.count}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </aside>
    </>
  );
};

export default Sidebar;