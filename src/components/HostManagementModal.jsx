import React, { useState } from 'react';
import { X, CheckCircle, AlertTriangle, Users, Settings, Send } from 'lucide-react';
import api from '../utility/api';

const HostManagementModal = ({ event, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('status'); 
  const [cancelReason, setCancelReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null); // 🟢 Added for request loading states

  if (!event) return null;

  // 🟢 Event Status Pipeline
  const handleStatusUpdate = async (newStatus) => {
    if (newStatus === 'cancelled' && !cancelReason.trim()) {
      return alert("Please provide a reason for cancelling so we can notify the guests.");
    }

    setLoading(true);
    try {
      const res = await api.put('/event/status', {
        eventId: event._id,
        newStatus,
        cancelReason: newStatus === 'cancelled' ? cancelReason : undefined
      });

      if (res.data.success) {
        alert(res.data.message);
        onUpdate(); 
        onClose();
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update event status");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 🟢 Approve/Reject Request Pipeline
  const handleQuickResponse = async (userId, status) => {
    setActionLoadingId(userId);
    try {
      const res = await api.put(`/event/respond/${event._id}`, { userId, status });
      if (res.data.success) {
        alert(`Guest ${status} successfully!`);
        onUpdate(); // Trigger dashboard refresh
      }
    } catch (error) {
      alert(error.response?.data?.message || "Something went wrong");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative border border-gray-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-extrabold text-gray-800 truncate pr-4">{event.title}</h2>
            <p className="text-xs font-medium text-gray-500 mt-0.5">Manage your event lifecycle</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 shadow-sm transition-all border border-gray-200">
            <X size={18} />
          </button>
        </div>

        {/* Custom Tabs */}
        <div className="flex border-b border-gray-100 bg-white px-4 pt-2">
          <button 
            onClick={() => setActiveTab('status')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'status' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <Settings size={16} /> Event Status
          </button>
          <button 
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'requests' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <Users size={16} /> Action Center
            {/* Notification Dot */}
            {event.requests?.filter(r => r.status === 'pending').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500 ml-1 animate-pulse"></span>
            )}
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto bg-white">
          
          {/* TAB 1: EVENT STATUS */}
          {activeTab === 'status' && (
            <div className="space-y-6">
              <div className="bg-green-50/50 border border-green-100 p-5 rounded-2xl">
                <div className="flex items-start gap-4">
                  <div className="bg-green-100 p-3 rounded-full text-green-600 mt-1">
                    <CheckCircle size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800">Mark as Completed</h3>
                    <p className="text-sm text-gray-600 mt-1 mb-4">
                      Is the match over? Mark this event as completed to trigger feedback emails to your attendees so they can rate you.
                    </p>
                    <button 
                      onClick={() => handleStatusUpdate('completed')}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 flex items-center gap-2"
                    >
                      <CheckCircle size={16} /> Complete Event
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-red-50/50 border border-red-100 p-5 rounded-2xl">
                <div className="flex items-start gap-4">
                  <div className="bg-red-100 p-3 rounded-full text-red-600 mt-1">
                    <AlertTriangle size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800">Cancel Event</h3>
                    {!showCancelConfirm ? (
                      <>
                        <p className="text-sm text-gray-600 mt-1 mb-4">
                          Need to call it off? This will hide the event and email all approved guests an apology with your reason.
                        </p>
                        <button 
                          onClick={() => setShowCancelConfirm(true)}
                          className="bg-red-100 hover:bg-red-200 text-red-700 px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2"
                        >
                          <AlertTriangle size={16} /> Cancel Event
                        </button>
                      </>
                    ) : (
                      <div className="mt-3 space-y-3 animate-fade-in">
                        <textarea 
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          placeholder="Why are you cancelling? (e.g., Rain delay, emergency...)"
                          className="w-full bg-white border border-red-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none h-24"
                        />
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleStatusUpdate('cancelled')}
                            disabled={loading || !cancelReason.trim()}
                            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2"
                          >
                            <Send size={16} /> Send Cancellation
                          </button>
                          <button 
                            onClick={() => setShowCancelConfirm(false)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-bold text-sm transition-all"
                          >
                            Go Back
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 🟢 TAB 2: FULL-FLEDGED ACTION CENTER */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Pending Requests</h3>
              {event.requests?.filter(r => r.status === 'pending').length > 0 ? (
                event.requests.filter(r => r.status === 'pending').map((request, idx) => {
                  
                  // 🔥 THE BULLETPROOF ID EXTRACTOR 🔥
                  const guestId = typeof request.user === 'object' ? request.user._id : request.user;
                  const guestName = typeof request.user === 'object' ? request.user.name : 'New User';

                  return (
                    <div key={guestId || idx} className="bg-gray-50 border border-gray-100 p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{guestName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Requested on {new Date(request.requestedAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleQuickResponse(guestId, 'rejected')}
                          disabled={actionLoadingId === guestId}
                          className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button 
                          onClick={() => handleQuickResponse(guestId, 'approved')}
                          disabled={actionLoadingId === guestId}
                          className="px-4 py-2 bg-green-500 text-white hover:bg-green-600 rounded-lg text-sm font-bold shadow-md transition-colors disabled:opacity-50"
                        >
                          Approve
                        </button>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8 border border-dashed border-gray-200 rounded-2xl bg-gray-50">
                  <Users size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">No pending requests right now.</p>
                </div>
              )}

              {/* Approved Guests Roster */}
              <div className="mt-8">
                <h3 className="text-lg font-bold text-gray-800 mb-3">Approved Guests</h3>
                <div className="space-y-2">
                  {event.requests?.filter(r => r.status === 'approved').length > 0 ? (
                    event.requests.filter(r => r.status === 'approved').map((request, idx) => {
                      const guestId = typeof request.user === 'object' ? request.user._id : request.user;
                      const guestName = typeof request.user === 'object' ? request.user.name : 'User';
                      return (
                        <div key={guestId || idx} className="bg-green-50/50 border border-green-100 p-3 rounded-xl flex items-center justify-between">
                          <p className="font-bold text-gray-800 text-sm">{guestName}</p>
                          <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-md">Approved</span>
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-sm text-gray-400 italic bg-gray-50 p-3 rounded-xl border border-dashed border-gray-200">No approved guests yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default HostManagementModal;