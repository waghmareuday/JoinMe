import React from 'react';

const ComingSoon = () => {
  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-700">
      <div className="text-center">
        <h1 className="text-6xl font-extrabold text-white animate-bounce mb-4">🚀 Coming Soon</h1>
        <p className="text-xl text-white/80">We’re working hard. Stay tuned!</p>
        <div className="mt-6 animate-pulse">
          <span className="inline-block w-4 h-4 m-1 bg-white rounded-full"></span>
          <span className="inline-block w-4 h-4 m-1 bg-white rounded-full"></span>
          <span className="inline-block w-4 h-4 m-1 bg-white rounded-full"></span>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
