import React, { useState, useEffect } from 'react';
import api from '../utility/api';
import { UserPlus, UserCheck, Users } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Follow/Unfollow Button with follower count display
 */
const FollowButton = ({ targetUserId, compact = false }) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get(`/follow/stats/${targetUserId}`);
        if (res.data.success) {
          setIsFollowing(res.data.isFollowing);
          setFollowersCount(res.data.followersCount);
          setFollowingCount(res.data.followingCount);
        }
      } catch (_) {}
    };
    if (targetUserId) fetchStats();
  }, [targetUserId]);

  const handleFollow = async () => {
    if (loading) return;
    setLoading(true);

    try {
      if (isFollowing) {
        const res = await api.delete(`/follow/${targetUserId}`);
        if (res.data.success) {
          setIsFollowing(false);
          setFollowersCount(res.data.followersCount);
          toast.success('Unfollowed');
        }
      } else {
        const res = await api.post('/follow', { targetUserId });
        if (res.data.success) {
          setIsFollowing(true);
          setFollowersCount(res.data.followersCount);
          toast.success(res.data.message);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleFollow}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
          isFollowing
            ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400'
            : 'bg-indigo-600 text-white hover:bg-indigo-700'
        } disabled:opacity-50`}
      >
        {isFollowing ? (
          <>
            <UserCheck className="w-3.5 h-3.5" />
            Following
          </>
        ) : (
          <>
            <UserPlus className="w-3.5 h-3.5" />
            Follow
          </>
        )}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleFollow}
        disabled={loading}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
          isFollowing
            ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400'
            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
        } disabled:opacity-50`}
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : isFollowing ? (
          <UserCheck className="w-4 h-4" />
        ) : (
          <UserPlus className="w-4 h-4" />
        )}
        {isFollowing ? 'Following' : 'Follow'}
      </button>

      <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
        <span>
          <strong className="text-gray-900 dark:text-white">{followersCount}</strong> followers
        </span>
        <span>
          <strong className="text-gray-900 dark:text-white">{followingCount}</strong> following
        </span>
      </div>
    </div>
  );
};

export default FollowButton;
