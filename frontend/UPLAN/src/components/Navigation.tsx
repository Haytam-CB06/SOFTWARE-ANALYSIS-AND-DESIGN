import { Calendar, Moon, Sun } from 'lucide-react';
import { Button } from './ui/button';
import logoImage from 'figma:asset/0550e77f773f70cb0e6201f9400b3cccad8c1d9b.png';
import { useState, useEffect } from 'react';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const [darkMode, setDarkMode] = useState(() => {
    // Load dark mode from localStorage
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleSectionScroll = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About Us' },
    { id: 'services', label: 'Services' },
  ];

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo with Corporate Text */}
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => handleSectionScroll('home')}
          >
            <div className="relative">
              <img 
                src={logoImage} 
                alt="PLAN Logo" 
                className="w-14 h-14 rounded-lg shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105" 
              />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-xl tracking-tight transition-all duration-300 group-hover:text-blue-50">
                PLAN
              </span>
              <span className="text-blue-100 text-xs tracking-wide uppercase transition-all duration-300 group-hover:text-white">
                Corporate Academic Service
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-1 sm:gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSectionScroll(item.id)}
                className="px-3 sm:px-4 py-2 rounded-md transition-colors text-white hover:bg-blue-700"
              >
                {item.label}
              </button>
            ))}
            
            {/* Dark Mode Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="ml-2 w-9 h-9 rounded-md hover:bg-blue-700 text-white"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? (
                <Sun className="h-5 w-5 text-white" />
              ) : (
                <Moon className="h-5 w-5 text-white" />
              )}
            </Button>
            
            <Button 
              onClick={() => onNavigate('auth')}
              className="ml-2 bg-white text-blue-600 hover:bg-blue-50"
            >
              Log In
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}