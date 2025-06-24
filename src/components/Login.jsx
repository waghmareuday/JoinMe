import React, { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';

const Login = ({ open, onClose, onLogin, onSignupClick }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onLogin) onLogin({ email, password, rememberMe });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Blurry overlay */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-all"
        onClick={onClose}
      ></div>

      {/* Login Modal */}
      <div className="relative bg-slate-200 rounded-2xl shadow-xl max-w-md w-full p-8 z-10 border border-gray-100">
        {/* Close button */}
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-blue-600 transition"
          onClick={onClose}
        >
          <X className="w-6 h-6" />
        </button>

        {/* Title */}
        <h2 className="text-3xl font-bold text-center text-blue-700 mb-2">Welcome Back</h2>
        <p className="text-center text-sm text-gray-500 mb-6">
          Login to your <span className="text-blue-600 font-semibold">JoinMe</span> account
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm text-gray-700 mb-1 font-medium">Email address</label>
            <input
              type="email"
              className="w-full px-4 py-3 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              placeholder="e.g. you@example.com"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <label className="block text-sm text-gray-700 mb-1 font-medium">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              className="w-full px-4 py-3 rounded-lg border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
            <button
              type="button"
              className="absolute top-9 right-3 text-gray-500 hover:text-gray-700"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Options */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="rounded accent-blue-600"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
              />
              Remember me
            </label>
            <button
              type="button"
              className="text-blue-600 hover:underline hover:text-blue-800"
              onClick={() => alert('Implement forgot password logic')}
            >
              Forgot password?
            </button>
          </div>

          {/* Login button */}
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-800 text-white font-bold text-lg shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            Login
          </button>

          {/* Sign Up Option */}
          <div className="text-center mt-4 text-sm text-gray-600">
            Don’t have an account?{' '}
            <button
              type="button"
              className="text-blue-600 font-semibold hover:underline"
              onClick={onSignupClick}
            >
              Sign Up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
