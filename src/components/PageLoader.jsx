import React from 'react';

/**
 * Beautiful loading spinner used as Suspense fallback for lazy-loaded pages
 */
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      {/* Animated spinner */}
      <div className="relative w-16 h-16 mx-auto mb-4">
        <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-600 animate-spin"></div>
      </div>
      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium animate-pulse">
        Loading...
      </p>
    </div>
  </div>
);

export default PageLoader;
