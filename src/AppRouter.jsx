import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import PageLoader from './components/PageLoader';
import ProtectedRoute from './components/ProtectedRoute';

// Code Splitting: Lazy-load heavy pages (only loaded when user navigates to them)
const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const About = lazy(() => import('./pages/About'));
const Features = lazy(() => import('./pages/Features'));
const ComingSoon = lazy(() => import('./pages/ComingSoon'));
const Profile = lazy(() => import('./pages/Profile'));
const InviteJoin = lazy(() => import('./pages/InviteJoin'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const NotFound = lazy(() => import('./components/NotFound'));

const AppRouter = () => (
  <Router>
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-16 sm:pt-20">
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />

              <Route path="/onboarding" element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              } />

              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />

              <Route path="/analytics" element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              } />

              <Route path="/leaderboard" element={<Leaderboard />} />

              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/about" element={<About />} />
              <Route path="/features" element={<Features />} />
              <Route path="/coming-soon" element={<ComingSoon />} />
              
              {/* Invite link join route */}
              <Route path="/invite/:token" element={<InviteJoin />} />
              
              {/* 404 fallback */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  </Router>
);

export default AppRouter;