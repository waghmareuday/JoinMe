import React, { useState, useEffect } from 'react';
import api from '../utility/api';
import { Award, Lock, CheckCircle2 } from 'lucide-react';

const tierStyles = {
  bronze: 'from-amber-600 to-amber-800 ring-amber-300',
  silver: 'from-gray-400 to-gray-600 ring-gray-300',
  gold: 'from-yellow-400 to-yellow-600 ring-yellow-300',
  platinum: 'from-indigo-400 to-purple-600 ring-indigo-300',
};

const tierBg = {
  bronze: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
  silver: 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700',
  gold: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
  platinum: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800',
};

/**
 * Badge Display Modal - Shows all badges with earned/locked states
 * Can be used on profile page or as a modal.
 */
const BadgeDisplay = ({ userId, showAll = true }) => {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const endpoint = showAll ? '/badges/my' : `/badges/user/${userId}`;
        const res = await api.get(endpoint);
        if (res.data.success) setBadges(res.data.badges);
      } catch (err) {
        console.error('Failed to fetch badges:', err);
      } finally {
        setLoading(false);
      }
    };
    if (userId || showAll) fetchBadges();
  }, [userId, showAll]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const earned = badges.filter(b => b.earned);
  const locked = badges.filter(b => !b.earned);

  return (
    <div>
      {/* Summary */}
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Badges
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
            {earned.length}/{badges.length} earned
          </span>
        </h3>
      </div>

      {/* Earned Badges */}
      {earned.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {earned.map(badge => (
            <div
              key={badge.id}
              className={`relative rounded-xl p-3 border ${tierBg[badge.tier]} transition-transform hover:scale-105`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{badge.icon}</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute top-2 right-2" />
              </div>
              <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{badge.name}</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{badge.description}</p>
              {badge.earnedAt && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Earned {new Date(badge.earnedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Locked Badges (only show if showAll) */}
      {showAll && locked.length > 0 && (
        <>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-2 font-medium">Still to unlock</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {locked.map(badge => (
              <div
                key={badge.id}
                className="relative rounded-xl p-3 border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/30 opacity-60"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl grayscale">{badge.icon}</span>
                  <Lock className="w-3 h-3 text-gray-400 absolute top-2 right-2" />
                </div>
                <h4 className="font-semibold text-sm text-gray-600 dark:text-gray-400">{badge.name}</h4>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{badge.description}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {earned.length === 0 && (
        <p className="text-center text-gray-400 dark:text-gray-500 text-sm py-4">
          No badges earned yet. Start hosting and joining events!
        </p>
      )}
    </div>
  );
};

/**
 * Compact badge row for profile cards — shows just earned badge icons
 */
export const BadgeRow = ({ userId }) => {
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const res = await api.get(`/badges/user/${userId}`);
        if (res.data.success) setBadges(res.data.badges);
      } catch (_) {}
    };
    if (userId) fetchBadges();
  }, [userId]);

  if (badges.length === 0) return null;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {badges.slice(0, 5).map(badge => (
        <span key={badge.id} title={badge.name} className="text-lg cursor-default">
          {badge.icon}
        </span>
      ))}
      {badges.length > 5 && (
        <span className="text-xs text-gray-400">+{badges.length - 5}</span>
      )}
    </div>
  );
};

export default BadgeDisplay;
