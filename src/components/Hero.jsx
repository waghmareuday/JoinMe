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
    <section id="home" className="relative pt-20 min-h-screen flex flex-col justify-center items-center overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50/50 to-purple-50/50 dark:from-slate-950 dark:via-indigo-950/30 dark:to-purple-950/20">
      {/* Decorative Background */}
      <div className="absolute top-20 -left-40 w-[500px] h-[500px] bg-indigo-200/30 dark:bg-indigo-800/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 -right-40 w-[600px] h-[600px] bg-purple-200/30 dark:bg-purple-800/10 rounded-full blur-3xl" />
      <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-pink-200/20 dark:bg-pink-800/10 rounded-full blur-3xl animate-float" />
      <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative z-10 text-center px-6 sm:px-8 max-w-6xl w-full">
        <div className="space-y-8 sm:space-y-10">
          <div className="inline-flex items-center bg-white/80 dark:bg-white/10 border border-indigo-100 dark:border-white/10 rounded-full px-6 py-2.5 text-indigo-700 dark:text-indigo-300 font-semibold shadow-sm backdrop-blur-xl">
            <Sparkles className="h-4 w-4 text-indigo-500 dark:text-indigo-400 mr-2" />
            Connect. Collaborate. Celebrate.
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-[1.1]">
            Welcome to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 animate-gradient bg-[length:200%_200%]">JoinMe</span>
          </h1>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-medium text-gray-600 dark:text-gray-300 h-10 sm:h-14">
            {displayText}
            <span className="text-indigo-500 animate-pulse font-light">|</span>
          </h2>

          <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Discover your perfect teammates, attend exciting events, and build real connections.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={scrollToFeatures}
              className="group bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-8 py-4 rounded-2xl text-lg font-bold shadow-xl shadow-indigo-500/25 hover:shadow-2xl hover:shadow-indigo-500/30 transition-all hover:-translate-y-1"
            >
              <div className="flex items-center justify-center gap-2">
                Explore Now <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-12 sm:mt-16 max-w-4xl mx-auto pb-12">
            {[
              { icon: Users2, title: '50+ Users', desc: 'A growing community ready to connect', iconBg: 'bg-indigo-100 dark:bg-indigo-900/30', iconText: 'text-indigo-600 dark:text-indigo-400' },
              { icon: CalendarHeart, title: 'Real-Time Events', desc: 'Engage in live and virtual gatherings', iconBg: 'bg-purple-100 dark:bg-purple-900/30', iconText: 'text-purple-600 dark:text-purple-400' },
              { icon: PartyPopper, title: 'Vibrant Vibes', desc: 'Share good times and lasting friendships', iconBg: 'bg-pink-100 dark:bg-pink-900/30', iconText: 'text-pink-600 dark:text-pink-400' }
            ].map(({ icon: Icon, title, desc, iconBg, iconText }) => (
              <div key={title} className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-2xl p-6 shadow-lg shadow-gray-100/50 dark:shadow-none hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2.5 rounded-xl ${iconBg}`}>
                    <Icon className={`h-5 w-5 ${iconText}`} />
                  </div>
                  <h3 className="text-base font-bold text-gray-800 dark:text-white">{title}</h3>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
        <div className="w-6 h-10 border-2 border-indigo-300 dark:border-indigo-600 rounded-full flex justify-center bg-white/50 dark:bg-white/5 backdrop-blur-md">
          <div className="w-1 h-3 bg-indigo-500 rounded-full mt-2 animate-bounce"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
