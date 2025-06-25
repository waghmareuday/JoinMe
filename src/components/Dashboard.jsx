import React, { useEffect, useState } from 'react';
import {
  Users, MapPin, LogOut, Film, Car, Calendar, Shield, PlusCircle, Star
} from 'lucide-react';
import api from '../utility/api';
import { toast } from 'react-hot-toast';

const sectionImages = {
  turf: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
  movie: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=600&q=80",
  ride: "https://images.unsplash.com/photo-1511918984145-48de785d4c4e?auto=format&fit=crop&w=600&q=80",
  events: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=80",
  location: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80",
  safe: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=600&q=80"
};

const Dashboard = ({ user, onLogout }) => {
  const [city, setCity] = useState(user.city);
  const [events, setEvents] = useState([]);
  const [newPost, setNewPost] = useState({ title: '', description: '', section: 'turf' });

  useEffect(() => {
    fetchEvents();
  }, [city]);

  const fetchEvents = async () => {
    try {
      const res = await api.get(`/events?city=${city}`);
      if (res.data.success) setEvents(res.data.events);
      else toast.error(res.data.message || 'Failed to fetch events');
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch events');
    }
  };

  const handlePostSubmit = async () => {
    if (!newPost.title || !newPost.description) {
      toast.error("Please fill all fields");
      return;
    }
    try {
      const res = await api.post('/events/create', {
        ...newPost,
        city,
        postedBy: user.name
      });
      if (res.data.success) {
        toast.success('Event posted!');
        fetchEvents();
        setNewPost({ title: '', description: '', section: 'turf' });
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error("Post failed");
    }
  };

  return (
    <div className="min-h-screen px-4 sm:px-10 bg-gradient-to-br from-white to-slate-100 py-32">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-800">
          Welcome, <span className="text-purple-600">{user.name}</span>
        </h1>
        <button
          onClick={onLogout}
          className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-600"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>

      <div className="mb-6">
        <label className="text-gray-700 font-semibold">Your City: </label>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="ml-2 border px-3 py-1 rounded"
        >
          {[user.city, 'Mumbai', 'Delhi', 'Pune', 'Chennai', 'Hyderabad'].filter((v, i, a) => a.indexOf(v) === i).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="mb-10">
        <h2 className="text-xl font-bold mb-4">Create New Post</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Title"
            value={newPost.title}
            onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
            className="border px-3 py-2 rounded"
          />
          <select
            value={newPost.section}
            onChange={(e) => setNewPost({ ...newPost, section: e.target.value })}
            className="border px-3 py-2 rounded"
          >
            {Object.keys(sectionImages).map(key => (
              <option key={key} value={key}>{key.charAt(0).toUpperCase() + key.slice(1)}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Description"
            value={newPost.description}
            onChange={(e) => setNewPost({ ...newPost, description: e.target.value })}
            className="border px-3 py-2 rounded"
          />
        </div>
        <button
          onClick={handlePostSubmit}
          className="mt-4 px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:scale-105 transition"
        >
          Post
        </button>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Posts in {city}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event, i) => (
            <div key={i} className="bg-white rounded-xl overflow-hidden shadow hover:shadow-lg transition">
              <img src={sectionImages[event.section] || sectionImages.safe} alt={event.section} className="h-40 w-full object-cover" />
              <div className="p-4">
                <h3 className="text-lg font-bold text-blue-700">{event.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                  <MapPin size={14} /> {event.city} • Posted by {event.postedBy}
                </div>
              </div>
            </div>
          ))}
        </div>
        {events.length === 0 && <p className="text-gray-500 mt-4">No posts yet.</p>}
      </div>
    </div>
  );
};

export default Dashboard;
