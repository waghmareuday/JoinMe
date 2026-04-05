import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Users, LogOut, User, LayoutDashboard, Star, ChevronDown, Bell, CheckCheck, Clock, Moon, Sun, Trash2, BarChart3, Trophy } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../context/userContext';
import { useTheme } from '../context/themeContext';
import api from '../utility/api';
import socket from '../utility/socket';
import toast from 'react-hot-toast';

const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return "Just now";
};

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const { user, setUser } = useUser();
  const { isDark, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const loggedIn = !!user;

  const menuRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setShowProfileMenu(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setShowNotifMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!loggedIn || !user) return;

    api.get('/notifications/my-notifications')
      .then(res => {
        if (res.data?.success) {
          setNotifications(res.data.notifications);
          setUnreadCount(res.data.unreadCount);
        }
      }).catch(err => console.error("Failed to fetch notifications:", err));

    // socket.connect() removed; globally managed by UserProvider
    socket.emit('joinUser', user._id || user.id);

    const handleNewNotification = (notif) => {
      setNotifications(prev => [notif, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    socket.on('newNotification', handleNewNotification);
    return () => socket.off('newNotification', handleNewNotification);
  }, [loggedIn, user]);

  const markAsRead = async (id) => {
    try {
      await api.put('/notifications/read', { notificationId: id });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) { console.error(err); }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read', {});
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) { console.error(err); }
  };

  const handleLogout = async () => {
    setShowProfileMenu(false);
    setIsMobileMenuOpen(false);

    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error("Backend logout ping failed, logging out locally anyway");
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);

    toast.success("Logged out successfully");
    navigate('/');
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';
  const displayRating = user?.averageRating > 0 ? user.averageRating.toFixed(1) : 'New';

  return (
    <nav className={`fixed top-0 left-0 w-full z-[100] transition-all duration-300 ${isScrolled ? 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-lg shadow-gray-100/20 dark:shadow-slate-900/50 border-b border-gray-100/80 dark:border-slate-800/80' : 'bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">

          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 sm:space-x-3 group z-50">
            <div className="p-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 group-hover:shadow-lg group-hover:shadow-indigo-500/30 transition-all duration-300">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <span className="text-xl sm:text-2xl font-black text-gray-800 dark:text-white tracking-tight">
              Join<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Me</span>
            </span>
          </Link>

          {loggedIn ? (
            <div className="flex items-center gap-1.5 sm:gap-3">

              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2.5 rounded-xl text-gray-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifMenu(!showNotifMenu)}
                  className="relative p-2.5 rounded-xl text-gray-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                >
                  <Bell size={22} className={unreadCount > 0 ? "text-indigo-600 dark:text-indigo-400" : ""} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
                  )}
                </button>

                {showNotifMenu && (
                  <div className="absolute right-0 mt-3 w-[90vw] max-w-[360px] sm:max-w-sm bg-white dark:bg-slate-900 shadow-2xl dark:shadow-slate-900/50 rounded-2xl border border-gray-100 dark:border-slate-800 py-2 z-50 animate-fade-in origin-top-right flex flex-col max-h-[75vh]">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50 rounded-t-2xl">
                      <h3 className="font-bold text-gray-800 dark:text-white text-sm">Notifications</h3>
                      <div className="flex items-center gap-2">
                        {notifications.some(n => n.isRead) && (
                          <button
                            onClick={async () => {
                              try {
                                await api.delete('/notifications/clear-read');
                                setNotifications(prev => prev.filter(n => !n.isRead));
                                toast.success('Cleared read notifications');
                              } catch(err) { console.error(err); }
                            }}
                            className="text-xs font-bold text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 flex items-center gap-1 transition-colors"
                          >
                            <Trash2 size={12} /> Clear
                          </button>
                        )}
                        {unreadCount > 0 && (
                          <button onClick={markAllAsRead} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors">
                            <CheckCheck size={14} /> Mark all read
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                      {notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <div
                            key={notif._id}
                            onClick={() => !notif.isRead && markAsRead(notif._id)}
                            className={`px-4 py-3 border-b border-gray-50 dark:border-slate-800/50 flex items-start gap-3 cursor-pointer transition-colors ${notif.isRead ? 'opacity-70 hover:bg-gray-50 dark:hover:bg-slate-800/50' : 'bg-indigo-50/40 dark:bg-indigo-500/5 hover:bg-indigo-50/60 dark:hover:bg-indigo-500/10'}`}
                          >
                            <div className="mt-1 relative flex-shrink-0">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                                🔔
                              </div>
                              {!notif.isRead && <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white dark:border-slate-900"></div>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm leading-snug ${notif.isRead ? 'text-gray-600 dark:text-slate-400' : 'text-gray-900 dark:text-white font-bold'}`}>
                                {notif.message}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1.5 flex items-center gap-1 font-medium">
                                <Clock size={12} /> {timeAgo(notif.createdAt)}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-10 text-center px-4">
                          <div className="w-12 h-12 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3"><Bell size={20} className="text-gray-300 dark:text-slate-600" /></div>
                          <p className="text-sm font-medium text-gray-500 dark:text-slate-400">You're all caught up!</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Menu */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 pl-1.5 pr-2.5 sm:pl-2 sm:pr-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/40 bg-white dark:bg-slate-900"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-sm">
                    {userInitial}
                  </div>
                  <ChevronDown size={16} className={`text-gray-500 dark:text-slate-400 transition-transform duration-300 ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-3 w-56 sm:w-64 bg-white dark:bg-slate-900 shadow-2xl dark:shadow-slate-900/50 rounded-2xl border border-gray-100 dark:border-slate-800 py-2 z-50 animate-fade-in origin-top-right">
                    <div className="px-5 py-3 border-b border-gray-100 dark:border-slate-800 mb-2 bg-gray-50/50 dark:bg-slate-800/50 rounded-t-2xl">
                      <p className="text-sm font-black text-gray-800 dark:text-white truncate">{user.name}</p>
                      <div className="flex items-center text-xs font-bold mt-1 text-gray-500 dark:text-slate-400">
                        <Star size={14} className="text-yellow-500 fill-yellow-500 mr-1.5" />
                        {displayRating} <span className="font-medium ml-1 text-gray-400 dark:text-slate-500">({user?.totalRatings || 0} reviews)</span>
                      </div>
                    </div>
                    <div className="px-2 space-y-1">
                      <Link to="/dashboard" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-bold">
                        <LayoutDashboard size={18} className="text-gray-400 dark:text-slate-500" /> Dashboard
                      </Link>
                      <Link to="/profile" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-bold">
                        <User size={18} className="text-gray-400 dark:text-slate-500" /> My Profile
                      </Link>
                      <Link to="/analytics" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-bold">
                        <BarChart3 size={18} className="text-gray-400 dark:text-slate-500" /> My Analytics
                      </Link>
                      <Link to="/leaderboard" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-bold">
                        <Trophy size={18} className="text-gray-400 dark:text-slate-500" /> Leaderboard
                      </Link>
                    </div>
                    <div className="px-4 my-2 border-t border-gray-100 dark:border-slate-800"></div>
                    <div className="px-2">
                      <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 w-full text-left rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors font-bold">
                        <LogOut size={18} className="text-red-400 dark:text-red-500" /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Desktop nav for guests */}
              <div className="hidden md:flex items-center space-x-4">
                {/* Dark mode toggle for guests too */}
                <button
                  onClick={toggleDarkMode}
                  className="p-2.5 rounded-xl text-gray-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all focus:outline-none"
                  title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                  {isDark ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <Link to="/login" className="font-bold text-gray-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-4 py-2">Login</Link>
                <Link to="/signup" className="px-6 py-2.5 rounded-xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:scale-95 transition-all">
                  Sign Up
                </Link>
              </div>

              {/* Mobile hamburger */}
              <div className="md:hidden flex items-center gap-2">
                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-xl text-gray-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-all focus:outline-none"
                >
                  {isDark ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 text-gray-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-xl transition-colors z-50"
                >
                  {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile menu for guests */}
      {!loggedIn && (
        <div className={`md:hidden absolute top-16 left-0 w-full bg-white dark:bg-slate-900 shadow-xl border-b border-gray-100 dark:border-slate-800 transition-all duration-300 origin-top overflow-hidden ${isMobileMenuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="p-5 flex flex-col gap-3 bg-gray-50/50 dark:bg-slate-800/50">
            <Link
              to="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full text-center font-extrabold text-gray-700 dark:text-slate-300 py-3 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-slate-700 rounded-xl transition-all"
            >
              Login
            </Link>
            <Link
              to="/signup"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full text-center py-3 rounded-xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md hover:shadow-lg transition-all"
            >
              Sign Up
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
