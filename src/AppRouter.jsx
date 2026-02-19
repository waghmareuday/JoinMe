import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { Home, Dashboard, Login, Signup, About, Features, ComingSoon } from './pages';
import Profile from './pages/Profile'; // 🟢 Added Profile import
import ProtectedRoute from './components/ProtectedRoute';
import NotFound from './components/NotFound';

const AppRouter = () => (
  <Router>
    <Navbar />
    <Routes>
      <Route path="/" element={<Home />} />
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />

      {/* 🟢 NEW: Protected Profile Route */}
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />

      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/about" element={<About />} />
      <Route path="/features" element={<Features />} />
      <Route path="/coming-soon" element={<ComingSoon />} />
      
      {/* 404 fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
    <Footer />
  </Router>
);

export default AppRouter;