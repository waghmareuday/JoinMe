import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Users2, CalendarHeart, PartyPopper } from 'lucide-react';

const Hero = () => {
  const phrases = [
    "Find Teammates Instantly",
    "Connect Over Shared Interests",
    "Build Your Own Tribe",
    "Make Every Moment Count"
  ];

  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    let timeout;
    const phrase = phrases[currentPhrase];

    if (isTyping) {
      if (displayText.length < phrase.length) {
        timeout = setTimeout(() => {
          setDisplayText(phrase.slice(0, displayText.length + 1));
        }, 70);
      } else {
        timeout = setTimeout(() => {
          setIsTyping(false);
        }, 2000);
      }
    } else {
      if (displayText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, 40);
      } else {
        setCurrentPhrase((prev) => (prev + 1) % phrases.length);
        setIsTyping(true);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayText, isTyping, currentPhrase]);

  const scrollToFeatures = () => {
    const element = document.getElementById('features');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="home"
      className="relative pt-24 min-h-screen flex flex-col justify-center items-center bg-cover bg-center text-gray-900 overflow-hidden"
      style={{ backgroundImage: "url('/hero.jpg')" }}
    >
      {/* Stronger, lighter blur overlay for better text contrast */}
      <div className="absolute inset-0 bg-white/20 backdrop-blur-sm z-0"></div>

      {/* Optional: Add space for Navbar */}
      <div className="absolute top-0 left-0 w-full h-20 z-20 pointer"></div>

      <div className="relative z-10 text-center px-6 sm:px-8 max-w-6xl w-full">
        <div className="space-y-12">
          {/* <div className="inline-flex items-center bg-white/90 border border-blue-100 rounded-full px-6 py-2 text-blue-700 font-medium shadow-md backdrop-blur">
            <Sparkles className="h-5 w-5 text-blue-500 mr-2" />
            Connect. Collaborate. Celebrate.
          </div> */}

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-gray-900 drop-shadow-lg">
            Welcome to <span className="text-red-500">Join</span><span className="text-red-500">Me</span>
          </h1>

          <h2 className="text-2xl sm:text-3xl font-medium text-blue-900 h-16 drop-shadow">
            {displayText}
            <span className="text-purple-600 animate-pulse">|</span>
          </h2>

          {/* <p className="text-lg sm:text-xl text-gray-800 max-w-2xl mx-auto bg-white/20 rounded-xl py-2 px-4 shadow backdrop-blur">
            Discover your perfect teammates, attend exciting events, and build real connections with JoinMe.
          </p> */}

          <div className="flex justify-center">
            <button
              onClick={scrollToFeatures}
              className="bg-gradient-to-r from-blue-700 to-purple-700 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg transition-transform transform hover:scale-105 backdrop-blur"
            >
              <div className="flex items-center gap-2">
                Explore Now <ArrowRight className="h-5 w-5" />
              </div>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-5xl mx-auto pb-12">
            <div className="bg-white/90 border border-blue-100 rounded-xl p-6 shadow hover:shadow-xl transition backdrop-blur">
              <div className="flex items-center gap-3 mb-2">
                <Users2 className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-800">50+ Users</h3>
              </div>
              <p className="text-gray-700 text-sm">A growing community ready to connect</p>
            </div>
            <div className="bg-white/90 border border-purple-100 rounded-xl p-6 shadow hover:shadow-xl transition backdrop-blur">
              <div className="flex items-center gap-3 mb-2">
                <CalendarHeart className="h-6 w-6 text-purple-600" />
                <h3 className="text-lg font-semibold text-purple-800">Real-Time Events</h3>
              </div>
              <p className="text-gray-700 text-sm">Engage in live and virtual gatherings</p>
            </div>
            <div className="bg-white/90 border border-pink-100 rounded-xl p-6 shadow hover:shadow-xl transition backdrop-blur">
              <div className="flex items-center gap-3 mb-2">
                <PartyPopper className="h-6 w-6 text-pink-600" />
                <h3 className="text-lg font-semibold text-pink-800">Vibrant Vibes</h3>
              </div>
              <p className="text-gray-700 text-sm">Share good times and lasting friendships</p>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10">
        <div className="w-6 h-10 border-2 border-blue-300 rounded-full flex justify-center bg-white/70 backdrop-blur">
          <div className="w-1 h-3 bg-blue-500 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
