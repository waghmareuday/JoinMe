import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PlusCircle, Search, Calendar, MapPin, Compass, Bookmark, Bell, Crown, Ticket, MessageCircle, Settings, History, Sparkles, Users, CheckCircle, XCircle, Clock, TrendingUp, CalendarCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utility/api';
import { useUser } from '../context/userContext';
import { CITIES } from '../constants/cities';

// Components
import EventCard from '../components/EventCard';
import SkeletonCard from '../components/SkeletonCard';
import Sidebar from '../components/Sidebar';
import PostEventModal from '../components/PostEventModal';
import EventDetailsModal from '../components/EventDetailsModal';
import HostManagementModal from '../components/HostManagementModal';
import EventChatModal from '../components/EventChatModal';
import RatingModal from '../components/RatingModal';
// Asset Imports
import turfImg from '../assets/turf.png';
import footballImg from '../assets/football.png';
import volleyballImg from '../assets/volleyball.png';
import movieImg from '../assets/movie.png';
import tripImg from '../assets/trip.png';
import carpoolingImg from '../assets/carpooling.png';

const slogans = [
  "Let's make new memories today!",
  "Find your perfect partner for the moment!",
  "Because shared moments matter."
];

const categoryMenu = [
  { title: "Cricket", bgImage: turfImg, category: "Cricket" },
  { title: "Football", bgImage: footballImg, category: "Football" },
  { title: "Volleyball", bgImage: volleyballImg, category: "Volleyball" },
  { title: "Movie", bgImage: movieImg, category: "Movie" },
  { title: "Trip Buddy", bgImage: tripImg, category: "Trip" },
  { title: "Ride Sharing", bgImage: carpoolingImg, category: "Carpooling" },
  { title: "Other", bgImage: turfImg, category: "Other" },
];

const Dashboard = () => {
  const { user } = useUser();
  const [viewMode, setViewMode] = useState('explore');
  const [openPostModal, setOpenPostModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const [category, setCategory] = useState('All');
  const [selectedCity, setSelectedCity] = useState('Mumbai');
  const [selectedDate, setSelectedDate] = useState('');
  const [liveCounts, setLiveCounts] = useState({});

  const [refreshKey, setRefreshKey] = useState(0);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // 🟢 Modals State
  const [chatEvent, setChatEvent] = useState(null);
  const [userToRate, setUserToRate] = useState(null);
  const [managingEvent, setManagingEvent] = useState(null);

  useEffect(() => {
    if (user?.city) setSelectedCity(user.city);
  }, [user]);

  // SOCKET CONNECTION
  useEffect(() => {
    let mounted = true;
    let socketInstance = null;
    let handleNewEventRef = null;
    let handleCatsRef = null;

    import('../utility/socket').then(({ default: socket }) => {
      socketInstance = socket;
      // socket.connect() removed; globally managed by UserProvider
      socket.joinCity(selectedCity);

      handleNewEventRef = (e) => {
        if (!mounted) return;
        if (e.city?.toLowerCase() === selectedCity.toLowerCase()) {
          setEvents(prev => {
            if (prev.some(it => String(it._id) === String(e._id))) {
              return prev.map(it => String(it._id) === String(e._id) ? e : it);
            }
            return [e, ...prev];
          });
          setLiveCounts(prev => ({ ...prev, [e.category]: (prev[e.category] || 0) + 1 }));
        }
      };

      handleCatsRef = ({ categories }) => {
        if (!mounted) return;
        const countsObj = {};
        if (Array.isArray(categories)) categories.forEach(c => { countsObj[c.category] = c.count; });
        setLiveCounts(countsObj);
      };

      socket.on('newEvent', handleNewEventRef);
      socket.on('categoryCountsUpdated', handleCatsRef);

      if (viewMode === 'explore') {
        (async () => {
          try {
            const res = await api.get(`/event/categories?city=${encodeURIComponent(selectedCity)}`);
            if (res.data?.success) handleCatsRef({ categories: res.data.categories });
          } catch (err) { console.error(err); }
        })();
      }
    }).catch(console.error);

    return () => {
      mounted = false;
      if (socketInstance) {
        if (handleNewEventRef) socketInstance.off('newEvent', handleNewEventRef);
        if (handleCatsRef) socketInstance.off('categoryCountsUpdated', handleCatsRef);
        socketInstance.leaveCity(selectedCity);
      }
    };
  }, [selectedCity, viewMode]);

  // FETCH EVENTS
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        if (viewMode === 'myEvents') {
          const res = await api.get('/event/my-events');
          if (res.data?.success) setEvents(res.data.events || []);
        } else if (viewMode === 'forYou') {
          const q = new URLSearchParams();
          q.set('city', selectedCity);
          if (category !== 'All') q.set('category', category);
          if (search) q.set('search', search);
          const res = await api.get(`/event/smart-feed?${q.toString()}`);
          if (res.data?.success) setEvents(res.data.events || []);
        } else {
          const q = new URLSearchParams();
          q.set('city', selectedCity);
          if (category !== 'All') q.set('category', category);
          if (search) q.set('search', search);
          if (selectedDate) q.set('date', selectedDate);

          const res = await api.get(`/event/all?${q.toString()}`);
          if (res.data?.success) setEvents(res.data.events || []);
        }
      } catch (err) {
        console.error('Failed loading events', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [selectedCity, category, search, viewMode, refreshKey]);

  // 🟢 STRIPE PAYMENT VERIFIER (run once)
  const paymentVerifiedRef = useRef(false);
  useEffect(() => {
    if (!user || paymentVerifiedRef.current) return;

    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');

    if (sessionId) {
      paymentVerifiedRef.current = true;
      // Clean URL immediately to prevent duplicate verification on re-renders
      window.history.replaceState({}, document.title, window.location.pathname);

      api.post('/payment/verify-session', { sessionId })
        .then(res => {
          if (res.data.success) {
            toast.success("Payment Successful! You have been added to the match. 🎉");
            setRefreshKey(prev => prev + 1);
          }
        })
        .catch(err => {
          console.error("Payment verification failed", err);
          toast.error("Payment verification failed. Please contact support.");
        });
    }
  }, [user]);

  // 1-CLICK QUICK ACTION FUNCTION
  const handleQuickResponse = async (eventId, userId, status) => {
    setActionLoadingId(userId);
    try {
      const res = await api.put(`/event/respond/${eventId}`, { userId, status });
      if (res.data.success) {
        setRefreshKey(prev => prev + 1);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setActionLoadingId(null);
    }
  };

  const currentUserId = String(user?._id || user?.id);

  const getCreatorId = (event) => {
    if (!event || !event.creator) return '';
    return typeof event.creator === 'object' ? String(event.creator._id) : String(event.creator);
  };

  const isEventFull = (event) => {
    const approvedCount = event.requests?.filter(r => r.status === 'approved').length || 0;
    return approvedCount >= (event.requiredPeople || 1);
  };

  const exploreEvents = useMemo(() => events.filter(e => {
    const isCreator = getCreatorId(e) === currentUserId;
    const hasRequested = e.requests?.some(r => String(r.user?._id || r.user) === currentUserId);
    const full = isEventFull(e);
    const isActive = e.status !== 'completed' && e.status !== 'cancelled';

    return !isCreator && !hasRequested && !full && isActive;
  }), [events, currentUserId]);

  const dynamicCategoryCounts = useMemo(() => {
    const counts = {};
    exploreEvents.forEach(e => {
      counts[e.category] = (counts[e.category] || 0) + 1;
    });
    return counts;
  }, [exploreEvents]);

  const displayedEvents = useMemo(() => {
    let list = exploreEvents;
    if (category !== 'All') list = list.filter(e => e.category === category);
    if (search) list = list.filter(e => (e.title || '').toLowerCase().includes(search.toLowerCase()));
    if (selectedDate) {
      list = list.filter(e => {
        const d = e.date || e.eventDate;
        if (!d) return false;
        return new Date(d).toISOString().slice(0, 10) === selectedDate;
      });
    }
    return list;
  }, [exploreEvents, category, search, selectedDate]);

  const myHostedEvents = useMemo(() => events.filter(e => getCreatorId(e) === currentUserId), [events, currentUserId]);

  const myJoinedEvents = useMemo(() => events.filter(e => {
    const isCreator = getCreatorId(e) === currentUserId;
    const hasRequested = e.requests?.some(r => String(r.user?._id || r.user) === currentUserId);
    return !isCreator && hasRequested;
  }), [events, currentUserId]);

  const activeHostedEvents = useMemo(() => myHostedEvents.filter(e => e.status !== 'completed' && e.status !== 'cancelled'), [myHostedEvents]);
  const pastHostedEvents = useMemo(() => myHostedEvents.filter(e => e.status === 'completed' || e.status === 'cancelled'), [myHostedEvents]);

  const activeJoinedEvents = useMemo(() => myJoinedEvents.filter(e => e.status !== 'completed' && e.status !== 'cancelled'), [myJoinedEvents]);
  const pastJoinedEvents = useMemo(() => myJoinedEvents.filter(e => e.status === 'completed' || e.status === 'cancelled'), [myJoinedEvents]);

  const pendingRequests = useMemo(() => {
    let requests = [];
    activeHostedEvents.forEach(event => {
      if (Array.isArray(event.requests)) {
        event.requests.forEach(req => {
          if (req.status === 'pending') {
            requests.push({ event, request: req });
          }
        });
      }
    });
    return requests.sort((a, b) => new Date(b.request.requestedAt) - new Date(a.request.requestedAt));
  }, [activeHostedEvents]);

  if (!user) return <div className="min-h-screen flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold dark:bg-slate-950">Loading Dashboard...</div>;
  const firstName = user?.name ? user.name.split(' ')[0] : 'User';

  return (
    <>
      <div className="flex bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-slate-950 dark:to-slate-900 min-h-[calc(100vh-4rem)]">
        <Sidebar onCityChange={setSelectedCity} onCategorySelect={setCategory} onSearchChange={setSearch} onDateChange={setSelectedDate} currentCategory={category} categoryCounts={Object.entries(dynamicCategoryCounts).map(([category, count]) => ({ category, count }))} />

        <main className="flex-1 p-4 sm:p-6 lg:p-10 overflow-y-auto relative w-full">

          {/* VIEW TOGGLE - Made wrap on small screens */}
          <div className="flex flex-wrap gap-3 mb-6 bg-slate-900 dark:bg-slate-900 p-2 rounded-2xl w-full sm:w-fit shadow-sm border border-gray-100 dark:border-slate-800">
            <button onClick={() => { setViewMode('explore'); setCategory('All'); }} className={`flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl font-bold transition-all text-sm sm:text-base ${viewMode === 'explore' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}>
              <Compass size={18} /> Explore Hub
            </button>
            {user && (
              <button onClick={() => setViewMode('forYou')} className={`flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl font-bold transition-all text-sm sm:text-base ${viewMode === 'forYou' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}>
                <Sparkles size={18} /> For You
              </button>
            )}
            <button onClick={() => setViewMode('myEvents')} className={`flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl font-bold transition-all relative text-sm sm:text-base ${viewMode === 'myEvents' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}>
              <Bookmark size={18} /> My Events
              {pendingRequests.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white animate-bounce">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          </div>

          {/* HEADER - Mobile optimized stacking */}
          <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-lg dark:shadow-none border border-gray-100 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-md">
                  {(firstName || 'U').charAt(0)}
                </div>
                <div className="flex-1 w-full">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight">
                        {viewMode === 'explore' ? `Your Hub — ${selectedCity}` : viewMode === 'forYou' ? 'Recommended for You' : 'Your Dashboard'}
                      </h2>
                      <p className="text-gray-600 dark:text-slate-400 mt-1 text-sm sm:text-base">Hello {firstName}, {slogans[0]}</p>
                    </div>
                    {viewMode === 'explore' && (
                      <div className="w-full sm:w-auto flex items-center bg-gray-50 dark:bg-slate-800 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors cursor-pointer">
                        <MapPin size={18} className="text-indigo-500 dark:text-indigo-400 mr-2 shrink-0" />
                        <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)} className="w-full bg-transparent text-sm font-bold text-gray-700 dark:text-slate-200 focus:outline-none cursor-pointer">
                          {CITIES.map(c => <option key={c} value={c} className="bg-white text-gray-900 dark:bg-slate-800 dark:text-white font-medium">{c}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {viewMode === 'explore' && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-lg dark:shadow-none border border-gray-100 dark:border-slate-800 flex flex-col gap-3">
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 text-gray-400 dark:text-slate-500" size={18} />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search events..." className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-gray-50 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500" />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <div className="flex-1 flex items-center bg-gray-50 dark:bg-slate-800 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700">
                    <Calendar size={18} className="text-indigo-500 dark:text-indigo-400 mr-2 shrink-0" />
                    <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="bg-transparent text-sm w-full outline-none font-medium text-gray-700 dark:text-slate-200 cursor-pointer" />
                  </div>
                  <button onClick={() => { setCategory('All'); setSearch(''); setSelectedDate(''); }} className="px-4 py-2.5 text-sm font-bold text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl transition-colors">Reset</button>
                </div>
              </div>
            )}
          </div>

          {/* EXPLORE MODE: Categories */}
          {viewMode === 'explore' && category === 'All' && !search && (
            <section className="mb-10">
              <h3 className="text-xl sm:text-2xl font-black text-gray-800 dark:text-white mb-4 sm:mb-6">Browse Categories</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {categoryMenu.map((item) => {
                  const count = dynamicCategoryCounts[item.category] || 0;
                  return (
                    <div key={item.category} onClick={() => setCategory(item.category)} className="group relative h-48 sm:h-56 lg:h-64 rounded-3xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300">
                      <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: `url(${item.bgImage})` }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent group-hover:from-black/90 transition-all" />
                      {count > 0 && <div className="absolute top-4 right-4 bg-red-500 text-white text-[11px] sm:text-xs font-black px-3 py-1.5 rounded-full shadow-lg z-10 animate-pulse border-2 border-white">{count} Events Live</div>}
                      <div className="absolute bottom-0 left-0 p-5 sm:p-6 w-full transform transition-transform duration-300 group-hover:-translate-y-2">
                        <h3 className="text-2xl font-black text-white mb-1">{item.title}</h3>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* EXPLORE MODE: Search Results */}
          {viewMode === 'explore' && (category !== 'All' || search) && (
            <section className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <button onClick={() => setCategory('All')} className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors">← Back to Hub</button>
                <h3 className="text-xl sm:text-2xl font-black text-gray-800 dark:text-white">{category === 'All' ? 'Explore Matches' : `${category} Events`}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                  <>{[1, 2, 3].map(i => <SkeletonCard key={i} />)}</>
                ) : displayedEvents.length > 0 ? displayedEvents.map((event) => (
                  <EventCard key={event._id} event={event} bgImage={categoryMenu.find(c => c.category === event.category)?.bgImage || turfImg} onClick={() => setSelectedEvent(event)} />
                )) : (
                  <div className="col-span-full py-16 flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-inner">
                    <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-md flex items-center justify-center mb-4 transform -rotate-3">
                      <Sparkles className="text-indigo-500" size={28} />
                    </div>
                    <h4 className="text-xl font-black text-gray-900 dark:text-white mb-2">Be the pioneer!</h4>
                    <p className="text-gray-500 dark:text-slate-400 font-medium max-w-sm text-center mb-6">Looks like no one has posted in this category yet. This is your chance to own the spotlight.</p>
                    <button onClick={() => setOpenPostModal(true)} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95">Post the First Event</button>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* FOR YOU MODE: Smart Feed (JM-016) */}
          {viewMode === 'forYou' && (
            <section className="mb-10 min-h-[50vh]">
              <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg">
                   <Sparkles size={18} className="text-indigo-600 dark:text-indigo-400" />
                 </div>
                 <h3 className="text-xl sm:text-2xl font-black text-gray-800 dark:text-white">AI-Powered Picks</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                  <>{[1, 2, 3].map(i => <SkeletonCard key={i} />)}</>
                ) : displayedEvents.length > 0 ? displayedEvents.map((event) => (
                  <EventCard key={event._id} event={event} bgImage={categoryMenu.find(c => c.category === event.category)?.bgImage || turfImg} onClick={() => setSelectedEvent(event)} />
                )) : (
                  <div className="col-span-full py-16 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm transition-all animate-fade-in">
                    <div className="w-20 h-20 bg-indigo-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6">
                      <Sparkles className="text-indigo-500" size={32} />
                    </div>
                    <h4 className="text-xl font-black text-gray-900 dark:text-white mb-2">Finding your vibe...</h4>
                    <p className="text-gray-500 dark:text-slate-400 font-medium max-w-sm text-center mb-8 px-4">We're learning your preferences! Try joining a few events or listing your interests in your profile for a more personalized feed.</p>
                    <button onClick={() => { setViewMode('explore'); setCategory('All'); }} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95">Explore All Events</button>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* MY EVENTS MODE */}
          {viewMode === 'myEvents' && (
            <div className="space-y-8 animate-fade-in">

              {/* ────── SMART OVERVIEW STATS ────── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-gray-100 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg"><Crown size={14} className="text-indigo-500" /></div>
                    <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Hosting</span>
                  </div>
                  <p className="text-2xl font-black text-gray-900 dark:text-white">{activeHostedEvents.length}</p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">{pastHostedEvents.length} completed</p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-gray-100 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg"><Ticket size={14} className="text-emerald-500" /></div>
                    <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Joined</span>
                  </div>
                  <p className="text-2xl font-black text-gray-900 dark:text-white">{activeJoinedEvents.length}</p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">{pastJoinedEvents.length} past</p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-gray-100 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-orange-50 dark:bg-orange-500/10 rounded-lg"><Bell size={14} className="text-orange-500" /></div>
                    <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Pending</span>
                  </div>
                  <p className="text-2xl font-black text-gray-900 dark:text-white">{pendingRequests.length}</p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">need action</p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-gray-100 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-purple-50 dark:bg-purple-500/10 rounded-lg"><TrendingUp size={14} className="text-purple-500" /></div>
                    <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Total</span>
                  </div>
                  <p className="text-2xl font-black text-gray-900 dark:text-white">{myHostedEvents.length + myJoinedEvents.length}</p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">all time</p>
                </div>
              </div>

              {/* ────── HOST INBOX (Priority Alert) ────── */}
              {pendingRequests.length > 0 && (
                <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg dark:shadow-none border border-orange-200 dark:border-orange-500/20 overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3 flex items-center justify-between">
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <Bell size={16} /> Action Required
                    </h3>
                    <span className="text-xs font-bold text-white/80 bg-white/20 px-2.5 py-0.5 rounded-full">{pendingRequests.length} requests</span>
                  </div>
                  <div className="divide-y divide-gray-50 dark:divide-slate-800">
                    {pendingRequests.slice(0, 5).map(({ event: evt, request }) => (
                      <div key={`${evt._id}-${request.user._id}`} className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-black shrink-0">
                            {(request.user?.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-800 dark:text-white truncate">
                              {request.user?.name || 'User'} <span className="font-normal text-gray-400 dark:text-slate-500">→</span> <span className="text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline" onClick={() => setSelectedEvent(evt)}>{evt.title}</span>
                            </p>
                            <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">{new Date(request.requestedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · {evt.time} · {evt.city}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => handleQuickResponse(evt._id, request.user._id, 'rejected')}
                            disabled={actionLoadingId === request.user._id}
                            className="px-4 py-2 bg-white dark:bg-slate-800 text-red-500 border border-red-200 dark:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                          ><XCircle size={14} /></button>
                          <button
                            onClick={() => handleQuickResponse(evt._id, request.user?._id || request.user, 'approved')}
                            disabled={actionLoadingId === request.user._id}
                            className="px-4 py-2 bg-green-500 text-white hover:bg-green-600 rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                          ><CheckCircle size={14} /></button>
                        </div>
                      </div>
                    ))}
                    {pendingRequests.length > 5 && (
                      <div className="px-5 py-3 text-center">
                        <span className="text-xs text-gray-400 dark:text-slate-500 font-medium">+{pendingRequests.length - 5} more requests — open Manage to view all</span>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* ────── EVENTS I'M HOSTING ────── */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-black text-gray-800 dark:text-white flex items-center gap-2">
                    <Crown className="text-amber-500" size={20} /> Hosting
                    {activeHostedEvents.length > 0 && <span className="text-xs font-bold text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">{activeHostedEvents.length}</span>}
                  </h3>
                </div>
                {activeHostedEvents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {activeHostedEvents.map((evt) => (
                      <EventCard key={evt._id} event={evt} variant="hosted" currentUserId={currentUserId} onClick={() => setSelectedEvent(evt)} onChat={(e) => setChatEvent(e)} onManage={(e) => setManagingEvent(e)} />
                    ))}
                  </div>
                ) : (
                  <div className="py-12 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 rounded-3xl border border-indigo-100 dark:border-indigo-500/10 text-center relative overflow-hidden group shadow-inner">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/50 dark:bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <Crown size={32} className="mx-auto text-indigo-600 dark:text-indigo-400 mb-3 drop-shadow-sm group-hover:scale-110 transition-transform" />
                    <h4 className="text-lg font-black text-indigo-900 dark:text-indigo-100 mb-1">Lead the Pack</h4>
                    <p className="text-sm text-indigo-600/80 dark:text-indigo-300/80 font-medium mb-4">You haven't hosted any active events.</p>
                    <button onClick={() => setOpenPostModal(true)} className="px-5 py-2.5 bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white dark:hover:bg-indigo-500 rounded-xl font-bold text-sm shadow-sm hover:shadow-md transition-all relative z-10">Create an Event</button>
                  </div>
                )}
              </section>

              {/* ────── EVENTS I'M ATTENDING ────── */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-black text-gray-800 dark:text-white flex items-center gap-2">
                    <CalendarCheck className="text-indigo-500" size={20} /> Upcoming Matches
                    {activeJoinedEvents.length > 0 && <span className="text-xs font-bold text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">{activeJoinedEvents.length}</span>}
                  </h3>
                </div>
                {activeJoinedEvents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {activeJoinedEvents.map((evt) => (
                      <EventCard key={evt._id} event={evt} variant="joined" currentUserId={currentUserId} onClick={() => setSelectedEvent(evt)} onChat={(e) => setChatEvent(e)} />
                    ))}
                  </div>
                ) : (
                  <div className="py-12 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 text-center relative overflow-hidden shadow-sm">
                    <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                    <Ticket size={32} className="mx-auto text-gray-400 dark:text-slate-500 mb-3" />
                    <h4 className="text-lg font-black text-gray-800 dark:text-gray-200 mb-1">Your Schedule is Clear</h4>
                    <p className="text-sm text-gray-500 dark:text-slate-400 font-medium mb-4">You have no upcoming matches.</p>
                    <button onClick={() => { setViewMode('explore'); setCategory('All'); }} className="px-5 py-2.5 text-slate-800 dark:text-white bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl font-bold text-sm transition-colors shadow-sm relative z-10">Discover Matches</button>
                  </div>
                )}
              </section>

              {/* ────── EVENT HISTORY ────── */}
              {(pastJoinedEvents.length > 0 || pastHostedEvents.length > 0) && (
                <section className="pt-6 border-t border-gray-100 dark:border-slate-800">
                  <h3 className="text-lg font-black text-gray-800 dark:text-white mb-5 flex items-center gap-2">
                    <History className="text-gray-400 dark:text-slate-500" size={20} /> History
                  </h3>

                  <div className="space-y-6">
                    {/* Past Joined */}
                    {pastJoinedEvents.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-1">Attended</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          {pastJoinedEvents.map((evt) => (
                            <EventCard key={evt._id} event={evt} variant="joined" currentUserId={currentUserId} onClick={() => setSelectedEvent(evt)} onRate={(e) => setUserToRate({ host: e.creator, eventId: e._id })} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Past Hosted */}
                    {pastHostedEvents.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-1">Hosted</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          {pastHostedEvents.map((evt) => (
                            <EventCard key={evt._id} event={evt} variant="hosted" currentUserId={currentUserId} onClick={() => setSelectedEvent(evt)} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>
          )}

          <button onClick={() => setOpenPostModal(true)} className="fixed bottom-6 right-6 sm:bottom-10 sm:right-10 z-30 flex items-center gap-2 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(79,70,229,0.3)] hover:-translate-y-1 transition-all font-extrabold text-sm sm:text-base">
            <PlusCircle size={24} /> Post Event
          </button>

        </main>
      </div>

      {/* ========================================== */}
      {/* 🟢 MODALS (Safely outside the layout wrapper) */}

      {/* ========================================== */}

      {selectedEvent && (
        currentUserId === getCreatorId(selectedEvent) ? (
          <HostManagementModal
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            onUpdate={() => { setRefreshKey(prev => prev + 1); setSelectedEvent(null); }}
          />
        ) : (
          <EventDetailsModal
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            onJoinSuccess={() => { setRefreshKey(prev => prev + 1); setSelectedEvent(null); }}
          />
        )
      )}

      {openPostModal && (
        <PostEventModal
          open={openPostModal}
          onClose={() => { setOpenPostModal(false); setRefreshKey(prev => prev + 1); }}
          defaultCity={selectedCity}
          defaultCategory={category !== 'All' ? category : ''}
        />
      )}

      {chatEvent && (
        <EventChatModal event={chatEvent} onClose={() => setChatEvent(null)} />
      )}

      {userToRate && (
        <RatingModal
          targetUser={userToRate.host}
          eventId={userToRate.eventId}
          onClose={() => setUserToRate(null)}
          onSuccess={() => {
            toast.success("Rating submitted!");
            setRefreshKey(prev => prev + 1);
            setUserToRate(null);
          }}
        />
      )}

      {managingEvent && (
        <HostManagementModal
          event={managingEvent}
          onClose={() => setManagingEvent(null)}
          onUpdate={() => setRefreshKey(prev => prev + 1)}
        />
      )}

    </>
  );
};

export default Dashboard;