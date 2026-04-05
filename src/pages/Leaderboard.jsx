import React, { useState, useEffect } from 'react';
import api from '../utility/api';
import { Trophy, Star, Shield, Award, Users, Medal } from 'lucide-react';
import { CITIES } from '../constants/cities';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const params = selectedCity ? { city: selectedCity } : {};
        const res = await api.get('/analytics/leaderboard', { params });
        if (res.data.success) setLeaderboard(res.data.leaderboard);
      } catch (err) {
        console.error('Leaderboard error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [selectedCity]);

  const getRankBadge = (rank) => {
    if (rank === 1) return <span className="text-2xl">🥇</span>;
    if (rank === 2) return <span className="text-2xl">🥈</span>;
    if (rank === 3) return <span className="text-2xl">🥉</span>;
    return <span className="text-lg font-bold text-gray-400 dark:text-gray-500 w-8 text-center">#{rank}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Leaderboard</h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            Top community members ranked by trust score & activity
          </p>
        </div>

        {/* City Filter */}
        <div className="flex justify-center mb-6">
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="">All Cities</option>
            {CITIES.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        {/* Leaderboard List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full" />
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No users found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((user) => (
              <div
                key={user._id}
                className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border transition-all duration-200 hover:shadow-md ${
                  user.rank <= 3
                    ? 'border-yellow-200 dark:border-yellow-800'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="flex-shrink-0 w-10 flex justify-center">
                    {getRankBadge(user.rank)}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">{user.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user.city}</p>
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-4">
                    <div className="flex items-center gap-1 text-sm">
                      <Shield className="w-4 h-4 text-purple-500" />
                      <span className="text-gray-700 dark:text-gray-300 font-medium">{user.trustScore}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="w-4 h-4 text-amber-500" />
                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                        {(user.averageRating || 0).toFixed(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Medal className="w-4 h-4 text-indigo-500" />
                      <span className="text-gray-700 dark:text-gray-300">{user.eventsHosted}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Award className="w-4 h-4 text-rose-500" />
                      <span className="text-gray-700 dark:text-gray-300">{user.badgeCount}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Users className="w-4 h-4 text-cyan-500" />
                      <span className="text-gray-700 dark:text-gray-300">{user.followersCount}</span>
                    </div>
                  </div>

                  {/* Mobile stats */}
                  <div className="flex sm:hidden items-center gap-2">
                    <div className="text-center">
                      <Shield className="w-4 h-4 text-purple-500 mx-auto" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">{user.trustScore}</span>
                    </div>
                    <div className="text-center">
                      <Star className="w-4 h-4 text-amber-500 mx-auto" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">{(user.averageRating || 0).toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
