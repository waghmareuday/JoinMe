import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, Users, ArrowRight, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import api from '../utility/api';
import { useUser } from '../context/userContext';
import { useNavigate, Link } from 'react-router-dom';
import ForgotPasswordModal from '../components/ForgotPasswordModal';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  
  const { user, setUser, loading: authLoading } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password, rememberMe });
      if (res.data.success) {
        toast.success('Welcome back!');
        const { user: userData, token } = res.data;
        setUser(userData, token);

        // Immediate redirection check for onboarding
        const isIncomplete = !userData.age || userData.age === 0 || !userData.city || !userData.gender;
        if (isIncomplete) {
          navigate('/onboarding', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
        onLogin?.({ email, password });
      } else {
        toast.error(res.data.message || 'Login failed!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await api.post('/auth/google', { credential: credentialResponse.credential });
      if (res.data.success) {
        toast.success(res.data.message || 'Welcome!');
        const { user: userData, token } = res.data;
        setUser(userData, token);
        
        // Immediate redirection check for onboarding
        const isIncomplete = !userData.age || userData.age === 0 || !userData.city || !userData.gender;
        if (isIncomplete) {
          navigate('/onboarding', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google sign-in failed');
    }
  };


  // Remove the blocking loading check to ensure initial form visibility
  // if (authLoading) return null;


  return (
    <>
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center font-sans bg-gray-50 dark:bg-slate-950 p-4 sm:p-8 pt-20 relative overflow-hidden">
      {/* Ambient background layers */}
      <div className="fixed inset-0 opacity-[0.03] dark:opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-500/20 dark:bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-500/20 dark:bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Central Floating Card */}
      <div className="w-full max-w-[500px] bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl shadow-indigo-500/10 dark:shadow-none border border-gray-100 dark:border-slate-800 p-8 sm:p-10 relative z-10 animate-fade-in-up">
        
          <div className="flex flex-col items-center justify-center text-center mb-8">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/30 mb-4">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-500 dark:text-slate-400 font-medium">Sign in to continue your journey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type="email"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all placeholder:text-gray-400"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full pl-12 pr-14 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all placeholder:text-gray-400"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder={'\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-indigo-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <div className="relative">
                  <input type="checkbox" className="sr-only peer" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />
                  <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${rememberMe ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300 dark:border-gray-600'}`}>
                    {rememberMe && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </div>
                </div>
                <span className="text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors font-medium">Remember me</span>
              </label>
              <button type="button" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:text-indigo-800 transition-colors" onClick={() => setShowForgot(true)}>
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-base shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex justify-center items-center gap-2"
              disabled={loading}
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>Sign In</span> <ArrowRight size={18} /></>}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>

          {/* Google Sign-In */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error('Google sign-in failed')}
              theme="outline"
              size="large"
              shape="pill"
              text="continue_with"
              width="400"
            />
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Don't have an account?{' '}
              <Link to="/signup" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline underline-offset-4">Create one now</Link>
            </p>
          </div>
        </div>
    </div>
    
    <ForgotPasswordModal isOpen={showForgot} onClose={() => setShowForgot(false)} />
    </>
  );
};

export default Login;
