import { createContext, useContext, useEffect, useState } from 'react';
import api from '../utility/api';
import toast from 'react-hot-toast';
import socket from '../utility/socket';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  // 🟢 1. Initialize with cached data, but don't "settle" until backend confirms
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  // 🟢 2. CRITICAL: Start as loading = true so ProtectedRoute waits for the API
  const [loading, setLoading] = useState(true);

  const handleSetUser = (userData) => {
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

  useEffect(() => {
    let mounted = true;
    const fetchUser = async () => {
      try {
        // Pings Render to check if that cookie is valid
        const res = await api.post('/auth/is-auth');
        if (mounted && res.data && res.data.success) {
          handleSetUser(res.data.user);
        } else if (mounted) {
          handleSetUser(null);
        }
      } catch (err) {
        if (mounted) handleSetUser(null);
      } finally {
        if (mounted) setLoading(false); // 🟢 3. ONLY NOW allow the app to render
      }
    };

    fetchUser();
    return () => { mounted = false; };
  }, []);

  // ... keep your socket logic ...

  return (
    <UserContext.Provider value={{ user, setUser: handleSetUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);