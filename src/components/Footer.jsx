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

      {/* Newsletter Section (visible only for guests) */}
      {!user && (
        <div className="relative z-10 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 py-14 sm:py-20 overflow-hidden">
          {/* Glass overlay */}
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"></div>
          {/* Subtle grid */}
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
            <div className="text-center max-w-2xl mx-auto">
              <h3 className="text-2xl sm:text-4xl font-extrabold mb-4 text-white tracking-tight">Stay Connected</h3>
              <p className="text-indigo-100/80 mb-8 text-sm sm:text-lg font-medium leading-relaxed">
                Get the latest updates, event tips, and exclusive local offers delivered straight to your inbox.
              </p>

              <form className="flex flex-col sm:flex-row max-w-md mx-auto gap-3 sm:gap-0 sm:bg-white/10 sm:backdrop-blur-xl sm:p-1.5 sm:rounded-2xl sm:border sm:border-white/20 sm:shadow-2xl">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="flex-1 px-6 py-3.5 sm:py-3 rounded-xl sm:rounded-none sm:rounded-l-xl text-white sm:text-white placeholder-white/50 bg-white/10 sm:bg-transparent border border-white/20 sm:border-transparent focus:outline-none focus:ring-2 focus:ring-white/30 sm:focus:ring-0 font-medium"
                  required
                />
                <button className="bg-white text-indigo-700 px-8 py-3.5 sm:py-3 rounded-xl font-bold hover:bg-indigo-50 transition-all flex items-center justify-center space-x-2 shadow-lg hover:scale-105 sm:hover:scale-100 active:scale-95">
                  <span>Subscribe</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Main Footer Content */}
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
                <a href="#" className="p-2.5 bg-gray-800/50 border border-gray-700/50 rounded-xl hover:bg-blue-600 hover:border-blue-500 hover:text-white hover:-translate-y-1 transition-all shadow-sm">
                  <Facebook className="h-4 w-4" />
                </a>
                <a href="#" className="p-2.5 bg-gray-800/50 border border-gray-700/50 rounded-xl hover:bg-sky-500 hover:border-sky-400 hover:text-white hover:-translate-y-1 transition-all shadow-sm">
                  <Twitter className="h-4 w-4" />
                </a>
                <a href="#" className="p-2.5 bg-gray-800/50 border border-gray-700/50 rounded-xl hover:bg-pink-600 hover:border-pink-500 hover:text-white hover:-translate-y-1 transition-all shadow-sm">
                  <Instagram className="h-4 w-4" />
                </a>
                <a href="#" className="p-2.5 bg-gray-800/50 border border-gray-700/50 rounded-xl hover:bg-blue-700 hover:border-blue-600 hover:text-white hover:-translate-y-1 transition-all shadow-sm">
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
                      className="text-gray-400 hover:text-indigo-400 transition-colors text-sm font-medium flex items-center gap-2.5 group"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-700 group-hover:bg-indigo-400 group-hover:shadow-sm group-hover:shadow-indigo-400/50 transition-all"></span>
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
                    <a href={category.href} className="text-gray-400 hover:text-indigo-400 transition-colors text-sm font-medium flex items-center gap-2.5 group">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-700 group-hover:bg-indigo-400 group-hover:shadow-sm group-hover:shadow-indigo-400/50 transition-all"></span>
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
                    <a href={item.href} className="text-gray-400 hover:text-indigo-400 transition-colors text-sm font-medium flex items-center gap-2.5 group">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-700 group-hover:bg-indigo-400 group-hover:shadow-sm group-hover:shadow-indigo-400/50 transition-all"></span>
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Gradient divider */}
          <div className="mt-16 mb-8">
            <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
          </div>

          {/* Contact Info */}
          <div>
            <div className="flex flex-col md:flex-row justify-center items-center gap-4 sm:gap-5 flex-wrap">
              <a href="mailto:support@joinme.com" className="w-full md:w-auto flex items-center justify-center gap-3 px-6 py-3.5 bg-gray-900/50 hover:bg-gray-800 border border-gray-800 hover:border-indigo-500/50 rounded-2xl transition-all group hover:-translate-y-0.5">
                <div className="p-2 bg-indigo-500/10 rounded-lg group-hover:bg-indigo-500/20 transition-colors">
                  <Mail className="h-5 w-5 text-indigo-400" />
                </div>
                <span className="text-gray-300 font-bold text-sm tracking-wide">support@joinme.com</span>
              </a>

              <a href="tel:+919699657211" className="w-full md:w-auto flex items-center justify-center gap-3 px-6 py-3.5 bg-gray-900/50 hover:bg-gray-800 border border-gray-800 hover:border-indigo-500/50 rounded-2xl transition-all group hover:-translate-y-0.5">
                <div className="p-2 bg-indigo-500/10 rounded-lg group-hover:bg-indigo-500/20 transition-colors">
                  <Phone className="h-5 w-5 text-indigo-400" />
                </div>
                <span className="text-gray-300 font-bold text-sm tracking-wide">+91-9699657211</span>
              </a>

              <div className="w-full md:w-auto flex items-center justify-center gap-3 px-6 py-3.5 bg-gray-900/50 hover:bg-gray-800 border border-gray-800 hover:border-indigo-500/50 rounded-2xl transition-all group cursor-default hover:-translate-y-0.5">
                <div className="p-2 bg-indigo-500/10 rounded-lg group-hover:bg-indigo-500/20 transition-colors">
                  <MapPin className="h-5 w-5 text-indigo-400" />
                </div>
                <span className="text-gray-300 font-bold text-sm tracking-wide">Mumbai, IN</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
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
