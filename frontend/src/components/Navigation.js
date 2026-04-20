import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Heart } from 'lucide-react';

export default function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/symptom-checker', label: 'Symptom Checker' },
    { path: '/doctors', label: 'Find Doctors' },
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/patient-records', label: 'Patient Records' },
    { path: '/health-tips', label: 'Health Tips' },
    { path: '/emergency', label: 'Emergency' }
  ];

  const isActive = (path) => location.pathname === path;

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
                data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                onClick={() => navigate(item.path)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isActive(item.path)
                    ? 'bg-primary text-white'
                    : 'text-primary hover:bg-primary/10'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            data-testid="mobile-menu-toggle"
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-primary hover:bg-primary/10"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div data-testid="mobile-menu" className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-2 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.path}
                data-testid={`mobile-nav-${item.label.toLowerCase().replace(' ', '-')}`}
                onClick={() => {
                  navigate(item.path);
                  setIsOpen(false);
                }}
                className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive(item.path)
                    ? 'bg-primary text-white'
                    : 'text-primary hover:bg-primary/10'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}