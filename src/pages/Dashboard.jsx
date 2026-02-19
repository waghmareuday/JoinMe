import React, { useEffect, useMemo, useState } from 'react';
import { PlusCircle, Search, Calendar, MapPin, Compass, Bookmark, Bell, Crown, Ticket, MessageCircle, Settings, History } from 'lucide-react';
import api from '../utility/api';
import { useUser } from '../context/userContext';

// Components
import EventCard from '../components/EventCard';
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

    import('../utility/socket').then(({ default: socket }) => {
      socketInstance = socket;
      socket.connect();
      socket.joinCity(selectedCity);

      const handleNewEvent = (e) => {
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

      const handleCats = ({ categories }) => {
        if (!mounted) return;
        const countsObj = {};
        if (Array.isArray(categories)) categories.forEach(c => { countsObj[c.category] = c.count; });
        setLiveCounts(countsObj);
      };

      socket.on('newEvent', handleNewEvent);
      socket.on('categoryCountsUpdated', handleCats);

      if (viewMode === 'explore') {
        (async () => {
          try {
            const res = await api.get(`/event/categories?city=${encodeURIComponent(selectedCity)}`);
            if (res.data?.success) handleCats({ categories: res.data.categories });
          } catch (err) { console.error(err); }
        })();
      }
    }).catch(console.error);

    return () => {
      mounted = false;
      if (socketInstance) {
        socketInstance.off('newEvent');
        socketInstance.off('categoryCountsUpdated');
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
        } else {
          const q = new URLSearchParams();
          q.set('city', selectedCity);
          if (category !== 'All') q.set('category', category);
          if (search) q.set('search', search);

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

  // 🟢 STRIPE PAYMENT VERIFIER
  useEffect(() => {
    if (!user) return; 

    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');

    if (sessionId) {
      api.post('/payment/verify-session', { sessionId })
        .then(res => {
          if (res.data.success) {
            alert("Payment Successful! You have been added to the match. 🎉");
            setRefreshKey(prev => prev + 1); 
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        })
        .catch(err => {
          console.error("Payment verification failed", err);
          alert("Payment verification failed. Please check your console.");
          window.history.replaceState({}, document.title, window.location.pathname);
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
      alert(error.response?.data?.message || "Something went wrong");
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
        return new Date(d).toISOString().slice(0,10) === selectedDate;
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

  if (!user) return <div className="min-h-screen flex items-center justify-center text-indigo-600 font-bold">Loading Dashboard...</div>;
  const firstName = user?.name ? user.name.split(' ')[0] : 'User';

  return (
    <>
      <div className="flex bg-gradient-to-br from-indigo-50 to-purple-100 min-h-screen pt-16">
        <Sidebar onCityChange={setSelectedCity} onCategorySelect={setCategory} currentCategory={category} />

        <main className="flex-1 p-4 sm:p-6 lg:p-10 overflow-y-auto relative w-full">
          
          {/* VIEW TOGGLE - Made wrap on small screens */}
          <div className="flex flex-wrap gap-3 mb-6 bg-white p-2 rounded-2xl w-full sm:w-fit shadow-sm border border-gray-100">
             <button onClick={() => { setViewMode('explore'); setCategory('All'); }} className={`flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl font-bold transition-all text-sm sm:text-base ${viewMode === 'explore' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
               <Compass size={18} /> Explore Hub
             </button>
             <button onClick={() => setViewMode('myEvents')} className={`flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl font-bold transition-all relative text-sm sm:text-base ${viewMode === 'myEvents' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
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
            <div className="lg:col-span-2 bg-white rounded-3xl p-5 sm:p-6 shadow-lg border border-gray-100">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-md">
                  {(firstName || 'U').charAt(0)}
                </div>
                <div className="flex-1 w-full">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-800 tracking-tight">{viewMode === 'explore' ? `Your Hub — ${selectedCity}` : 'Your Dashboard'}</h2>
                          <p className="text-gray-600 mt-1 text-sm sm:text-base">Hello {firstName}, {slogans[0]}</p>
                      </div>
                      {viewMode === 'explore' && (
                        <div className="w-full sm:w-auto flex items-center bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200 hover:border-indigo-300 transition-colors cursor-pointer">
                            <MapPin size={18} className="text-indigo-500 mr-2 shrink-0" />
                            <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)} className="w-full bg-transparent text-sm font-bold text-gray-700 focus:outline-none cursor-pointer">
                                <option value="Mumbai">Mumbai</option>
                                <option value="Nagpur">Nagpur</option>
                                <option value="Pune">Pune</option>
                                <option value="Delhi">Delhi</option>
                                <option value="Bengaluru">Bengaluru</option>
                            </select>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>

            {viewMode === 'explore' && (
              <div className="bg-white rounded-3xl p-5 shadow-lg border border-gray-100 flex flex-col gap-3">
                <div className="relative">
                    <Search className="absolute left-3.5 top-3 text-gray-400" size={18} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search events..." className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-gray-50" />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <div className="flex-1 flex items-center bg-gray-50 px-3 py-2.5 rounded-xl border border-gray-200">
                        <Calendar size={18} className="text-indigo-500 mr-2 shrink-0" />
                        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="bg-transparent text-sm w-full outline-none font-medium text-gray-700 cursor-pointer" />
                    </div>
                    <button onClick={() => {setCategory('All'); setSearch(''); setSelectedDate('');}} className="px-4 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Reset</button>
                </div>
              </div>
            )}
          </div>

          {/* EXPLORE MODE: Categories */}
          {viewMode === 'explore' && category === 'All' && !search && (
              <section className="mb-10">
                  <h3 className="text-xl sm:text-2xl font-black text-gray-800 mb-4 sm:mb-6">Browse Categories</h3>
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
                      <button onClick={() => setCategory('All')} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors">← Back to Hub</button>
                      <h3 className="text-xl sm:text-2xl font-black text-gray-800">{category === 'All' ? 'Explore Matches' : `${category} Events`}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {loading ? <div className="col-span-full text-center py-10 font-bold text-indigo-400 animate-pulse">Loading events...</div> : displayedEvents.length > 0 ? displayedEvents.map((event) => (
                          <EventCard key={event._id} event={event} bgImage={categoryMenu.find(c => c.category === event.category)?.bgImage || turfImg} onClick={() => setSelectedEvent(event)} />
                      )) : <div className="col-span-full text-center py-12 bg-white rounded-3xl border-2 border-dashed border-gray-200"><p className="text-gray-500 font-medium">No active events found for this filter.</p></div>}
                  </div>
              </section>
          )}

          {/* MY EVENTS MODE */}
          {viewMode === 'myEvents' && (
            <div className="space-y-12 animate-fade-in">
              
              {/* 1. HOST INBOX */}
              {pendingRequests.length > 0 && (
                <section className="bg-white rounded-3xl p-5 sm:p-6 shadow-xl border border-orange-100 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-500"></div>
                  <h3 className="text-xl sm:text-2xl font-black text-gray-800 mb-6 flex items-center gap-2">
                    <Bell className="text-orange-500" /> Action Required ({pendingRequests.length})
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {pendingRequests.map(({ event, request }) => (
                      <div key={`${event._id}-${request.user._id}`} className="bg-orange-50/50 p-4 sm:p-5 rounded-2xl border border-orange-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-md transition-all">
                        <div className="w-full">
                          <p className="font-bold text-gray-800 text-sm">
                            {request.user?.name || 'User'} <span className="font-medium text-gray-500">requested to join</span>
                          </p>
                          <p className="font-black text-indigo-600 text-lg mt-0.5 cursor-pointer hover:underline" onClick={() => setSelectedEvent(event)}>{event.title}</p>
                          <p className="text-xs font-medium text-gray-400 mt-1">{new Date(request.requestedAt).toLocaleDateString()} • {event.time}</p>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                           <button 
                             onClick={() => handleQuickResponse(event._id, request.user._id, 'rejected')} 
                             disabled={actionLoadingId === request.user._id}
                             className="flex-1 sm:flex-none px-5 py-2.5 bg-white text-red-500 border border-red-200 hover:bg-red-50 hover:border-red-300 rounded-xl text-sm font-bold transition-all disabled:opacity-50 shadow-sm"
                           >Reject</button>
                           <button 
                             onClick={() => handleQuickResponse(event._id, request.user?._id || request.user, 'approved')} 
                             disabled={actionLoadingId === request.user._id}
                             className="flex-1 sm:flex-none px-5 py-2.5 bg-green-500 text-white hover:bg-green-600 rounded-xl text-sm font-bold shadow-md transition-all disabled:opacity-50 hover:shadow-lg hover:-translate-y-0.5"
                           >Approve</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 🟢 SECTION 1: ACTIVE EVENTS I AM HOSTING */}
              <section>
                <h3 className="text-xl sm:text-2xl font-black text-gray-800 mb-6 flex items-center gap-2">
                  <Crown className="text-yellow-500" /> Active Events I'm Hosting
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeHostedEvents.length > 0 ? activeHostedEvents.map((event) => (
                        <div key={event._id} className="flex flex-col">
                          <EventCard event={event} bgImage={categoryMenu.find(c => c.category === event.category)?.bgImage || turfImg} onClick={() => setSelectedEvent(event)} />
                          
                          <div className="flex gap-2 mt-3">
                            <button 
                               onClick={() => setChatEvent(event)}
                               className="flex-1 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2 border border-indigo-100 shadow-sm"
                            >
                               <MessageCircle size={18} /> Chat
                            </button>
                            <button 
                              onClick={() => setManagingEvent(event)}
                              className="flex-1 py-3 bg-gray-800 text-white rounded-xl font-bold text-sm hover:bg-gray-900 transition-colors shadow-sm"
                            >
                              ⚙️ Manage
                            </button>
                          </div>
                        </div>
                    )) : (
                        <div className="col-span-full py-12 bg-white rounded-3xl border-2 border-dashed border-gray-200 text-center">
                            <p className="text-gray-500 font-medium">You don't have any active hosted events.</p>
                        </div>
                    )}
                </div>
              </section>

              {/* 🟢 SECTION 2: ACTIVE EVENTS I AM ATTENDING */}
              <section>
                <h3 className="text-xl sm:text-2xl font-black text-gray-800 mb-6 flex items-center gap-2">
                  <Ticket className="text-indigo-500" /> Upcoming Matches
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeJoinedEvents.length > 0 ? activeJoinedEvents.map((event) => (
                        <div key={event._id} className="flex flex-col">
                          <EventCard event={event} bgImage={categoryMenu.find(c => c.category === event.category)?.bgImage || turfImg} onClick={() => setSelectedEvent(event)} />
                          
                          {event.requests?.find(r => String(r.user._id || r.user) === currentUserId)?.status === 'approved' && (
                            <button 
                               onClick={() => setChatEvent(event)}
                               className="mt-3 w-full py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2 border border-indigo-100 shadow-sm"
                            >
                               <MessageCircle size={18} /> Open Event Chat
                            </button>
                          )}
                        </div>
                    )) : (
                        <div className="col-span-full py-12 bg-white rounded-3xl border-2 border-dashed border-gray-200 text-center">
                            <p className="text-gray-500 font-medium">You haven't joined any upcoming matches.</p>
                        </div>
                    )}
                </div>
              </section>

              {/* 🟢 SECTION 3: EVENT HISTORY & RATINGS */}
              <section className="pt-10 border-t border-gray-200">
                <h3 className="text-xl sm:text-2xl font-black text-gray-800 mb-8 flex items-center gap-2">
                  <History className="text-gray-400" /> My Event History
                </h3>
                
                <div className="space-y-12">
                  {/* PAST JOINED EVENTS */}
                  <div>
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 ml-1">Events I Attended</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-80 hover:opacity-100 transition-opacity duration-300">
                        {pastJoinedEvents.length > 0 ? pastJoinedEvents.map((event) => (
                            <div key={event._id} className="flex flex-col">
                              <EventCard event={event} bgImage={categoryMenu.find(c => c.category === event.category)?.bgImage || turfImg} onClick={() => setSelectedEvent(event)} />
                              <div className="mt-3 flex gap-2">
                                <div className={`flex-1 py-3 flex items-center justify-center rounded-xl font-bold text-sm border ${event.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                  {event.status === 'completed' ? 'Match Completed' : 'Cancelled'}
                                </div>
                                  {event.status === 'completed' && (
                                    event.ratedBy?.includes(currentUserId) ? (
                                      <div className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-xl font-bold text-sm text-center border border-gray-200 shadow-inner">
                                        ✅ Rated
                                      </div>
                                    ) : (
                                      <button 
                                        onClick={() => setUserToRate({ host: event.creator, eventId: event._id })} 
                                        className="flex-1 py-3 bg-yellow-50 text-yellow-700 rounded-xl font-bold text-sm hover:bg-yellow-100 border border-yellow-200 transition-colors shadow-sm hover:shadow-md"
                                      >
                                        ⭐ Rate Host
                                      </button>
                                    )
                                  )}
                              </div>
                            </div>
                        )) : <p className="text-gray-400 text-sm font-medium col-span-full">No past attended events.</p>}
                    </div>
                  </div>

                  {/* PAST HOSTED EVENTS */}
                  <div>
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 ml-1">Events I Hosted</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-80 hover:opacity-100 transition-opacity duration-300">
                        {pastHostedEvents.length > 0 ? pastHostedEvents.map((event) => (
                            <div key={event._id} className="flex flex-col">
                              <EventCard event={event} bgImage={categoryMenu.find(c => c.category === event.category)?.bgImage || turfImg} onClick={() => setSelectedEvent(event)} />
                              <div className={`mt-3 py-3 flex items-center justify-center rounded-xl font-bold text-sm border ${event.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                {event.status === 'completed' ? 'Completed Successfully' : 'Cancelled by you'}
                              </div>
                            </div>
                        )) : <p className="text-gray-400 text-sm font-medium col-span-full">No past hosted events.</p>}
                    </div>
                  </div>
                </div>
              </section>

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
          onClose={() => setOpenPostModal(false)} 
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
              alert("Rating submitted!");
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