import React from 'react';

const SkeletonCard = () => {
  return (
    <div className="relative h-72 sm:h-80 rounded-2xl sm:rounded-3xl overflow-hidden bg-gray-200 dark:bg-gray-700 animate-pulse">
      <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-between">
        {/* Top section */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-3">
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded-lg w-3/4"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded-lg w-1/2"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded-lg w-1/3"></div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="h-6 w-14 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            <div className="h-5 w-16 bg-gray-300 dark:bg-gray-600 rounded-md"></div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded-lg w-1/3"></div>
          </div>
          <div className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
          <div className="flex justify-end">
            <div className="h-10 w-20 bg-gray-300 dark:bg-gray-600 rounded-xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
