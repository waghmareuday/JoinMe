import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import About from './components/About';
import Footer from './components/Footer';
import Login from './components/Login';
import Signup from './components/SignUp'; // ✅ Correct import (uppercase 'U')

function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false); // ✅ Signup modal state

  // ✅ Handle login form submission
  const handleLogin = async ({ email, password }) => {
    console.log("Login Submitted", email, password);
    setIsLoginOpen(false);
  };

  // ✅ Handle signup form submission
  const handleSignup = async (data) => {
    console.log("Signup Submitted", data);
    setIsSignupOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ✅ Navbar with Login and Signup triggers */}
      <Navbar 
        onLoginClick={() => setIsLoginOpen(true)} 
        onSignupClick={() => setIsSignupOpen(true)} 
      />

      {/* 📌 Main Landing Sections */}
      <Hero />
      <Features />
      <About />
      <Footer />

      {/* ✅ Login Modal */}
      <Login
        open={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLogin={handleLogin}
      />

      {/* ✅ Signup Modal */}
      <Signup
        open={isSignupOpen}
        onClose={() => setIsSignupOpen(false)}
        onSubmit={handleSignup}
      />
    </div>
  );
}

export default App;
