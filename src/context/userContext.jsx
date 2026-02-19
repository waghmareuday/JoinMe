import { createContext, useContext, useEffect, useState } from 'react';
import api from '../utility/api';
import toast from 'react-hot-toast';
import socket from '../utility/socket';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  // 🟢 1. Synchronously grab the user from local storage so React knows instantly on refresh
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  // Only trigger the loading state if we truly have no cached data
  const [loading, setLoading] = useState(!user);

  // 🟢 2. Custom setter to keep localStorage and React State perfectly locked together
  const handleSetUser = (userData) => {
    // Handle both direct object updates and functional updates (e.g., prev => newPrev)
    if (typeof userData === 'function') {
      setUser((prev) => {
        const newVal = userData(prev);
        if (newVal) localStorage.setItem('user', JSON.stringify(newVal));
        else localStorage.removeItem('user');
        return newVal;
      });
    } else {
      setUser(userData);
      if (userData) localStorage.setItem('user', JSON.stringify(userData));
      else localStorage.removeItem('user');
    }
  };

  // 🟢 3. AUTHENTICATION MANAGER (Runs once on mount)
  useEffect(() => {
    let mounted = true;
    const fetchUser = async () => {
      try {
        // Validates your secure 30-day cookie in the background
        const res = await api.post('/auth/is-auth');
        if (mounted && res.data && res.data.success) {
          handleSetUser(res.data.user);
        } else if (mounted) {
          handleSetUser(null); // Wipe if cookie is invalid
        }
      } catch (err) {
        if (mounted) {
          handleSetUser(null);
          if (err.response && err.response.status >= 500) {
            toast.error('Failed to fetch user info.');
          }
        }
      } finally {
        if (mounted) setLoading(false); // Tell the app we are done checking!
      }
    };

    fetchUser();
    return () => { mounted = false; };
  }, []);

  // 🟢 4. GLOBAL SOCKET MANAGER (Reacts to User login/logout)
  useEffect(() => {
    if (!user) return; // Don't connect if not logged in

    // Connect and join personal room
    socket.connect();
    socket.joinUser(user._id);

    // Listen for rating updates
    const handleUserRated = (payload) => {
      if (!payload || String(payload.userId) !== String(user._id)) return;
      handleSetUser(prev => prev ? { ...prev, averageRating: payload.averageRating, totalRatings: payload.totalRatings } : prev);
    };

    socket.on('userRated', handleUserRated);

    // Cleanup when user logs out or context unmounts
    return () => {
      socket.off('userRated', handleUserRated);
      socket.disconnect(); // Safely kills the server connection on logout
    };
  }, [user?._id]); // Depend on ID so it perfectly re-syncs if the user changes

  return (
    <UserContext.Provider value={{ user, setUser: handleSetUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);