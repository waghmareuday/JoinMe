import React from 'react';
import { Users, Car, Utensils, Dumbbell, Briefcase, Palette, Music, BookOpen, Zap, ChevronRight } from 'lucide-react';

const Features = () => {
  const features = [
    { icon: Users, title: "Smart Matching", desc: "Find companions based on interests, location, and availability with our intelligent matching algorithm.", gradient: "from-blue-500 to-indigo-600" },
    { icon: Car, title: "Carpooling", desc: "Share rides, reduce costs, and make your daily commute an enjoyable social experience.", gradient: "from-green-500 to-emerald-600" },
    { icon: Utensils, title: "Food Adventures", desc: "Discover new restaurants and cuisines with fellow foodies in your area.", gradient: "from-orange-500 to-red-500" },
    { icon: Dumbbell, title: "Sports & Fitness", desc: "Find workout buddies, join sports teams, or discover new fitness activities together.", gradient: "from-purple-500 to-pink-600" },
    { icon: Briefcase, title: "Networking", desc: "Connect with professionals, attend meetups, and grow your career network organically.", gradient: "from-cyan-500 to-blue-600" },
    { icon: Music, title: "Events & Concerts", desc: "Never go to a concert alone again. Find music lovers who share your taste.", gradient: "from-pink-500 to-rose-600" }
  ];

  const highlights = [
    { icon: Zap, title: "Real-time Chat", desc: "Instant messaging with event groups" },
    { icon: BookOpen, title: "Event History", desc: "Track and revisit your experiences" },
    { icon: Palette, title: "Custom Events", desc: "Create and host your own gatherings" }
  ];

  return (
    <section id="features" className="py-20 sm:py-28 bg-gradient-to-b from-white via-purple-50/20 to-white dark:from-slate-900 dark:via-purple-950/10 dark:to-slate-900 relative overflow-hidden">
      <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-indigo-100/30 dark:bg-indigo-900/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-100/30 dark:bg-purple-900/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16 sm:mb-20">
          <div className="inline-flex items-center bg-purple-50 dark:bg-purple-900/30 border border-purple-100 dark:border-purple-800 rounded-full px-5 py-2 text-purple-600 dark:text-purple-400 font-semibold text-sm mb-6">
            <Zap className="h-4 w-4 mr-2" /> Powerful Features
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight">
            Everything You Need to
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600"> Connect</span>
          </h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            From finding activity partners to organizing group events, JoinMe provides all the tools you need for meaningful social connections.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-20">
          {features.map((feature, index) => (
            <div key={index} className="group bg-white dark:bg-slate-800/50 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-lg shadow-gray-100/50 dark:shadow-none hover:-translate-y-2 hover:shadow-xl transition-all duration-300 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300" style={{backgroundImage: `linear-gradient(135deg, var(--tw-gradient-stops))`}} />

              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="h-7 w-7 text-white" />
              </div>

              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-20">
          {highlights.map((item, i) => (
            <div key={i} className="flex items-start gap-4 bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/30">
                <item.icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-1">{item.title}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-10 sm:p-14 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="relative z-10">
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Ready to Get Started?</h3>
            <p className="text-indigo-100 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of people who are already making meaningful connections through shared experiences.
            </p>
            <a href="/signup" className="inline-flex items-center bg-white hover:bg-gray-50 text-indigo-700 font-bold text-lg px-10 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group">
              Join Now <ChevronRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
