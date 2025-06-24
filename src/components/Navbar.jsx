import React, { useState, useEffect } from 'react';
import { Menu, X, Users } from 'lucide-react';

const Navbar = (props) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 bg-white/95 backdrop-blur-xl shadow-xl border-b border-gray-200/50`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18 py-2">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600">
              <Users className="h-7 w-7 text-white" />
            </div>
            <span className="text-3xl font-black text-gray-800">
              Join<span className="text-blue-600">Me</span>
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-10">
            <button
              onClick={() => scrollToSection('home')}
              className="font-semibold text-gray-700 hover:text-blue-600 transition-all duration-300 hover:scale-105"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="font-semibold text-gray-700 hover:text-blue-600 transition-all duration-300 hover:scale-105"
            >
              Explore
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="font-semibold text-gray-700 hover:text-blue-600 transition-all duration-300 hover:scale-105"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="font-semibold text-gray-700 hover:text-blue-600 transition-all duration-300 hover:scale-105"
            >
              About
            </button>
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              className="font-semibold text-gray-700 hover:text-blue-600 transition-all duration-300 hover:scale-105"
              onClick={props.onLoginClick}
            >
              Login
            </button>
            <button
              onClick={props.onSignupClick}
              className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5"
            >
              Sign Up
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white/95 backdrop-blur-xl rounded-2xl mt-2 shadow-2xl border border-gray-200/50">
              <button
                onClick={() => scrollToSection('home')}
                className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-xl font-medium transition-all"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-xl font-medium transition-all"
              >
                Explore
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-xl font-medium transition-all"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-xl font-medium transition-all"
              >
                About
              </button>
              <div className="px-4 py-1 space-y-3 border-t border-gray-200">
                <button
                  className="block w-full text-left text-gray-700 hover:text-blue-600 font-medium"
                  onClick={() => {
                    if (props.onLoginClick) props.onLoginClick();
                    setIsMenuOpen(false);
                  }}
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    if (props.onSignupClick) props.onSignupClick();
                    setIsMenuOpen(false);
                  }}
                  className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5"
                >
                  Sign Up
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
