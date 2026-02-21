import { createContext, useContext, useEffect, useState } from 'react';
import api from '../utility/api';
import toast from 'react-hot-toast';
import socket from '../utility/socket';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [loading, setLoading] = useState(true);

  // 🟢 Automatically wipes the token if user is set to null
  const handleSetUser = (userData) => {
    if (typeof userData === 'function') {
      setUser((prev) => {
        const newVal = userData(prev);
        if (newVal) {
          localStorage.setItem('user', JSON.stringify(newVal));
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
      } else {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  };

  useEffect(() => {
    let mounted = true;
    const fetchUser = async () => {
      // ⚡ SPEED BOOST: If there is no token, don't ping the backend. Instantly load the app!
      const token = localStorage.getItem('token');
      if (!token) {
        if (mounted) {
          handleSetUser(null);
          setLoading(false);
        }
        return;
      }

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
      socket.disconnect(); 
    };
  }, [user?._id]); 

  return (
    <UserContext.Provider value={{ user, setUser: handleSetUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);