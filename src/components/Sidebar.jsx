import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Trophy, Search, Filter, X } from 'lucide-react';
import { useUser } from '../context/userContext';
import { CITIES } from '../constants/cities';

const Sidebar = ({ onCityChange, onCategorySelect, onSearchChange, onDateChange, categoryCounts = [], currentCategory = 'All' }) => {
  const { user } = useUser();
  const defaultCity = user?.city || 'Nagpur';
  const [selectedCity, setSelectedCity] = useState(defaultCity);

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setSelectedCity(user?.city || 'Nagpur');
  }, [user?.city]);

  useEffect(() => {
    if (onCityChange) onCityChange(selectedCity);
  }, [selectedCity, onCityChange]);

  const handleCategoryClick = (cat) => {
    if (onCategorySelect) onCategorySelect(cat);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed bottom-24 right-6 z-40 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-2xl shadow-xl shadow-indigo-500/25 hover:shadow-2xl hover:shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
      >
        <Filter size={24} />
      </button>

      {/* Mobile Dark Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 dark:bg-black/70 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* The Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 shadow-2xl dark:shadow-slate-900/50 p-6 transform transition-transform duration-300 ease-in-out md:sticky md:top-16 md:translate-x-0 md:min-h-screen overflow-y-auto custom-scrollbar ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-extrabold text-gray-800 dark:text-white flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
              <Filter size={20} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            Filters
          </h2>
          <button onClick={() => setIsOpen(false)} className="md:hidden p-2 bg-gray-50 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl text-gray-500 dark:text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute top-3.5 left-3.5 text-gray-400 dark:text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search events..."
            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all text-sm font-medium text-gray-900 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500"
            onChange={e => onSearchChange && onSearchChange(e.target.value)}
          />
        </div>

        <div className="space-y-8">

          {/* City Filter */}
          <div>
            <label className="block text-xs font-black text-gray-600 dark:text-slate-300 uppercase tracking-wider mb-2.5">Location</label>
            <div className="relative">
              <MapPin className="absolute top-3.5 left-3.5 text-indigo-500 dark:text-indigo-400" size={18} />
              <select
                value={selectedCity}
                onChange={e => { setSelectedCity(e.target.value); setIsOpen(false); }}
                className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 appearance-none text-sm font-bold text-gray-800 dark:text-slate-200 shadow-sm transition-all"
              >
                {CITIES.map(city => (
                  <option key={city} value={city} className="bg-white text-gray-900 dark:bg-slate-800 dark:text-white font-semibold">{city}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-xs font-black text-gray-600 dark:text-slate-300 uppercase tracking-wider mb-2.5">Date</label>
            <div className="relative">
              <Calendar className="absolute top-3.5 left-3.5 text-indigo-500 dark:text-indigo-400" size={18} />
              <input
                type="date"
                className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 text-sm font-bold text-gray-800 dark:text-slate-200 shadow-sm transition-all"
                onChange={e => onDateChange && onDateChange(e.target.value)}
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <h3 className="block text-xs font-black text-gray-600 dark:text-slate-300 uppercase tracking-wider mb-3">Categories</h3>
            <ul className="space-y-1.5">
              <li
                className={`flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all ${currentCategory === 'All' ? 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-100 dark:border-indigo-500/20 shadow-sm' : 'hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-400 font-medium border border-transparent'}`}
                onClick={() => handleCategoryClick('All')}
              >
                <div className="flex items-center gap-3"><Trophy size={18} className={currentCategory === 'All' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-slate-500'} /> All Events</div>
                <span className="bg-white dark:bg-slate-700 border border-gray-100 dark:border-slate-600 px-2.5 py-1 rounded-lg text-xs font-black shadow-sm">{categoryCounts.reduce((s, c) => s + c.count, 0) || '—'}</span>
              </li>

              {categoryCounts.map(c => (
                <li
                  key={c.category}
                  className={`flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all ${currentCategory === c.category ? 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-100 dark:border-indigo-500/20 shadow-sm' : 'hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-400 font-medium border border-transparent'}`}
                  onClick={() => handleCategoryClick(c.category)}
                >
                  <div className="flex items-center gap-3"><Trophy size={18} className={currentCategory === c.category ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-slate-500'} /> {c.category}</div>
                  <span className="bg-white dark:bg-slate-700 border border-gray-100 dark:border-slate-600 px-2.5 py-1 rounded-lg text-xs font-black shadow-sm">{c.count}</span>
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
