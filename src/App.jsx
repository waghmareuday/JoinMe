import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import About from './components/About';
import Footer from './components/Footer';
import Login from './components/Login';
import SignUp from './components/SignUp';
import Dashboard from './components/Dashboard';
import api from './utility/api';
import { useContext } from 'react';
import { UserContext } from './context/userContext';


function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const { setUser } = useContext(UserContext);

  // ✅ Check auth status on first load (auto login if rememberMe worked)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.get('/auth/check-auth'); // must return { success: true }
        if (res.data.success) {
          const userRes = await api.get('/user/data');
          if (userRes.data.success) {
            setUserData(userRes.data.userData);
            setIsAuthenticated(true);
          }
        }
      } catch (err) {
        console.log("User not logged in");
      }
    };

    checkAuth();
  }, []);

  // ✅ On successful login
const handleLoginSuccess = async ({ email, password }) => {
  try {
    const userRes = await api.get('/user/data');
    if (userRes.data.success) {
      setUserData(userRes.data.userData);
      setUser(userRes.data.userData); // 👈 This makes user available globally
      setIsAuthenticated(true);
      setIsLoginOpen(false);
      toast.success("Login successful!");
    } else {
      toast.error("Failed to fetch user data");
    }
  } catch (err) {
    console.error(err);
    toast.error("Login request failed");
  }
};


  // ✅ On successful signup
  const handleSignupSuccess = () => {
    setIsSignupOpen(false);
    toast.success("Account created! You can now login.");
    setIsLoginOpen(true); // Auto open login modal
  };

  // ✅ Handle logout
  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      setIsAuthenticated(false);
      setUserData(null);
      toast.success('Logged out');
    } catch (err) {
      toast.error('Logout failed');
    }
  };

  return (
    <div className="relative">
      <Toaster position="top-center" reverseOrder={false} />

      <Navbar
        loggedIn={isAuthenticated}
        onLoginClick={() => setIsLoginOpen(true)}
        onSignupClick={() => setIsSignupOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      {isAuthenticated && userData ? (
        <Dashboard user={userData} onLogout={handleLogout} />
      ) : (
        <>
          <Hero />
          <Features />
          <About />
          <Footer />
        </>
      )}

      {/* Login Modal */}
      <Login
        open={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLogin={handleLoginSuccess}
        onSignupClick={() => {
          setIsLoginOpen(false);
          setIsSignupOpen(true);
        }}
      />

      {/* Signup Modal */}
      <SignUp
        open={isSignupOpen}
        onClose={() => setIsSignupOpen(false)}
        onSubmit={handleSignupSuccess}
        onLoginClick={() => setIsLoginOpen(true)}
      />
    </div>
  );
}

export default App;
