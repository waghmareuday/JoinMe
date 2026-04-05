import React, { useState, useEffect, useMemo } from 'react';
import { X, CheckCircle, AlertTriangle, Users, Settings, Send, Link2, Trash2, Copy, Clock, MapPin, CreditCard, TrendingUp, ShieldCheck, UserX, BarChart3, Share2, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utility/api';
import UserProfileModal from './UserProfileModal';

const HostManagementModal = ({ event, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [cancelReason, setCancelReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [inviteLink, setInviteLink] = useState('');
  const [viewProfileId, setViewProfileId] = useState(null);

  // Fetch invite token on mount
  useEffect(() => {
    if (event?._id) {
      api.get(`/event/invite-token/${event._id}`)
        .then(res => {
          if (res.data.success && res.data.inviteToken) {
            setInviteLink(`${window.location.origin}/invite/${res.data.inviteToken}`);
          }
        })
        .catch(() => {});
    }
  }, [event?._id]);

  // -- Smart insights computed from event data
  const insights = useMemo(() => {
    if (!event) return {};
    const requests = event.requests || [];
    const approved = requests.filter(r => r.status === 'approved');
    const pending = requests.filter(r => r.status === 'pending');
    const rejected = requests.filter(r => r.status === 'rejected');
    const capacity = event.requiredPeople || 0;
    const spotsLeft = Math.max(0, capacity - approved.length);
    const fillPct = capacity > 0 ? Math.round((approved.length / capacity) * 100) : 0;
    const waitlist = event.waitlist || [];
    const revenue = event.isPaid ? approved.length * (event.amount || 0) : 0;
    const eventDate = event.date ? new Date(event.date) : null;
    const daysUntil = eventDate ? Math.ceil((eventDate - new Date()) / (1000 * 60 * 60 * 24)) : null;
    return { approved, pending, rejected, capacity, spotsLeft, fillPct, waitlist, revenue, daysUntil };
  }, [event]);

  if (!event) return null;

  // Event Status Pipeline
  const handleStatusUpdate = async (newStatus) => {
    if (newStatus === 'cancelled' && !cancelReason.trim()) {
      return toast.error("Please provide a reason for cancelling so we can notify the guests.");
    }
    setLoading(true);
    try {
      const res = await api.put('/event/status', {
        eventId: event._id,
        newStatus,
        cancelReason: newStatus === 'cancelled' ? cancelReason : undefined
      });
      if (res.data.success) {
        toast.success(res.data.message);
        onUpdate();
        onClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update event status");
    } finally {
      setLoading(false);
    }
  };

  // Approve/Reject Pipeline
  const handleQuickResponse = async (userId, status) => {
    setActionLoadingId(userId);
    try {
      const res = await api.put(`/event/respond/${event._id}`, { userId, status });
      if (res.data.success) {
        toast.success(`Guest ${status} successfully!`);
        onUpdate();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Remove approved guest
  const handleRemoveGuest = async (guestId) => {
    setActionLoadingId(guestId);
    try {
      const res = await api.put(`/event/remove-guest/${event._id}`, { userId: guestId });
      if (res.data.success) {
        toast.success('Guest removed');
        onUpdate();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove guest');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Approve all pending
  const handleApproveAll = async () => {
    const pending = insights.pending || [];
    for (const r of pending) {
      const gid = typeof r.user === 'object' ? r.user._id : r.user;
      await handleQuickResponse(gid, 'approved');
    }
  };

  const copyInviteLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      toast.success('Invite link copied!');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'guests', label: 'Guests', icon: Users, badge: insights.pending?.length || 0 },
    { id: 'actions', label: 'Actions', icon: Settings },
    { id: 'share', label: 'Share', icon: Share2 },
  ];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      {viewProfileId && <UserProfileModal userId={viewProfileId} onClose={() => setViewProfileId(null)} />}

      <div className="bg-white dark:bg-slate-900 w-[95%] sm:w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden relative border border-gray-100 dark:border-slate-800 flex flex-col max-h-[90vh]">

        {/* ── Compact Header ── */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-4 flex justify-between items-center flex-shrink-0">
          <div className="min-w-0 pr-4">
            <h2 className="text-lg font-black text-white truncate">{event.title}</h2>
            <div className="flex items-center gap-3 mt-1 text-white/70 text-xs font-medium">
              <span className="flex items-center gap-1"><Clock size={12} /> {event.time}</span>
              <span className="flex items-center gap-1"><MapPin size={12} /> {event.city}</span>
              {event.isPaid && <span className="flex items-center gap-1"><CreditCard size={12} /> ₹{event.amount}</span>}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* ── Tab Bar ── */}
        <div className="flex bg-gray-50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 flex-shrink-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex justify-center items-center gap-1.5 py-3 text-xs font-bold transition-all relative ${
                activeTab === tab.id
                  ? 'text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                  : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300'
              }`}
            >
              <tab.icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.badge > 0 && (
                <span className="absolute top-1.5 right-[calc(50%-8px)] sm:relative sm:top-0 sm:right-0 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-pulse">{tab.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        <div className="overflow-y-auto bg-white dark:bg-slate-900 w-full">

          {/* ━━━ TAB: OVERVIEW ━━━ */}
          {activeTab === 'overview' && (
            <div className="p-5 space-y-5">
              {/* KPI Strip */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Approved', value: insights.approved?.length || 0, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-500/10' },
                  { label: 'Pending', value: insights.pending?.length || 0, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-500/10' },
                  { label: 'Spots Left', value: insights.spotsLeft, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
                  { label: 'Waitlist', value: insights.waitlist?.length || 0, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-500/10' },
                ].map(kpi => (
                  <div key={kpi.label} className={`${kpi.bg} rounded-xl p-3 text-center`}>
                    <p className={`text-xl font-black ${kpi.color}`}>{kpi.value}</p>
                    <p className="text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">{kpi.label}</p>
                  </div>
                ))}
              </div>

              {/* Fill Progress */}
              <div>
                <div className="flex justify-between text-xs font-bold text-gray-500 dark:text-slate-400 mb-1.5">
                  <span>Fill Rate</span>
                  <span>{insights.fillPct}% ({insights.approved?.length}/{insights.capacity})</span>
                </div>
                <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      insights.fillPct >= 100 ? 'bg-red-500' : insights.fillPct >= 75 ? 'bg-amber-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                    }`}
                    style={{ width: `${Math.min(100, insights.fillPct)}%` }}
                  />
                </div>
              </div>

              {/* Smart Alerts */}
              <div className="space-y-2">
                {insights.daysUntil !== null && insights.daysUntil <= 1 && insights.daysUntil >= 0 && (
                  <div className="flex items-center gap-2 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 px-4 py-2.5 rounded-xl">
                    <AlertTriangle size={14} className="text-red-500 shrink-0" />
                    <p className="text-xs font-bold text-red-700 dark:text-red-400">{insights.daysUntil === 0 ? 'Event is TODAY!' : 'Event is TOMORROW!'}</p>
                  </div>
                )}
                {insights.pending?.length > 0 && (
                  <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 px-4 py-2.5 rounded-xl">
                    <Clock size={14} className="text-orange-500 shrink-0" />
                    <p className="text-xs font-bold text-orange-700 dark:text-orange-400">{insights.pending.length} request{insights.pending.length > 1 ? 's' : ''} awaiting your decision</p>
                  </div>
                )}
                {insights.fillPct >= 100 && insights.waitlist?.length > 0 && (
                  <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 px-4 py-2.5 rounded-xl">
                    <TrendingUp size={14} className="text-purple-500 shrink-0" />
                    <p className="text-xs font-bold text-purple-700 dark:text-purple-400">Event full — {insights.waitlist.length} on waitlist</p>
                  </div>
                )}
                {event.isPaid && insights.revenue > 0 && (
                  <div className="flex items-center gap-2 bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 px-4 py-2.5 rounded-xl">
                    <CreditCard size={14} className="text-green-500 shrink-0" />
                    <p className="text-xs font-bold text-green-700 dark:text-green-400">₹{insights.revenue} estimated revenue</p>
                  </div>
                )}
              </div>

              {/* Quick Guest Preview */}
              {insights.approved?.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Confirmed Guests</p>
                  <div className="flex items-center -space-x-2">
                    {insights.approved.slice(0, 8).map((r, i) => {
                      const name = typeof r.user === 'object' ? r.user.name : 'U';
                      return (
                        <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-[10px] font-black border-2 border-white dark:border-slate-900 shrink-0" title={name}>
                          {(name || 'U').charAt(0).toUpperCase()}
                        </div>
                      );
                    })}
                    {insights.approved.length > 8 && (
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-gray-500 dark:text-slate-400 border-2 border-white dark:border-slate-900">+{insights.approved.length - 8}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ━━━ TAB: GUESTS ━━━ */}
          {activeTab === 'guests' && (
            <div className="p-5 space-y-5">
              {/* Pending Requests */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-black text-gray-800 dark:text-white">Pending</h3>
                  {insights.pending?.length > 1 && (
                    <button onClick={handleApproveAll} className="text-[10px] font-black text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-3 py-1 rounded-lg hover:bg-green-100 dark:hover:bg-green-500/20 transition-colors">
                      Approve All ({insights.pending.length})
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {insights.pending?.length > 0 ? insights.pending.map((request, idx) => {
                    const guestId = typeof request.user === 'object' ? request.user._id : request.user;
                    const guestName = typeof request.user === 'object' ? request.user.name : 'New User';
                    const guestRating = typeof request.user === 'object' ? request.user.averageRating : null;
                    return (
                      <div key={guestId || idx} className="bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-3.5 rounded-2xl flex items-center justify-between gap-3 transition-all hover:shadow-md group">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <button
                            onClick={() => guestId && setViewProfileId(guestId)}
                            className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-sm font-black shrink-0 hover:scale-105 transition-transform ring-2 ring-orange-200 dark:ring-orange-500/30"
                          >
                            {(guestName || 'U').charAt(0).toUpperCase()}
                          </button>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{guestName}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-gray-400 dark:text-slate-500">{new Date(request.requestedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                              {guestRating > 0 && <span className="text-[10px] text-yellow-600 font-bold">★ {guestRating.toFixed(1)}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button 
                            onClick={() => handleQuickResponse(guestId, 'rejected')}
                            disabled={actionLoadingId === guestId}
                            className="p-2 bg-white dark:bg-slate-700 border border-red-200 dark:border-red-500/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl text-sm transition-all disabled:opacity-50"
                          ><UserX size={16} /></button>
                          <button 
                            onClick={() => handleQuickResponse(guestId, 'approved')}
                            disabled={actionLoadingId === guestId}
                            className="p-2 bg-green-500 text-white hover:bg-green-600 rounded-xl text-sm shadow-sm transition-all disabled:opacity-50"
                          ><ShieldCheck size={16} /></button>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="text-center py-6 border-2 border-dashed border-gray-100 dark:border-slate-700 rounded-2xl bg-gray-50/50 dark:bg-slate-800/50">
                      <Users size={24} className="mx-auto text-gray-200 dark:text-slate-700 mb-1" />
                      <p className="text-xs font-medium text-gray-400 dark:text-slate-500">No pending requests</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Approved Roster */}
              <div className="pt-4 border-t border-gray-100 dark:border-slate-700">
                <h3 className="text-sm font-black text-gray-800 dark:text-white mb-3">Approved · {insights.approved?.length || 0}/{insights.capacity}</h3>
                <div className="space-y-1.5">
                  {insights.approved?.length > 0 ? insights.approved.map((request, idx) => {
                    const guestId = typeof request.user === 'object' ? request.user._id : request.user;
                    const guestName = typeof request.user === 'object' ? request.user.name : 'User';
                    return (
                      <div key={guestId || idx} className="bg-green-50/50 dark:bg-green-500/5 border border-green-100/50 dark:border-green-500/10 px-3.5 py-2.5 rounded-xl flex items-center justify-between group hover:bg-green-50 dark:hover:bg-green-500/10 transition-colors">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button
                            onClick={() => guestId && setViewProfileId(guestId)}
                            className="w-7 h-7 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-[10px] font-black shrink-0 hover:scale-105 transition-transform"
                          >
                            {(guestName || 'U').charAt(0).toUpperCase()}
                          </button>
                          <p className="text-sm font-bold text-gray-700 dark:text-slate-200 truncate">{guestName}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveGuest(guestId)}
                          disabled={actionLoadingId === guestId}
                          className="p-1 text-red-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50 opacity-0 group-hover:opacity-100"
                          title="Remove guest"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  }) : (
                    <p className="text-xs text-gray-400 dark:text-slate-500 font-medium text-center py-4 border-2 border-dashed border-gray-100 dark:border-slate-700 rounded-xl">No approved guests yet</p>
                  )}
                </div>
              </div>

              {/* Rejected */}
              {insights.rejected?.length > 0 && (
                <div className="pt-4 border-t border-gray-100 dark:border-slate-700">
                  <h3 className="text-sm font-black text-gray-400 dark:text-slate-500 mb-3">Rejected · {insights.rejected.length}</h3>
                  <div className="space-y-1.5 opacity-60">
                    {insights.rejected.map((request, idx) => {
                      const guestName = typeof request.user === 'object' ? request.user.name : 'User';
                      return (
                        <div key={idx} className="px-3.5 py-2 rounded-xl flex items-center gap-2.5 bg-gray-50 dark:bg-slate-800">
                          <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center text-gray-400 dark:text-slate-500 text-[10px] font-black shrink-0">{(guestName || 'U').charAt(0).toUpperCase()}</div>
                          <p className="text-xs font-medium text-gray-400 dark:text-slate-500 truncate line-through">{guestName}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ━━━ TAB: ACTIONS ━━━ */}
          {activeTab === 'actions' && (
            <div className="p-5 space-y-4">
              {/* Complete Event */}
              <button
                onClick={() => handleStatusUpdate('completed')}
                disabled={loading}
                className="w-full bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 p-4 rounded-2xl flex items-center gap-4 hover:bg-green-100 dark:hover:bg-green-500/15 transition-all group disabled:opacity-50"
              >
                <div className="p-2.5 bg-green-100 dark:bg-green-500/20 rounded-xl text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform"><CheckCircle size={22} /></div>
                <div className="text-left flex-1">
                  <h3 className="text-sm font-black text-gray-800 dark:text-white">Mark as Completed</h3>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">End the event and trigger rating emails to all attendees</p>
                </div>
              </button>

              {/* Cancel Event */}
              {!showCancelConfirm ? (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="w-full bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 p-4 rounded-2xl flex items-center gap-4 hover:bg-red-100 dark:hover:bg-red-500/15 transition-all group"
                >
                  <div className="p-2.5 bg-red-100 dark:bg-red-500/20 rounded-xl text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform"><AlertTriangle size={22} /></div>
                  <div className="text-left flex-1">
                    <h3 className="text-sm font-black text-gray-800 dark:text-white">Cancel Event</h3>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">Notify all guests with your cancellation reason</p>
                  </div>
                </button>
              ) : (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-5 rounded-2xl animate-fade-in space-y-3">
                  <h3 className="text-sm font-black text-red-700 dark:text-red-400 flex items-center gap-2"><AlertTriangle size={16} /> Confirm Cancellation</h3>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Tell guests why you're cancelling..."
                    className="w-full bg-white dark:bg-slate-800 border border-red-200 dark:border-red-500/20 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 resize-none h-20 placeholder-gray-400"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusUpdate('cancelled')}
                      disabled={loading || !cancelReason.trim()}
                      className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                    ><Send size={14} /> Confirm Cancel</button>
                    <button onClick={() => setShowCancelConfirm(false)} className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-xl font-bold text-xs transition-all">Back</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ━━━ TAB: SHARE ━━━ */}
          {activeTab === 'share' && (
            <div className="p-5 space-y-5">
              <div className="bg-indigo-50/50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 p-5 rounded-2xl">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400"><Link2 size={18} /></div>
                  <div>
                    <h3 className="text-sm font-black text-gray-800 dark:text-white">Invite Link</h3>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">Share this link — guests are auto-approved</p>
                  </div>
                </div>
                {inviteLink ? (
                  <div className="flex gap-2">
                    <input readOnly value={inviteLink} className="flex-1 text-[11px] bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-gray-600 dark:text-slate-300 font-mono truncate" />
                    <button onClick={copyInviteLink} className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all flex items-center gap-1.5 shrink-0">
                      <Copy size={14} /> Copy
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">Loading invite link...</p>
                )}
              </div>

              {/* Share via actions */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { const text = `Join my event: ${event.title}\n📍 ${event.venue}, ${event.city}\n⏰ ${event.time}\n\n${inviteLink || window.location.origin}`; navigator.clipboard.writeText(text); toast.success('Event details copied!'); }}
                  className="bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-4 rounded-xl text-center hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
                >
                  <Copy size={20} className="mx-auto text-gray-500 dark:text-slate-400 mb-1.5" />
                  <p className="text-[10px] font-bold text-gray-500 dark:text-slate-400">Copy Details</p>
                </button>
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: event.title, text: `Join: ${event.title} at ${event.venue}, ${event.city}`, url: inviteLink || window.location.origin }).catch(() => {});
                    } else {
                      copyInviteLink();
                    }
                  }}
                  className="bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-4 rounded-xl text-center hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
                >
                  <Share2 size={20} className="mx-auto text-gray-500 dark:text-slate-400 mb-1.5" />
                  <p className="text-[10px] font-bold text-gray-500 dark:text-slate-400">Share</p>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default HostManagementModal;