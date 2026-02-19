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
    <footer className="bg-gray-950 text-white">
      {/* Newsletter Section (visible only for guests) */}
      {!user && (
        <div className="bg-gradient-to-r from-blue-700 to-purple-700 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h3 className="text-3xl font-bold mb-2 tracking-tight">Stay Connected</h3>
              <p className="text-blue-100 mb-8 text-lg">
                Get the latest updates, tips, and exclusive offers delivered to your inbox.
              </p>
              <form className="flex flex-col sm:flex-row max-w-md mx-auto gap-4">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 border border-gray-300"
                />
                <button className="bg-white text-blue-700 px-6 py-3 rounded-full font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2 shadow">
                  <span>Subscribe</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Main Footer Content */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2 mb-6">
                <div className="p-2 bg-blue-600 rounded-lg shadow">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold tracking-wide">JoinMe</span>
              </div>
              <p className="text-gray-400 leading-relaxed mb-6 max-w-md">
                Connecting people for meaningful experiences. Whether it's sports, rides, 
                events, or adventures, JoinMe brings communities together one connection at a time.
              </p>
              <div className="flex items-center space-x-4 mt-2">
                <a href="#" className="p-2 bg-gray-800 rounded-full hover:bg-blue-600 transition-colors shadow">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="p-2 bg-gray-800 rounded-full hover:bg-blue-400 transition-colors shadow">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="#" className="p-2 bg-gray-800 rounded-full hover:bg-pink-500 transition-colors shadow">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="#" className="p-2 bg-gray-800 rounded-full hover:bg-blue-700 transition-colors shadow">
                  <Linkedin className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold mb-6">Quick Links</h4>
              <ul className="space-y-4">
                {quickLinks.map((link, index) => (
                  <li key={index}>
                    <button
                      onClick={() => scrollToSection(link.href)}
                      className="text-gray-400 hover:text-blue-400 transition-colors font-medium"
                    >
                      {link.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Categories */}
            <div>
              <h4 className="text-lg font-semibold mb-6">Categories</h4>
              <ul className="space-y-4">
                {categories.map((category, index) => (
                  <li key={index}>
                    <a href={category.href} className="text-gray-400 hover:text-purple-400 transition-colors font-medium">
                      {category.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-lg font-semibold mb-6">Support</h4>
              <ul className="space-y-4">
                {support.map((item, index) => (
                  <li key={index}>
                    <a href={item.href} className="text-gray-400 hover:text-blue-400 transition-colors font-medium">
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contact Info - Centered and Styled */}
          <div className="mt-16 pt-8 border-t border-gray-800">
            <div className="flex flex-col md:flex-row justify-center items-center gap-80">
              <div className="flex items-center gap-3  px-5 py-3 shadow">
                <Mail className="h-5 w-5 text-blue-500" />
                <span className="text-gray-300 font-medium">support@joinme.com</span>
              </div>
              <div className="flex items-center gap-3 px-5 py-3 shadow">
                <Phone className="h-5 w-5 text-blue-500" />
                <span className="text-gray-300 font-medium">+91-9699657211</span>
              </div>
              <div className="flex items-center gap-3 px-5 py-3 shadow">
                <MapPin className="h-5 w-5 text-blue-500" />
                <span className="text-gray-300 font-medium">Mumbai, IN</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm text-center md:text-left">
              © 2024 <span className="font-semibold text-blue-400">JoinMe</span>. All rights reserved.
            </p>
            <div className="flex items-center space-x-6 text-sm">
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors underline underline-offset-4">Privacy</a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors underline underline-offset-4">Terms</a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors underline underline-offset-4">Cookies</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;