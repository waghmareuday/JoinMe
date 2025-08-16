import React, { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utility/api';

const categories = [
  "Cricket", "Football", "Volleyball", "Movie", "Ride Sharing", "Trip Buddy"
];

const PostEventModal = ({ open, onClose, defaultCategory }) => {
  const [form, setForm] = useState({
    category: defaultCategory || '',
    title: '',
    description: '',
    date: '',
    time: '',
    venue: '',
    requiredPeople: '',
    payment: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category || !form.title || !form.date || !form.time || !form.venue || !form.requiredPeople) {
      toast.error("Please fill all required fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/event/create', form);
      if (res.data.success) {
        toast.success("🎉 Event posted successfully!");
        onClose();
      } else {
        toast.error(res.data.message || "Failed to post event.");
      }
    } catch (err) {
      toast.error("Server error occurred");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl relative transition-all">
        <button className="absolute top-4 right-4 text-gray-500 hover:text-red-500 text-xl" onClick={onClose}>✕</button>

        <h2 className="text-3xl font-bold text-blue-700 mb-6 text-center">📝 Post an Event</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Category */}
          <div>
            <label className="block mb-1 font-medium text-gray-700">Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-400"
              required
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block mb-1 font-medium text-gray-700">Title</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="What's the event about?"
              className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block mb-1 font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Brief details about the event..."
              className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Date & Time */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block mb-1 font-medium text-gray-700">Date</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block mb-1 font-medium text-gray-700">Time</label>
              <input
                type="time"
                name="time"
                value={form.time}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
          </div>

          {/* Venue */}
          <div>
            <label className="block mb-1 font-medium text-gray-700">Venue</label>
            <input
              name="venue"
              value={form.venue}
              onChange={handleChange}
              placeholder="Where is it happening?"
              className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          {/* Required People */}
          <div>
            <label className="block mb-1 font-medium text-gray-700">Required People</label>
            <input
              type="number"
              name="requiredPeople"
              value={form.requiredPeople}
              onChange={handleChange}
              placeholder="No. of companions needed"
              className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          {/* Payment (Optional) */}
          <div>
            <label className="block mb-1 font-medium text-gray-700">Payment (Optional)</label>
            <input
              name="payment"
              value={form.payment}
              onChange={handleChange}
              placeholder="Amount or 'Free'"
              className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="block mb-1 font-medium text-gray-700">Notes (Optional)</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Anything extra to mention?"
              className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 text-white font-semibold rounded-md bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 transition"
            disabled={loading}
          >
            {loading ? "Posting..." : "🚀 Post Event"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PostEventModal;
