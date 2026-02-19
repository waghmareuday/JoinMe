import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../context/userContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useUser();

if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
         <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
         <p className="text-gray-500 font-bold animate-pulse">Verifying secure session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
