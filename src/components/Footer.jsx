import React from 'react';
import { 
  Users, 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin,
  ArrowRight
} from 'lucide-react';

import { useUser } from '../context/userContext';

const Footer = () => {
  const { user } = useUser();
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Features', href: '#features' },
    { name: 'About', href: '#about' },
    { name: 'Contact', href: '#contact' }
  ];

  const categories = [
    { name: 'Sports & Fitness', href: '#' },
    { name: 'Ride Sharing', href: '#' },
    { name: 'Events & Entertainment', href: '#' },
    { name: 'Social Meetups', href: '#' }
  ];

  const support = [
    { name: 'Help Center', href: '#' },
    { name: 'Safety Guidelines', href: '#' },
    { name: 'Privacy Policy', href: '#' },
    { name: 'Terms of Service', href: '#' }
  ];

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId.replace('#', ''));
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-[#0B0F19] text-gray-300 relative overflow-hidden mt-auto">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* 🟢 Newsletter Section (visible only for guests) */}
      {!user && (
        <div className="relative z-10 bg-gradient-to-br from-indigo-600 to-purple-700 py-12 sm:py-16 overflow-hidden">
           {/* Glass overlay */}
           <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"></div>
           
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
            <div className="text-center max-w-2xl mx-auto">
              <h3 className="text-2xl sm:text-3xl font-black mb-3 text-white tracking-tight">Stay Connected</h3>
              <p className="text-indigo-100 mb-8 text-sm sm:text-base font-medium">
                Get the latest updates, event tips, and exclusive local offers delivered straight to your inbox.
              </p>
              
              {/* Sleek Input Group */}
              <form className="flex flex-col sm:flex-row max-w-md mx-auto gap-3 sm:gap-0 sm:bg-white sm:p-1.5 sm:rounded-full sm:shadow-2xl">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="flex-1 px-6 py-3.5 sm:py-3 rounded-full sm:rounded-none sm:rounded-l-full text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:focus:ring-0 sm:border-transparent font-medium"
                  required
                />
                <button className="bg-indigo-950 text-white px-8 py-3.5 sm:py-3 rounded-full font-bold hover:bg-gray-900 transition-all flex items-center justify-center space-x-2 shadow-lg sm:shadow-none hover:scale-105 sm:hover:scale-100">
                  <span>Subscribe</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 Main Footer Content */}
      <div className="pt-16 pb-8 relative z-10 border-t border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12">
            
            {/* Brand Section */}
            <div className="sm:col-span-2 lg:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <span className="text-3xl font-black text-white tracking-tight">
                  Join<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Me</span>
                </span>
              </div>
              <p className="text-gray-400 leading-relaxed mb-8 max-w-sm text-sm font-medium">
                Connecting people for meaningful experiences. Whether it's sports, rides, 
                events, or adventures, we bring communities together one connection at a time.
              </p>
              
              {/* Social Icons */}
              <div className="flex items-center space-x-3">
                <a href="#" className="p-2.5 bg-gray-800/50 border border-gray-700/50 rounded-full hover:bg-blue-600 hover:border-blue-500 hover:text-white transition-all shadow-sm">
                  <Facebook className="h-4 w-4" />
                </a>
                <a href="#" className="p-2.5 bg-gray-800/50 border border-gray-700/50 rounded-full hover:bg-sky-500 hover:border-sky-400 hover:text-white transition-all shadow-sm">
                  <Twitter className="h-4 w-4" />
                </a>
                <a href="#" className="p-2.5 bg-gray-800/50 border border-gray-700/50 rounded-full hover:bg-pink-600 hover:border-pink-500 hover:text-white transition-all shadow-sm">
                  <Instagram className="h-4 w-4" />
                </a>
                <a href="#" className="p-2.5 bg-gray-800/50 border border-gray-700/50 rounded-full hover:bg-blue-700 hover:border-blue-600 hover:text-white transition-all shadow-sm">
                  <Linkedin className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white text-base font-bold mb-5 tracking-wide uppercase">Quick Links</h4>
              <ul className="space-y-3">
                {quickLinks.map((link, index) => (
                  <li key={index}>
                    <button
                      onClick={() => scrollToSection(link.href)}
                      className="text-gray-400 hover:text-indigo-400 transition-colors text-sm font-medium flex items-center gap-2 group"
                    >
                      <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-indigo-400 transition-colors"></span>
                      {link.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Categories */}
            <div>
              <h4 className="text-white text-base font-bold mb-5 tracking-wide uppercase">Categories</h4>
              <ul className="space-y-3">
                {categories.map((category, index) => (
                  <li key={index}>
                    <a href={category.href} className="text-gray-400 hover:text-indigo-400 transition-colors text-sm font-medium flex items-center gap-2 group">
                      <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-indigo-400 transition-colors"></span>
                      {category.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-white text-base font-bold mb-5 tracking-wide uppercase">Support</h4>
              <ul className="space-y-3">
                {support.map((item, index) => (
                  <li key={index}>
                    <a href={item.href} className="text-gray-400 hover:text-indigo-400 transition-colors text-sm font-medium flex items-center gap-2 group">
                      <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-indigo-400 transition-colors"></span>
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 🟢 Contact Info - Mobile Optimized Grid */}
          <div className="mt-16 pt-8 border-t border-gray-800/60">
            <div className="flex flex-col md:flex-row justify-center items-center gap-4 sm:gap-6 flex-wrap">
              <a href="mailto:support@joinme.com" className="w-full md:w-auto flex items-center justify-center gap-3 px-6 py-3.5 bg-gray-900/50 hover:bg-gray-800 border border-gray-800 hover:border-indigo-500/50 rounded-2xl transition-all group">
                <div className="p-2 bg-indigo-500/10 rounded-lg group-hover:bg-indigo-500/20 transition-colors">
                  <Mail className="h-5 w-5 text-indigo-400" />
                </div>
                <span className="text-gray-300 font-bold text-sm tracking-wide">support@joinme.com</span>
              </a>
              
              <a href="tel:+919699657211" className="w-full md:w-auto flex items-center justify-center gap-3 px-6 py-3.5 bg-gray-900/50 hover:bg-gray-800 border border-gray-800 hover:border-indigo-500/50 rounded-2xl transition-all group">
                <div className="p-2 bg-indigo-500/10 rounded-lg group-hover:bg-indigo-500/20 transition-colors">
                  <Phone className="h-5 w-5 text-indigo-400" />
                </div>
                <span className="text-gray-300 font-bold text-sm tracking-wide">+91-9699657211</span>
              </a>
              
              <div className="w-full md:w-auto flex items-center justify-center gap-3 px-6 py-3.5 bg-gray-900/50 hover:bg-gray-800 border border-gray-800 hover:border-indigo-500/50 rounded-2xl transition-all group cursor-default">
                <div className="p-2 bg-indigo-500/10 rounded-lg group-hover:bg-indigo-500/20 transition-colors">
                  <MapPin className="h-5 w-5 text-indigo-400" />
                </div>
                <span className="text-gray-300 font-bold text-sm tracking-wide">Mumbai, IN</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🟢 Bottom Bar */}
      <div className="border-t border-gray-800/80 bg-black/20 py-6 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-500 text-xs sm:text-sm font-medium text-center md:text-left">
              © {currentYear} <span className="font-bold text-gray-300">JoinMe</span>. All rights reserved.
            </p>
            <div className="flex items-center space-x-6 text-xs sm:text-sm font-bold">
              <a href="#" className="text-gray-500 hover:text-indigo-400 transition-colors">Privacy Policy</a>
              <a href="#" className="text-gray-500 hover:text-indigo-400 transition-colors">Terms of Service</a>
              <a href="#" className="text-gray-500 hover:text-indigo-400 transition-colors">Cookies Settings</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;