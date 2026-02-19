// EventBoard.jsx
import React, { useEffect, useState } from 'react';
import { Calendar, MapPin, Users, PlusCircle } from 'lucide-react';
import PostEventModal from './PostEventModal';
import api from '../utility/api';
import EventCard from './EventCard';
import { useUser } from '../context/userContext';

const EventBoard = ({ selectedCity = '' }) => {
  const { user } = useUser();
  const [events, setEvents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [joining, setJoining] = useState(null);

  const fetchEvents = async (city = '') => {
    try {
      const q = new URLSearchParams();
      if (city) q.set('city', city);
      const res = await api.get(`/event/all?${q.toString()}`);
      if (res.data && res.data.success) {
        setEvents(res.data.events);
      }
    } catch (err) {
      console.error("Failed to load events", err);
    }
  };

  useEffect(() => {
    fetchEvents(selectedCity);
  }, [refresh, selectedCity]);

  useEffect(() => {
    const interval = setInterval(() => fetchEvents(selectedCity), 5000);
    return () => clearInterval(interval);
  }, [selectedCity]);

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 sm:px-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-700">🎯 Event Board</h1>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 transition"
          >
            <PlusCircle size={20} /> Add Event
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {events.length === 0 ? (
            <p className="text-gray-500">No events posted yet.</p>
          ) : (
            events.map(event => (
              <EventCard
                key={event._id}
                event={event}
                bgImage={event.image}
                onClick={() => setModalOpen(true)}
                onJoin={async (eventId) => {
                  if (!user) {
                    return alert('Please login to join events.');
                  }
                  try {
                    setJoining(eventId);
                    const res = await api.post('/event/join', { eventId });
                    if (res.data && res.data.success) {
                      // Update local list: decrement requiredPeople
                      setEvents(prev => prev.map(ev => ev._id === eventId ? { ...ev, requiredPeople: res.data.remainingSlots } : ev));
                    }
                  } catch (err) {
                    console.error('Join failed', err);
                  } finally {
                    setJoining(null);
                  }
                }}
                joining={joining === event._id}
              />
            ))
          )}
        </div>

        <PostEventModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setRefresh(!refresh);
          }}
        />
      </div>
    </div>
  );
};

export default EventBoard;
