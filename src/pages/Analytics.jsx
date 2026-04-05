import React, { useState, useEffect } from 'react';
import { useUser } from '../context/userContext';
import api from '../utility/api';
import { BarChart3, TrendingUp, Trophy, Users, Calendar, Star, Shield, Award } from 'lucide-react';

const Analytics = () => {
  const { user } = useUser();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/analytics/me');
        if (res.data.success) setAnalytics(res.data.analytics);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Failed to load analytics.</p>
      </div>
    );
  }

  const { overview, categoryDistribution, monthlyTrend, recentActivity } = analytics;

  const statCards = [
    { label: 'Events Hosted', value: overview.eventsHosted, icon: Calendar, color: 'bg-indigo-500' },
    { label: 'Events Joined', value: overview.eventsJoined, icon: Users, color: 'bg-emerald-500' },
    { label: 'Completion Rate', value: `${overview.completionRate}%`, icon: TrendingUp, color: 'bg-blue-500' },
    { label: 'Average Rating', value: overview.averageRating, icon: Star, color: 'bg-amber-500' },
    { label: 'Trust Score', value: overview.trustScore, icon: Shield, color: 'bg-purple-500' },
    { label: 'Badges Earned', value: overview.badgeCount, icon: Award, color: 'bg-rose-500' },
    { label: 'Followers', value: overview.followersCount, icon: Users, color: 'bg-cyan-500' },
    { label: 'Following', value: overview.followingCount, icon: Users, color: 'bg-teal-500' },
  ];

  const tierColors = { bronze: 'text-amber-700', silver: 'text-gray-400', gold: 'text-yellow-500', platinum: 'text-indigo-400' };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-indigo-600" />
            Your Analytics
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track your activity, growth, and achievements on JoinMe
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <div className={`${stat.color} p-2 rounded-lg`}>
                  <stat.icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Category Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Category Focus</h3>
            {categoryDistribution.length > 0 ? (
              <div className="space-y-3">
                {categoryDistribution.map((cat) => {
                  const maxCount = Math.max(...categoryDistribution.map(c => c.count));
                  const width = Math.max(10, (cat.count / maxCount) * 100);
                  return (
                    <div key={cat.category}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 dark:text-gray-300">{cat.category}</span>
                        <span className="text-gray-500 dark:text-gray-400">{cat.count} events</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No events hosted yet.</p>
            )}
          </div>

          {/* Monthly Trend */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Activity</h3>
            {monthlyTrend.length > 0 ? (
              <div className="flex items-end gap-2 h-40">
                {monthlyTrend.map((m) => {
                  const maxCount = Math.max(...monthlyTrend.map(t => t.count));
                  const height = Math.max(10, (m.count / maxCount) * 100);
                  return (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{m.count}</span>
                      <div
                        className="w-full bg-indigo-500 rounded-t-md transition-all duration-500"
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-xs text-gray-400 dark:text-gray-500 truncate w-full text-center">
                        {m.month.split('-')[1]}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Not enough data yet.</p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0" />
                  <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">{activity.message}</p>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(activity.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No recent activity.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
