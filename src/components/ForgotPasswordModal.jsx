import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utility/api';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState('email'); // email | otp | reset
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setStep('email');
      setEmail('');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sendOTP = async () => {
    if (!email) return toast.error('Please enter your registered email');
    setLoading(true);
    try {
      const res = await api.post('/auth/send-forget-otp', { email });
      if (res.data.success) {
        toast.success('OTP sent to your email!');
        setStep('otp');
      } else {
        toast.error(res.data.message || 'Failed to send OTP');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'User not found!');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp) return toast.error('Please enter the OTP');
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-reset-otp', { email, otp });
      if (res.data.success) {
        toast.success('OTP verified successfully!');
        setStep('reset');
      } else {
        toast.error(res.data.message || 'Invalid or expired OTP');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const reset = async () => {
    if (!newPassword || !confirmPassword) return toast.error('Please fill in both fields');
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters');

    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', { email, newPassword });
      if (res.data.success) {
        toast.success('Password changed successfully! Please login.');
        onClose();
      } else {
        toast.error(res.data.message || 'Failed to reset password');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setLoading(true);
    try {
      const res = await api.post('/auth/send-forget-otp', { email });
      if (res.data.success) {
        toast.success('A new OTP has been sent!');
      } else {
        toast.error(res.data.message || 'Failed to resend OTP');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm transition-all p-4">
      {/* We use a div here instead of a form to prevent any accidental bubbling */}
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-100" aria-busy={loading}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">
            {step === 'email' ? 'Forgot Password' : step === 'otp' ? 'Enter OTP' : 'Reset Password'}
          </h3>
          <button 
            type="button" 
            className="text-gray-400 hover:text-gray-800 transition-colors p-1 rounded-full hover:bg-gray-100" 
            onClick={onClose}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {step === 'email' && (
          <div className="space-y-5">
            <p className="text-sm text-gray-600">Enter your registered email address and we'll send you an OTP to reset your password.</p>
            <input
              type="email"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus
              disabled={loading}
            />
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" className="px-5 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors" onClick={onClose} disabled={loading}>Cancel</button>
              <button
                type="button"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50"
                onClick={sendOTP}
                disabled={loading}
              >{loading ? 'Sending...' : 'Send OTP'}</button>
            </div>
          </div>
        )}

        {step === 'otp' && (
          <div className="space-y-5">
            <p className="text-sm text-gray-600">We sent a 6-digit code to <span className="font-semibold text-gray-800">{email}</span>.</p>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center tracking-widest text-lg font-bold transition-all"
              placeholder="000000"
              maxLength="6"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              autoFocus
              disabled={loading}
            />
            <div className="flex justify-between items-center pt-2">
              <button type="button" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800" onClick={resend} disabled={loading}>Resend Code</button>
              <div className="flex gap-3">
                <button type="button" className="px-5 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors" onClick={() => setStep('email')} disabled={loading}>Back</button>
                <button
                  type="button"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50"
                  onClick={verifyOTP}
                  disabled={loading}
                >{loading ? 'Verifying...' : 'Verify'}</button>
              </div>
            </div>
          </div>
        )}

        {step === 'reset' && (
          <div className="space-y-5">
            <p className="text-sm text-gray-600">Secure your account with a new password.</p>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              placeholder="New password (min 6 chars)"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              autoFocus
              disabled={loading}
            />
            <input
              type="password"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" className="px-5 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors" onClick={() => setStep('otp')} disabled={loading}>Back</button>
              <button
                type="button"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50"
                onClick={reset}
                disabled={loading}
              >{loading ? 'Saving...' : 'Save Password'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;