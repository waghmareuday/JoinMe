import React, { useState, useEffect } from 'react';
import { Menu, X, Users, UserCircle2, LogOut } from 'lucide-react';

const Navbar = ({ onLoginClick, onSignupClick, loggedIn, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 transition-all duration-500 bg-white/95 backdrop-blur-xl shadow-xl border-b border-gray-200/50">
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

          {/* Navigation or Profile */}
          {loggedIn ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="text-gray-700 hover:text-blue-600 transition-all"
              >
                <UserCircle2 size={32} />
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-lg border border-gray-200 py-2 z-50">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      if (onLogout) onLogout();
                    }}
                    className="flex items-center gap-2 px-4 py-2 w-full text-left text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut size={18} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Nav */}
              <div className="hidden md:flex items-center space-x-10">
                <button onClick={() => scrollToSection('home')} className="font-semibold text-gray-700 hover:text-blue-600">Home</button>
                <button onClick={() => scrollToSection('features')} className="font-semibold text-gray-700 hover:text-blue-600">Explore</button>
                <button onClick={() => scrollToSection('features')} className="font-semibold text-gray-700 hover:text-blue-600">Features</button>
                <button onClick={() => scrollToSection('about')} className="font-semibold text-gray-700 hover:text-blue-600">About</button>
              </div>

              {/* Desktop CTA */}
              <div className="hidden md:flex items-center space-x-4">
                <button onClick={onLoginClick} className="font-semibold text-gray-700 hover:text-blue-600">Login</button>
                <button
                  onClick={onSignupClick}
                  className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5"
                >
                  Sign Up
                </button>
              </div>
            </>
          )}

          {/* Mobile menu button */}
          {!loggedIn && (
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          )}
        </div>

        {/* Mobile Navigation */}
        {!loggedIn && isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white rounded-2xl mt-2 shadow-lg border border-gray-200">
              {['home', 'features', 'about'].map((id) => (
                <button
                  key={id}
                  onClick={() => scrollToSection(id)}
                  className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-xl font-medium"
                >
                  {id.charAt(0).toUpperCase() + id.slice(1)}
                </button>
              ))}
              <div className="px-4 pt-3 border-t border-gray-200 space-y-2">
                <button onClick={onLoginClick} className="block w-full text-left text-gray-700 hover:text-blue-600 font-medium">Login</button>
                <button
                  onClick={onSignupClick}
                  className="w-full py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700"
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
