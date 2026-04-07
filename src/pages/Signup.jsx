import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2, Mail, Lock, User, MapPin, Briefcase, Users, Sparkles, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import api from '../utility/api';
import { useUser } from '../context/userContext';
import { CITIES } from '../constants/cities';

const Signup = () => {
  const navigate = useNavigate();
  const { setUser } = useUser();

  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (otpSent && timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [otpSent, timer]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const updated = [...otp];
    updated[index] = value.slice(-1);
    setOtp(updated);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleVerifyEmail = async () => {
    if (!formData.email) {
      toast.error("Please enter your email first.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/send-otp', { email: formData.email });
      if (res.data.success) {
        toast.success(otpSent ? "New OTP sent successfully!" : "OTP sent successfully to your email.");
        setOtpSent(true);
        setTimer(300);
        // JM-010: Clear OTP input boxes on resend
        setOtp(['', '', '', '', '', '']);
      } else {
        toast.error(res.data.message || 'Failed to send OTP');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP.");
      return;
    }
    setLoading(true);
    try {
      const verifyRes = await api.post('/auth/verify-otp', {
        email: formData.email,
        otp: otpCode
      });
      if (verifyRes.data.success) {
        setIsVerified(true);
        setOtpSent(false);
        toast.success("Email verified successfully!");
      } else {
        toast.error(verifyRes.data.message || 'OTP verification failed');
        setOtp(['', '', '', '', '', '']); // Clear OTP on failure
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Invalid or expired OTP.');
      setOtp(['', '', '', '', '', '']); // Clear OTP on error
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isVerified) {
      toast.error("Please verify your email before signing up.");
      return;
    }
    setLoading(true);
    try {
      const registerRes = await api.post('/auth/register', {
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        email: formData.email,
        password: formData.password
      });
      if (registerRes.data.success) {
        toast.success("Registration successful! Welcome to JoinMe");
        const { user: userData, token } = registerRes.data;
        if (userData) {
          setUser(userData, token);
          // Check if profile is incomplete to redirect to onboarding immediately
          const isIncomplete = !userData.age || userData.age === 0 || !userData.city || !userData.gender;
          if (isIncomplete) {
            navigate('/onboarding', { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
        }
      } else {
        toast.error(registerRes.data.message || 'Registration failed');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await api.post('/auth/google', { credential: credentialResponse.credential });
      if (res.data.success) {
        toast.success(res.data.isNewUser ? 'Account created with Google!' : 'Welcome back!');
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
      toast.error(err.response?.data?.message || 'Google sign-up failed');
    }
  };

  const inputClasses = "w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all placeholder:text-gray-400 font-medium text-sm";
  const selectClasses = "w-full px-4 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all appearance-none font-medium text-sm";

  return (
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
              Join<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Me</span>
            </h2>
            <p className="text-gray-500 dark:text-slate-400 font-medium">Create your account to step inside</p>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
            {/* Name Fields */}
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">First Name</label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 text-gray-400" size={18} />
                <input name="firstName" value={formData.firstName} onChange={handleChange} placeholder="John" className={inputClasses} required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Last Name</label>
              <input name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Doe" className={selectClasses} required />
            </div>

            {/* Email + Verify */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Mail className="absolute left-4 top-3.5 text-gray-400" size={18} />
                  <input type="email" name="email" value={formData.email} onChange={handleChange} disabled={isVerified || otpSent} placeholder="john@example.com" className={`${inputClasses} disabled:opacity-60`} required />
                </div>
                {!isVerified && (
                  <button type="button" onClick={handleVerifyEmail} disabled={loading || (otpSent && timer > 0) || !formData.email} className={`px-6 py-3.5 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-bold rounded-2xl transition-all disabled:opacity-50 whitespace-nowrap border border-indigo-100 dark:border-indigo-800 text-sm`}>
                    {otpSent ? (timer > 0 ? 'OTP Sent' : 'Resend OTP') : 'Verify Email'}
                  </button>
                )}
              </div>
            </div>

            {/* Verified Badge */}
            {isVerified && (
              <div className="md:col-span-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm animate-fade-in">
                <CheckCircle2 size={18} /> Email successfully verified!
              </div>
            )}

            {/* OTP Section */}
            {otpSent && !isVerified && (
              <div className="md:col-span-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 p-5 rounded-2xl animate-fade-in-down">
                <label className="block text-center text-sm font-bold text-indigo-800 dark:text-indigo-300 mb-3">Enter the 6-digit code sent to your email</label>
                <div className="flex justify-center gap-2 sm:gap-3 mb-4">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      maxLength={1}
                      type="text"
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-10 h-12 sm:w-12 sm:h-14 text-xl sm:text-2xl font-black text-center text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-800 border-2 border-indigo-200 dark:border-indigo-700 rounded-xl focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                    />
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {timer > 0 ? (
                      <>Expires in: <span className="font-bold text-red-500">{formatTime(timer)}</span></>
                    ) : (
                      <span className="text-red-500 font-bold">OTP Expired</span>
                    )}
                  </p>
                  <div className="flex gap-2">
                    {timer === 0 && (
                       <button type="button" onClick={handleVerifyEmail} disabled={loading} className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold rounded-xl hover:bg-gray-200 transition-all text-xs">
                         Resend
                       </button>
                    )}
                    <button type="button" onClick={handleOtpVerify} disabled={loading || timer === 0} className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all text-sm disabled:opacity-50">
                      Confirm Code
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Password */}
            <div className="md:col-span-2 mt-1">
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Create Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-gray-400" size={18} />
                <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} placeholder={'\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'} className={`${inputClasses} pr-12`} required minLength={6} />
                <button type="button" className="absolute top-3.5 right-4 text-gray-400 hover:text-indigo-600 transition-colors" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading || !isVerified} className="md:col-span-2 mt-3 w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl text-base shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex justify-center items-center gap-2">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>Complete Sign Up</span> <ArrowRight size={18} /></>}
            </button>

            {/* Divider */}
            <div className="md:col-span-2 flex items-center gap-4 mt-2">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>

            {/* Google Sign-Up */}
            <div className="md:col-span-2 flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error('Google sign-up failed')}
                theme="outline"
                size="large"
                shape="pill"
                text="signup_with"
                width="400"
              />
            </div>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 font-medium mt-6 relative z-10">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline underline-offset-4">Log in here</Link>
          </p>
        </div>
    </div>
  );
};

export default Signup;
