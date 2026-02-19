import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utility/api';
import { useUser } from '../context/userContext';
import { useNavigate } from 'react-router-dom';
import ForgotPasswordModal from '../components/ForgotPasswordModal';

const Login = ({ onLogin, onSignupClick }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const { setUser } = useUser();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password, rememberMe });
      if (res.data.success) {
        toast.success('Login successful!');
        setEmail('');
        setPassword('');
        setLoading(false);
        const userData = res.data.user || { email };
        setUser(userData);
        navigate('/dashboard');
        onLogin?.({ email, password });
      } else {
        toast.error(res.data.message || 'Login failed!');
        setLoading(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Server error!');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 border border-gray-100">
        <h2 className="text-3xl font-bold text-center text-blue-700 mb-2">Welcome Back</h2>
        <p className="text-center text-sm text-gray-500 mb-6">
          Login to your <span className="text-blue-600 font-semibold">JoinMe</span> account
        </p>
        <form onSubmit={handleSubmit} className="space-y-5">
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
          <div className="relative">
            <label className="block text-sm text-gray-700 mb-1 font-medium">Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
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
              className="text-blue-600 font-medium hover:underline"
              onClick={() => setShowForgot(true)}
            >
              Forgot?
            </button>
          </div>

          <ForgotPasswordModal isOpen={showForgot} onClose={() => setShowForgot(false)} />
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-800 text-white font-bold text-lg shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
          <div className="text-center mt-4 text-sm text-gray-600">
            Don’t have an account?{' '}
            <a href="/signup" className="text-blue-600 font-semibold hover:underline">
              Sign Up
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
