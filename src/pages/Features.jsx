import React from 'react';
import { 
  Users, 
  Car, 
  Calendar, 
  Film, 
  MapPin, 
  Shield,
  Star,
  Zap
} from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: Users,
      title: "Sports & Teams",
      description: "Find teammates for football, basketball, tennis, and more. Never play alone again with our active sports community.",
      color: "bg-blue-500",
      gradient: "from-blue-500 to-blue-600"
    },
    {
      icon: Car,
      title: "Ride Sharing",
      description: "Share rides for daily commutes, weekend trips, or special events. Save money while making new connections.",
      color: "bg-green-500",
      gradient: "from-green-500 to-green-600"
    },
    {
      icon: Calendar,
      title: "Local Events",
      description: "Discover concerts, festivals, workshops, and meetups in your area. Join activities that match your interests.",
      color: "bg-purple-500",
      gradient: "from-purple-500 to-purple-600"
    },
    {
      icon: Film,
      title: "Movie & Entertainment",
      description: "Find companions for movies, theater shows, and entertainment events. Share the experience with like-minded people.",
      color: "bg-red-500",
      gradient: "from-red-500 to-red-600"
    },
    {
      icon: MapPin,
      title: "Location-Based",
      description: "Connect with people nearby using smart location matching. Find activities and companions in your neighborhood.",
      color: "bg-yellow-500",
      gradient: "from-yellow-500 to-yellow-600"
    },
    {
      icon: Shield,
      title: "Safe & Verified",
      description: "All users are verified with secure profiles. Chat safely with built-in moderation and reporting features.",
      color: "bg-indigo-500",
      gradient: "from-indigo-500 to-indigo-600"
    }
  ];

  const additionalFeatures = [
    {
      icon: Star,
      title: "Rating System",
      description: "Build trust with community ratings and reviews"
    },
    {
      icon: Zap,
      title: "Instant Matching",
      description: "Get matched with compatible companions instantly"
    }
  ];

  return (
    <section id="features" className="py-20 bg-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Everything You Need to
            <span className="text-blue-500"> Connect</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover a world of possibilities with our comprehensive platform designed 
            to bring people together for every type of activity and adventure.
          </p>
        </div>

        {/* Main Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
            >
              <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${feature.gradient} shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="h-8 w-8 text-white" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                {feature.title}
              </h3>
              
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Additional Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {additionalFeatures.map((feature, index) => (
            <div key={index} className="flex items-center space-x-4 bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex-shrink-0 p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-lg">{feature.title}</h4>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Start Connecting?
            </h3>
            <p className="text-gray-600 mb-6">
              Join thousands of users who've already found their perfect activity companions.
            </p>
            <button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg">
              Get Started Today
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
