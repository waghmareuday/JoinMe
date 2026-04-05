import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/userContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useUser();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-950">
         <div className="w-12 h-12 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin mb-4"></div>
         <p className="text-gray-500 dark:text-slate-400 font-bold animate-pulse">Verifying secure session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isProfileIncomplete = !user.age || user.age === 0 || !user.city || user.city.trim() === '' || !user.gender || user.gender === 'Not specified' || user.gender.trim() === '';
  const isCurrentlyOnboarding = location.pathname === '/onboarding';

  if (isProfileIncomplete && !isCurrentlyOnboarding) {
    return <Navigate to="/onboarding" replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;
