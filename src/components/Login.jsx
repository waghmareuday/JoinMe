import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utility/api';

const Login = ({ open, onClose, onLogin, onSignupClick }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resetStep, setResetStep] = useState(1);
  const [otpVerified, setOtpVerified] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (!open) {
      setEmail('');
      setPassword('');
      setShowResetForm(false);
      setResetEmail('');
      setOtp(['', '', '', '', '', '']);
      setResetStep(1);
      setOtpVerified(false);
      setNewPassword('');
      setLoading(false);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });

      if (res.data.success) {
        toast.success('Login successful!');
        setEmail('');
        setPassword('');
        setTimeout(() => {
          setLoading(false);
          onLogin?.({ email, password });
        }, 1000);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-slate-200 rounded-2xl shadow-xl max-w-md w-full p-8 z-10 border border-gray-100">
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-blue-600 transition"
          onClick={onClose}
        >
          <X className="w-6 h-6" />
        </button>

        {!showResetForm ? (
          <>
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
                  className="text-blue-600 hover:underline hover:text-blue-800"
                  onClick={() => {
                    setShowResetForm(true);
                    setResetStep(1);
                  }}
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-800 text-white font-bold text-lg shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>

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
          </>
        ) : (
          <div>
            <h2 className="text-2xl font-bold text-center text-blue-700 mb-4">Reset Password</h2>

            {resetStep === 1 && (
              <>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-4 py-2 border rounded mb-3"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
                <button
                  onClick={async () => {
                    if (!resetEmail) return toast.error("Enter email first");
                    try {
                      const res = await api.post('/auth/send-forget-otp', { email: resetEmail });
                      if (res.data.success) {
                        toast.success(res.data.message);
                        setResetStep(2);
                        setOtp(['', '', '', '', '', '']);
                        setOtpVerified(false);
                      } else toast.error(res.data.message);
                    } catch {
                      toast.error("Server error");
                    }
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded w-full"
                >
                  Send OTP
                </button>
                <button
                  type="button"
                  className="mt-3 text-gray-500 hover:underline w-full"
                  onClick={() => setShowResetForm(false)}
                >
                  Back to Login
                </button>
              </>
            )}

            {resetStep === 2 && (
              <>
                <div className="flex justify-center gap-2 mb-3">
                  {otp.map((value, i) => (
                    <input
                      key={i}
                      type="text"
                      maxLength={1}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="w-10 h-10 text-center border rounded text-lg"
                      value={value}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        const newOtp = [...otp];
                        newOtp[i] = val;
                        setOtp(newOtp);
                        if (val && i < 5) {
                          document.getElementById(`otp-${i + 1}`)?.focus();
                        } else if (!val && i > 0) {
                          document.getElementById(`otp-${i - 1}`)?.focus();
                        }
                      }}
                      id={`otp-${i}`}
                    />
                  ))}
                </div>
                <button
                  onClick={async () => {
                    const code = otp.join('');
                    if (code.length !== 6) return toast.error("Enter complete 6-digit OTP");
                    try {
                      const res = await api.post('/auth/verify-reset-otp', {
                        email: resetEmail,
                        otp: code,
                      });
                      if (res.data.success) {
                        toast.success("OTP Verified");
                        setOtpVerified(true);
                        setResetStep(3);
                      } else {
                        toast.error(res.data.message);
                      }
                    } catch {
                      toast.error("Verification failed");
                    }
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded w-full"
                >
                  Verify OTP
                </button>
                <button
                  type="button"
                  className="mt-3 text-gray-500 hover:underline w-full"
                  onClick={() => setShowResetForm(false)}
                >
                  Back to Login
                </button>
              </>
            )}

            {resetStep === 3 && otpVerified && (
              <>
                <div className="flex items-center text-green-600 mb-2 text-sm gap-2">
                  <CheckCircle size={20} /> OTP verified successfully
                </div>
                <input
                  type="password"
                  placeholder="New Password"
                  className="w-full px-4 py-2 border rounded mb-3"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  onClick={async () => {
                    if (!newPassword) return toast.error("Enter a new password");
                    try {
                      const res = await api.post('/auth/reset-password', {
                        email: resetEmail,
                        newPassword,
                      });
                      if (res.data.success) {
                        toast.success("Password updated!");
                        setShowResetForm(false);
                        setResetStep(1);
                        setOtp(['', '', '', '', '', '']);
                        setOtpVerified(false);
                        setNewPassword('');
                      } else toast.error(res.data.message);
                    } catch {
                      toast.error("Reset failed");
                    }
                  }}
                  className="bg-indigo-600 text-white px-4 py-2 rounded w-full"
                >
                  Set New Password
                </button>
                <button
                  type="button"
                  className="mt-3 text-gray-500 hover:underline w-full"
                  onClick={() => setShowResetForm(false)}
                >
                  Back to Login
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
