import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Heart, User, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';

export default function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, [location]);

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/symptom-checker', label: 'Symptom Checker' },
    { path: '/doctors', label: 'Find Doctors' },
    { path: '/health-tips', label: 'Health Tips' },
    { path: '/emergency', label: 'Emergency' }
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    setUser(null);
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 nav-glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button
            data-testid="nav-logo"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 font-bold text-xl text-primary"
          >
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            HealthAdvisor
          </button>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isActive(item.path) ? 'bg-primary text-white' : 'text-primary hover:bg-primary/10'
                }`}
              >
                {item.label}
              </button>
            ))}

            {user ? (
              <div className="relative ml-4">
                <button
                  data-testid="profile-dropdown-btn"
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white hover:bg-primary/90 transition-all"
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">{user.name}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2">
                    <button
                      data-testid="nav-dashboard"
                      onClick={() => {
                        navigate(user.role === 'admin' ? '/admin' : '/dashboard');
                        setShowDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-primary/10 flex items-center gap-2"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </button>
                    <button
                      data-testid="nav-patient-records"
                      onClick={() => {
                        navigate('/patient-records');
                        setShowDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-primary/10 flex items-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      Patient Records
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      data-testid="nav-logout"
                      onClick={() => {
                        handleLogout();
                        setShowDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-4">
                <button
                  data-testid="nav-signin"
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 rounded-full text-sm font-medium text-primary hover:bg-primary/10 transition-all"
                >
                  Sign In
                </button>
                <button
                  data-testid="nav-signup"
                  onClick={() => navigate('/signup')}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-all"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-primary hover:bg-primary/10"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-2 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setIsOpen(false);
                }}
                className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive(item.path) ? 'bg-primary text-white' : 'text-primary hover:bg-primary/10'
                }`}
              >
                {item.label}
              </button>
            ))}
            
            <div className="border-t border-gray-200 my-2"></div>
            
            {user ? (
              <>
                <button
                  onClick={() => {
                    navigate(user.role === 'admin' ? '/admin' : '/dashboard');
                    setIsOpen(false);
                  }}
                  className="block w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-primary hover:bg-primary/10"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="block w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    navigate('/login');
                    setIsOpen(false);
                  }}
                  className="block w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-primary hover:bg-primary/10"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    navigate('/signup');
                    setIsOpen(false);
                  }}
                  className="block w-full text-left px-4 py-3 rounded-lg text-sm font-medium bg-primary text-white"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}