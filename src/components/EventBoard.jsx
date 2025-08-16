// EventBoard.jsx
import React, { useEffect, useState } from 'react';
import { Calendar, MapPin, Users, PlusCircle } from 'lucide-react';
import PostEventModal from './PostEventModal';
import api from '../utility/api';

const EventBoard = () => {
  const [events, setEvents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [refresh, setRefresh] = useState(false);

  const fetchEvents = async () => {
    try {
      const res = await api.get('/event/all');
      if (res.data.success) {
        setEvents(res.data.events);
      }
    } catch (err) {
      console.error("Failed to load events", err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [refresh]);

  useEffect(() => {
    const interval = setInterval(fetchEvents, 5000);
    return () => clearInterval(interval);
  }, []);

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.length === 0 ? (
            <p className="text-gray-500">No events posted yet.</p>
          ) : (
            events.map(event => (
              <div key={event._id} className="bg-white shadow-md rounded-xl p-5 hover:shadow-lg transition cursor-pointer">
                <h2 className="text-xl font-bold text-blue-600 mb-2">{event.title}</h2>
                <p className="text-sm text-gray-600 mb-3">
                  {event.description?.substring(0, 100) || 'No description provided.'}
                </p>
                <div className="text-sm text-gray-700 space-y-1">
                  <p className="flex items-center gap-2"><Calendar size={16} /> {event.date} at {event.time}</p>
                  <p className="flex items-center gap-2"><MapPin size={16} /> {event.venue}</p>
                  <p className="flex items-center gap-2"><Users size={16} /> Needed: {event.requiredPeople}</p>
                </div>
              </div>
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
