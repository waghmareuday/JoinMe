import { createContext, useContext, useEffect, useState } from 'react';
import api from '../utility/api';
import toast from 'react-hot-toast';
import socket from '../utility/socket';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  // JM-009: Initialize state as null and rely entirely on the /auth/is-auth call.
  const [user, setUser] = useState(null);
  
  const [loading, setLoading] = useState(true);

  // 🟢 Automatically wipes the token if user is set to null
  const handleSetUser = (userData, token = null) => {
    if (typeof userData === 'function') {
      setUser((prev) => {
        const newVal = userData(prev);
        if (newVal) {
          localStorage.setItem('user', JSON.stringify(newVal));
          if (token) localStorage.setItem('token', token);
        } else {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
        return newVal;
      });
    } else {
      setUser(userData);
      if (userData) {
        localStorage.setItem('user', JSON.stringify(userData));
        if (token) localStorage.setItem('token', token);
      } else {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  };

  useEffect(() => {
    let mounted = true;
    const fetchUser = async () => {
      // ⚡ SECURITY: We no longer check localStorage for a token. 
      // The HttpOnly cookie is automatically sent to /auth/is-auth.

      try {
        const res = await api.post('/auth/is-auth');
        if (mounted && res.data && res.data.success) {
          handleSetUser(res.data.user);
        } else if (mounted) {
          handleSetUser(null);
        }
      } catch (err) {
        if (mounted) handleSetUser(null);
      } finally {
        if (mounted) setLoading(false); 
      }
    };

    fetchUser();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!user) return; 

    socket.connect();
    socket.joinUser(user._id);

    const handleUserRated = (payload) => {
      if (!payload || String(payload.userId) !== String(user._id)) return;
      handleSetUser(prev => prev ? { ...prev, averageRating: payload.averageRating, totalRatings: payload.totalRatings } : prev);
    };

    socket.on('userRated', handleUserRated);

    return () => {
      socket.off('userRated', handleUserRated);
      // Don't disconnect the shared socket - other components may still need it
    };
  }, [user?._id]); 

  return (
    <UserContext.Provider value={{ user, setUser: handleSetUser, handleSetUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);