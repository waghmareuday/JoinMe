import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import api from '../utility/api';
import { useUser } from '../context/userContext';

const InviteJoin = () => {
  const { token } = useParams();
  const { user } = useUser();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) {
      setStatus('error');
      setMessage('Please log in first, then open this invite link again.');
      return;
    }

    const joinViaInvite = async () => {
      try {
        const res = await api.post(`/event/join-invite/${token}`);
        if (res.data.success) {
          setStatus('success');
          setMessage(res.data.message || 'You have been added to the event!');
          setTimeout(() => navigate('/dashboard'), 3000);
        } else {
          setStatus('error');
          setMessage(res.data.message || 'Failed to join event.');
        }
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Invalid or expired invite link.');
      }
    };

    joinViaInvite();
  }, [token, user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-gray-900 dark:to-gray-800 pt-20 px-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-10 max-w-md w-full text-center border border-gray-100 dark:border-gray-800">
        {status === 'loading' && (
          <>
            <Loader2 size={48} className="mx-auto text-indigo-500 animate-spin mb-4" />
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Joining Event...</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Please wait while we process your invite.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">You're In!</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">{message}</p>
            <p className="text-xs text-gray-400 mt-4">Redirecting to dashboard...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle size={48} className="mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Oops!</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">{message}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-6 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all"
            >
              Go to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default InviteJoin;
