import React, { useState } from 'react';
import EventCard from './EventCard';
import Sidebar from './Sidebar';
import PostEventModal from './PostEventModal';
import turfImg from '../assets/turf.png';
import footballImg from '../assets/football.png';
import volleyballImg from '../assets/volleyball.png';
import movieImg from '../assets/movie.png';
import tripImg from '../assets/trip.png';
import carpoolingImg from '../assets/carpooling.png';
import EventBoard from './EventBoard';
import { PlusCircle } from 'lucide-react';

const slogans = [
  "Let's make new memories today!",
  "Find your perfect partner for the moment!",
  "Because shared moments matter."
];

const eventData = [
  { title: "Cricket at Central Turf", bgImage: turfImg, category: "Cricket" },
  { title: "Football at Stadium", bgImage: footballImg, category: "Football" },
  { title: "Volleyball at Beach Court", bgImage: volleyballImg, category: "Volleyball" },
  { title: "Movie Night: Interstellar", bgImage: movieImg, category: "Movie" },
  { title: "Trip to Lonavala", bgImage: tripImg, category: "Trip Buddy" },
  { title: "Pune to Nagpur Ride", bgImage: carpoolingImg, category: "Ride Sharing" },
];

const Dashboard = ({ user }) => {
  const slogan = slogans[Math.floor(Math.random() * slogans.length)];
  const firstName = user?.name?.split(' ')[0] || 'User';
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [openPostModal, setOpenPostModal] = useState(false);

  return (
    <div className="flex bg-gradient-to-br from-indigo-100 to-purple-200 min-h-screen pt-16">
      <Sidebar />

      <main className="flex-1 p-6 sm:p-10 overflow-y-auto relative">
        {/* Greeting */}
        <div className="mb-10">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-700 drop-shadow-sm">
            Welcome, {firstName} 👋
          </h1>
          <p className="text-xl text-gray-600 mt-2 italic tracking-wide">{slogan}</p>
        </div>

        {/* Category Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {eventData.map((event, idx) => (
            <EventCard
              key={idx}
              title={event.title}
              bgImage={event.bgImage}
              onClick={() => setSelectedEvent(event)}
            />
          ))}
        </section>

        {/* EventBoard with real-time updates */}
        <EventBoard />

        {/* Floating Add Button */}
        <button
          onClick={() => setOpenPostModal(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition"
        >
          <PlusCircle size={20} /> Post Event
        </button>

        {/* Post Modal from Card Click */}
        {selectedEvent && (
          <PostEventModal
            open={!!selectedEvent}
            onClose={() => setSelectedEvent(null)}
            defaultCategory={selectedEvent.category}
            defaultTitle={selectedEvent.title}
          />
        )}

        {/* Post Modal from Floating Button */}
        {openPostModal && (
          <PostEventModal
            open={openPostModal}
            onClose={() => setOpenPostModal(false)}
          />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
