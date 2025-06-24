import React from 'react';
import { Quote, Star, Heart, Globe } from 'lucide-react';

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
      name: "Bhaiya Gaikwad",
      role: "Kingmaker",
      content: "As someone new to the city, JoinMe was a lifesaver. I've attended concerts, festivals, and meetups with amazing people.",
      rating: 5,
      image: "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop&crop=face"
    }
  ];

  const stats = [
    { icon: Heart, value: "98%", label: "User Satisfaction" },
    { icon: Globe, value: "25+", label: "Cities" },
    { icon: Star, value: "4.9", label: "App Rating" }
  ];

  return (
    <section id="about" className="py-20 bg-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Building Connections That
            <span className="text-blue-500"> Matter</span>
          </h2>
          <div className="max-w-4xl mx-auto">
            <p className="text-xl text-gray-600 leading-relaxed mb-6">
              JoinMe was born from a simple belief: life is better when shared. We're passionate about 
              creating meaningful connections that transform everyday activities into memorable experiences.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              Our platform combines cutting-edge technology with genuine human connection, making it safe, 
              easy, and fun to find your perfect activity companion. From weekend adventures to daily routines, 
              we're here to ensure you never have to do it alone.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto mb-16">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex p-4 bg-blue-100 rounded-full mb-4">
                  <stat.icon className="h-8 w-8 text-blue-500" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            What Our Community Says
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl p-8 relative hover:shadow-lg transition-shadow">
                <Quote className="h-8 w-8 text-blue-500 mb-4" />
                
                <p className="text-gray-700 leading-relaxed mb-6 italic">
                  "{testimonial.content}"
                </p>
                
                <div className="flex items-center space-x-4">
                  <img 
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-gray-600 text-sm">{testimonial.role}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1 mt-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mission Statement */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-12 text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h3>
          <p className="text-xl text-gray-700 leading-relaxed max-w-4xl mx-auto">
            To create a world where distance, schedules, and social barriers never prevent people 
            from experiencing life's best moments together. We believe that every shared experience 
            makes us more connected, more understanding, and ultimately more human.
          </p>
        </div>
      </div>
    </section>
  );
};

export default About;