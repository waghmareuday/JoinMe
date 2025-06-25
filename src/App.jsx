import React, { useState } from 'react';
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

function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);

  // On successful login
  const handleLoginSuccess = async ({ email, password }) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        // Fetch user data after login
        const userRes = await api.get('/user/data');
        if (userRes.data.success) {
          setUserData(userRes.data.userData);
          setIsAuthenticated(true);
          setIsLoginOpen(false);
          toast.success("Login successful!");
        } else {
          toast.error("Failed to fetch user data");
        }
      } else {
        toast.error(res.data.message || "Login failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Login request failed");
    }
  };

  // On successful signup
  const handleSignupSuccess = () => {
    setIsSignupOpen(false);
    toast.success("Account created! You can now login.");
    setIsLoginOpen(true); // Auto open login modal
  };

  // Handle logout
  const handleLogout = async () => {
    await api.post('/auth/logout');
    setIsAuthenticated(false);
    setUserData(null);
    toast.success('Logged out');
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
