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
      // reset internal state when modal closes
      setStep('email');
      setEmail('');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Prevent Enter key from submitting parent form by using local form
  const sendOTP = async () => {
    if (!email) return toast.error('Please enter your registered email');
    setLoading(true);
    try {
      const res = await api.post('/auth/send-forget-otp', { email });
      if (res.data.success) {
        toast.success('OTP sent to your email');
        setStep('otp');
      } else {
        toast.error(res.data.message || 'Failed to send OTP');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Server error');
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
        toast.success('OTP verified');
        setStep('reset');
      } else {
        toast.error(res.data.message || 'Invalid or expired OTP');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  const reset = async () => {
    if (!newPassword || !confirmPassword) return toast.error('Please enter and confirm your new password');
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters');

    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', { email, newPassword });
      if (res.data.success) {
        toast.success('Password reset successfully');
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
        toast.success('OTP resent');
      } else {
        toast.error(res.data.message || 'Failed to resend OTP');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <form onSubmit={(e) => e.preventDefault()} className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-gray-100" aria-busy={loading}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Forgot Password</h3>
          <button type="button" className="text-gray-500 hover:text-gray-800" onClick={onClose}>&times;</button>
        </div>

        {step === 'email' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Enter the registered email and we'll send you an OTP to reset your password.</p>
            <input
              type="email"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus
              disabled={loading}
            />
            <div className="flex justify-end gap-2">
              <button type="button" className="px-4 py-2 rounded-lg" onClick={onClose} disabled={loading}>Cancel</button>
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
                onClick={sendOTP}
                disabled={loading}
              >{loading ? 'Sending...' : 'Send OTP'}</button>
            </div>
          </div>
        )}

        {step === 'otp' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">We sent an OTP to <span className="font-medium">{email}</span>. Enter it below.</p>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Enter OTP"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              autoFocus
              disabled={loading}
            />
            <div className="flex justify-between items-center">
              <button type="button" className="text-sm text-blue-600 hover:underline" onClick={resend} disabled={loading}>Resend OTP</button>
              <div className="flex gap-2">
                <button type="button" className="px-4 py-2 rounded-lg" onClick={() => setStep('email')} disabled={loading}>Back</button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
                  onClick={verifyOTP}
                  disabled={loading}
                >{loading ? 'Verifying...' : 'Verify OTP'}</button>
              </div>
            </div>
          </div>
        )}

        {step === 'reset' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Set a new password for <span className="font-medium">{email}</span>.</p>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="New password (min 6 chars)"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              autoFocus
              disabled={loading}
            />
            <input
              type="password"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
            <div className="flex justify-end gap-2">
              <button type="button" className="px-4 py-2 rounded-lg" onClick={() => setStep('otp')} disabled={loading}>Back</button>
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
                onClick={reset}
                disabled={loading}
              >{loading ? 'Saving...' : 'Save Password'}</button>
            </div>
          </div>
        )}

      </form>
    </div>
  );
};

export default ForgotPasswordModal;
