import React, { useState } from 'react';
import { X, CheckCircle, AlertTriangle, Users, Settings, Send } from 'lucide-react';
import api from '../utility/api';

const HostManagementModal = ({ event, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('status'); 
  const [cancelReason, setCancelReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null); 

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
        onUpdate(); 
      }
    } catch (error) {
      alert(error.response?.data?.message || "Something went wrong");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      {/* 🟢 Mobile optimized width and max-height */}
      <div className="bg-white w-[95%] sm:w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative border border-gray-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-100 px-5 sm:px-6 py-4 flex justify-between items-center flex-shrink-0">
          <div className="min-w-0 pr-4">
            <h2 className="text-xl sm:text-2xl font-black text-gray-800 truncate">{event.title}</h2>
            <p className="text-xs sm:text-sm font-medium text-gray-500 mt-0.5 truncate">Manage your event lifecycle</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white rounded-full text-gray-400 hover:text-gray-800 hover:bg-gray-200 shadow-sm transition-all border border-gray-200 shrink-0">
            <X size={20} />
          </button>
        </div>

        {/* Custom Tabs - Flex-1 makes them equal width on mobile */}
        <div className="flex border-b border-gray-100 bg-white px-2 sm:px-4 pt-2 flex-shrink-0">
          <button 
            onClick={() => setActiveTab('status')}
            className={`flex-1 flex justify-center items-center gap-2 px-2 sm:px-4 py-3.5 text-xs sm:text-sm font-bold border-b-2 transition-colors ${activeTab === 'status' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
          >
            <Settings size={18} /> <span className="hidden sm:inline">Event</span> Status
          </button>
          <button 
            onClick={() => setActiveTab('requests')}
            className={`flex-1 flex justify-center items-center gap-2 px-2 sm:px-4 py-3.5 text-xs sm:text-sm font-bold border-b-2 transition-colors relative ${activeTab === 'requests' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
          >
            <Users size={18} /> Action Center
            {/* Notification Dot */}
            {event.requests?.filter(r => r.status === 'pending').length > 0 && (
              <span className="absolute top-2 right-4 sm:relative sm:top-0 sm:right-0 w-2 h-2 rounded-full bg-red-500 ml-1 animate-pulse"></span>
            )}
          </button>
        </div>

        {/* Content Area - Scrollable */}
        <div className="p-5 sm:p-6 overflow-y-auto bg-white w-full">
          
          {/* TAB 1: EVENT STATUS */}
          {activeTab === 'status' && (
            <div className="space-y-4 sm:space-y-6">
              
              {/* Complete Event Card */}
              <div className="bg-green-50/50 border border-green-100 p-4 sm:p-5 rounded-2xl sm:rounded-3xl">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="bg-green-100 p-3 rounded-full text-green-600 shrink-0">
                    <CheckCircle size={24} />
                  </div>
                  <div className="flex-1 w-full">
                    <h3 className="text-lg font-black text-gray-800">Mark as Completed</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1 mb-4 leading-relaxed">
                      Is the match over? Mark this event as completed to trigger feedback emails to your attendees so they can rate you.
                    </p>
                    <button 
                      onClick={() => handleStatusUpdate('completed')}
                      disabled={loading}
                      className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-5 py-3 sm:py-2.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={18} /> Complete Event
                    </button>
                  </div>
                </div>
              </div>

              {/* Cancel Event Card */}
              <div className="bg-red-50/50 border border-red-100 p-4 sm:p-5 rounded-2xl sm:rounded-3xl">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="bg-red-100 p-3 rounded-full text-red-600 shrink-0">
                    <AlertTriangle size={24} />
                  </div>
                  <div className="flex-1 w-full">
                    <h3 className="text-lg font-black text-gray-800">Cancel Event</h3>
                    {!showCancelConfirm ? (
                      <>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1 mb-4 leading-relaxed">
                          Need to call it off? This will hide the event and email all approved guests an apology with your reason.
                        </p>
                        <button 
                          onClick={() => setShowCancelConfirm(true)}
                          className="w-full sm:w-auto bg-red-100 hover:bg-red-200 text-red-700 px-5 py-3 sm:py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                        >
                          <AlertTriangle size={18} /> Cancel Event
                        </button>
                      </>
                    ) : (
                      <div className="mt-3 space-y-3 animate-fade-in w-full">
                        <textarea 
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          placeholder="Why are you cancelling? (e.g., Rain delay...)"
                          className="w-full bg-white border border-red-200 rounded-xl p-3 sm:p-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none h-24 shadow-inner"
                        />
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button 
                            onClick={() => handleStatusUpdate('cancelled')}
                            disabled={loading || !cancelReason.trim()}
                            className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-3 sm:py-2.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                          >
                            <Send size={18} /> Send Cancellation
                          </button>
                          <button 
                            onClick={() => setShowCancelConfirm(false)}
                            className="w-full sm:w-auto bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 px-5 py-3 sm:py-2.5 rounded-xl font-bold text-sm transition-all text-center"
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
            <div className="space-y-6">
              
              <div>
                <h3 className="text-lg font-black text-gray-800 mb-3">Pending Requests</h3>
                <div className="space-y-3">
                  {event.requests?.filter(r => r.status === 'pending').length > 0 ? (
                    event.requests.filter(r => r.status === 'pending').map((request, idx) => {
                      
                      const guestId = typeof request.user === 'object' ? request.user._id : request.user;
                      const guestName = typeof request.user === 'object' ? request.user.name : 'New User';

                      return (
                        <div key={guestId || idx} className="bg-gray-50 border border-gray-200 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:shadow-md">
                          <div className="w-full">
                            <p className="font-bold text-gray-800 text-sm sm:text-base">{guestName}</p>
                            <p className="text-xs font-medium text-gray-500 mt-0.5">Requested: {new Date(request.requestedAt).toLocaleDateString()}</p>
                          </div>
                          
                          {/* 🟢 Mobile Optimized Action Buttons */}
                          <div className="flex gap-2 w-full sm:w-auto shrink-0">
                            <button 
                              onClick={() => handleQuickResponse(guestId, 'rejected')}
                              disabled={actionLoadingId === guestId}
                              className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 bg-white border border-red-200 text-red-500 hover:bg-red-50 rounded-xl text-sm font-bold transition-all disabled:opacity-50 text-center shadow-sm"
                            >
                              Reject
                            </button>
                            <button 
                              onClick={() => handleQuickResponse(guestId, 'approved')}
                              disabled={actionLoadingId === guestId}
                              className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 bg-green-500 text-white hover:bg-green-600 hover:-translate-y-0.5 rounded-xl text-sm font-bold shadow-md transition-all disabled:opacity-50 text-center"
                            >
                              Approve
                            </button>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                      <Users size={32} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-sm font-medium text-gray-500">No pending requests right now.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Approved Guests Roster */}
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-lg font-black text-gray-800 mb-3">Approved Guests</h3>
                <div className="space-y-2">
                  {event.requests?.filter(r => r.status === 'approved').length > 0 ? (
                    event.requests.filter(r => r.status === 'approved').map((request, idx) => {
                      const guestId = typeof request.user === 'object' ? request.user._id : request.user;
                      const guestName = typeof request.user === 'object' ? request.user.name : 'User';
                      return (
                        <div key={guestId || idx} className="bg-green-50/50 border border-green-100 px-4 py-3 rounded-xl flex items-center justify-between">
                          <p className="font-bold text-gray-800 text-sm">{guestName}</p>
                          <span className="text-[10px] sm:text-xs font-black tracking-wider text-green-700 bg-green-200/50 px-2.5 py-1 rounded-md uppercase">Approved</span>
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-sm text-gray-400 font-medium italic bg-gray-50 p-4 rounded-xl border-2 border-dashed border-gray-100 text-center">No approved guests yet.</p>
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