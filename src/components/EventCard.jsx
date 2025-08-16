// EventCard.jsx
import React from 'react';

const EventCard = ({ title, bgImage, onClick }) => {
  return (
    <div
      className="relative h-48 rounded-3xl overflow-hidden shadow-xl bg-white/10 backdrop-blur-md border border-white/20 transform transition-transform duration-300 hover:scale-[1.04] hover:shadow-2xl cursor-pointer group"
      onClick={onClick}
      tabIndex={0}
      role="button"
      aria-label={`Open event: ${title}`}
    >
      <img
        src={bgImage}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent p-5 flex flex-col justify-end">
        <h3 className="text-white text-xl font-semibold drop-shadow">{title}</h3>
        <span className="text-white text-sm opacity-90">Available</span>
      </div>
    </div>
  );
};

export default EventCard;
