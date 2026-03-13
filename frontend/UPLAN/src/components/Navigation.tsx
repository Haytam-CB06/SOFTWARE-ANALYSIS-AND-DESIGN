import { Calendar, Moon, Sun } from 'lucide-react';
import { Button } from './ui/button';
import logoImage from 'figma:asset/0550e77f773f70cb0e6201f9400b3cccad8c1d9b.png';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
  <nav className="sticky top-0 z-50 border-b border-white/10 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 shadow-lg backdrop-blur">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex h-16 items-center justify-between sm:h-20">
        {/* Logo */}
        <button
          className="group flex items-center gap-3 text-left"
          onClick={() => {
            setMobileMenuOpen(false);
            handleSectionScroll('home');
          }}
        >
          <div className="relative shrink-0">
            <img
              src={logoImage}
              alt="PLAN Logo"
              className="h-11 w-11 rounded-xl shadow-md transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg sm:h-14 sm:w-14"
            />
          </div>

          <div className="min-w-0">
            <div className="truncate text-lg font-bold tracking-tight text-white transition-all duration-300 group-hover:text-blue-50 sm:text-xl">
              PLAN
            </div>
            <div className="hidden truncate text-[11px] uppercase tracking-wide text-blue-100 transition-all duration-300 group-hover:text-white sm:block">
              Corporate Academic Service
            </div>
          </div>
        </button>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSectionScroll(item.id)}
              className="rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              {item.label}
            </button>
          ))}

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="ml-2 h-10 w-10 rounded-xl text-white hover:bg-white/10"
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
            className="ml-2 rounded-xl bg-white px-5 text-blue-700 hover:bg-blue-50"
          >
            Log In
          </Button>
        </div>

        {/* Mobile actions */}
        <div className="flex items-center gap-2 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="h-10 w-10 rounded-xl text-white hover:bg-white/10"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? (
              <Sun className="h-5 w-5 text-white" />
            ) : (
              <Moon className="h-5 w-5 text-white" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="h-10 w-10 rounded-xl text-white hover:bg-white/10"
            title="Open menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 text-white" />
            ) : (
              <Menu className="h-5 w-5 text-white" />
            )}
          </Button>
        </div>
      </div>
    </div>

    {/* Mobile menu */}
    {mobileMenuOpen && (
      <div className="border-t border-white/10 bg-blue-700/95 px-4 py-4 backdrop-blur lg:hidden">
        <div className="mx-auto max-w-7xl space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setMobileMenuOpen(false);
                handleSectionScroll(item.id);
              }}
              className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-white transition-colors hover:bg-white/10"
            >
              <span className="font-medium">{item.label}</span>
            </button>
          ))}

          <div className="pt-2">
            <Button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('auth');
              }}
              className="h-11 w-full rounded-2xl bg-white text-blue-700 hover:bg-blue-50"
            >
              Log In
            </Button>
          </div>
        </div>
      </div>
    )}
  </nav>
);}