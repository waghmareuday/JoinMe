// Sidebar.jsx
import React, { useContext, useState, useEffect } from 'react';
import { MapPin, Calendar, Trophy, Film, Car, Users, Search } from 'lucide-react';
import { useUser } from '../context/UserContext'; // <-- use the custom hook

const cities = [
  "Nagpur", "Pune", "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Jaipur"
];

const Sidebar = ({ onCityChange, onCategorySelect, categoryCounts = [] }) => {
  const { user } = useUser(); // safer and recommended
  const defaultCity = user?.city || 'Nagpur';
  const [selectedCity, setSelectedCity] = useState(defaultCity);

  // If user.city changes (e.g., after login), update selectedCity
  useEffect(() => {
    setSelectedCity(user?.city);
  }, [user?.city]);

  // Notify parent if city changes (optional)
  useEffect(() => {
    if (onCityChange) onCityChange(selectedCity);
  }, [selectedCity, onCityChange]);

  return (
    <aside className="w-64 bg-white border-r shadow-md p-5 sticky top-0 h-screen hidden md:block overflow-y-auto">
      <h2 className="text-2xl font-extrabold text-blue-700 mb-6">🎯 Filter Events</h2>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute top-3 left-3 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search events..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div className="space-y-6">
        {/* City Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">City</label>
          <select
            value={selectedCity}
            onChange={e => setSelectedCity(e.target.value)}
            className="w-full p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        {/* Date Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
          <input
            type="date"
            className="w-full p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Category Filter */}
        <div>
          <h3 className="text-md font-bold text-gray-700 mb-3">Categories</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center justify-between gap-2 text-gray-700 hover:text-gray-900 cursor-pointer" onClick={() => onCategorySelect && onCategorySelect('All')}>
              <div className="flex items-center gap-2"><Trophy size={18} /> All</div>
              <span className="text-xs text-gray-500">{categoryCounts.reduce((s, c) => s + c.count, 0) || '—'}</span>
            </li>
            {categoryCounts.map(c => (
              <li key={c.category} className="flex items-center justify-between gap-2 text-blue-700 hover:text-blue-900 cursor-pointer" onClick={() => onCategorySelect && onCategorySelect(c.category)}>
                <div className="flex items-center gap-2"><Trophy size={18} /> {c.category}</div>
                <span className="text-xs text-gray-500">{c.count} live</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
