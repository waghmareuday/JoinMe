import React from 'react';
import { Quote, Star, Heart, Globe, Shield } from 'lucide-react';

const About = () => {
  const testimonials = [
    {
      name: "Bhavana Sharma",
      role: "Tennis Enthusiast",
      content: "JoinMe helped me find my regular tennis partner and a whole community of players. I've never had so much fun staying active!",
      rating: 5,
      image: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Dhruv Agrawal",
      role: "Commuter",
      content: "Carpooling through JoinMe has saved me hundreds of dollars and I've made some great friends during my daily commute.",
      rating: 5,
      image: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Raj Singh",
      role: "Journalist",
      content: "As someone new to the city, JoinMe was a lifesaver. I've attended concerts, festivals, and meetups with amazing people.",
      rating: 5,
      image: "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop&crop=face"
    }
  ];

  const stats = [
    { icon: Heart, value: "98%", label: "User Satisfaction", iconBg: "bg-pink-100 dark:bg-pink-900/30", iconText: "text-pink-500" },
    { icon: Globe, value: "25+", label: "Cities", iconBg: "bg-indigo-100 dark:bg-indigo-900/30", iconText: "text-indigo-500" },
    { icon: Star, value: "4.9", label: "App Rating", iconBg: "bg-yellow-100 dark:bg-yellow-900/30", iconText: "text-yellow-500" }
  ];

  return (
    <section id="about" className="py-20 sm:py-28 bg-gradient-to-b from-white via-indigo-50/30 to-white dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-100/40 dark:bg-indigo-900/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-100/30 dark:bg-purple-900/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16 sm:mb-20">
          <div className="inline-flex items-center bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-full px-5 py-2 text-indigo-600 dark:text-indigo-400 font-semibold text-sm mb-6">
            <Shield className="h-4 w-4 mr-2" /> Trusted Community
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight">
            Building Connections That
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600"> Matter</span>
          </h2>
          
          <div className="max-w-3xl mx-auto">
            <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
              JoinMe was born from a simple belief: life is better when shared. We're passionate about creating meaningful connections that transform everyday activities into memorable experiences.
            </p>
            <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed">
              Our platform combines cutting-edge technology with genuine human connection, making it safe, easy, and fun to find your perfect activity companion.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto mt-14">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 shadow-lg shadow-gray-100/50 dark:shadow-none border border-gray-100 dark:border-gray-800 hover:-translate-y-1 transition-all duration-300">
                <div className={`inline-flex p-3 rounded-xl ${stat.iconBg} mb-4`}>
                  <stat.icon className={`h-6 w-6 ${stat.iconText}`} />
                </div>
                <div className="text-3xl font-extrabold text-gray-900 dark:text-white mb-1">{stat.value}</div>
                <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-20">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-center text-gray-900 dark:text-white mb-12">
            What Our Community Says
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white dark:bg-slate-800/50 rounded-3xl p-8 relative border border-gray-100 dark:border-gray-800 shadow-lg shadow-gray-100/50 dark:shadow-none hover:-translate-y-2 hover:shadow-xl transition-all duration-300 group">
                <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Quote className="h-16 w-16 text-indigo-600" />
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-8 italic relative z-10">
                  "{testimonial.content}"
                </p>
                
                <div className="flex items-center gap-4">
                  <img 
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-100 dark:ring-indigo-900"
                  />
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white">{testimonial.name}</div>
                    <div className="text-gray-500 dark:text-gray-400 text-sm">{testimonial.role}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 mt-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-10 sm:p-14 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="relative z-10">
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white mb-6">Our Mission</h3>
            <p className="text-lg text-indigo-100 leading-relaxed max-w-3xl mx-auto">
              To create a world where distance, schedules, and social barriers never prevent people 
              from experiencing life's best moments together. We believe that every shared experience 
              makes us more connected, more understanding, and ultimately more human.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
