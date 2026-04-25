import { Moon, Sun, Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import logoImage from 'figma:asset/0550e77f773f70cb0e6201f9400b3cccad8c1d9b.png';
import { useState, useEffect } from 'react';
import LanguageSwitcher from './LanguageSwitcher';
import { getInitialDarkMode, saveDarkMode, subscribeToDarkModeChanges } from '../utils/theme';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const { t } = useTranslation();

  const [darkMode, setDarkMode] = useState(getInitialDarkMode);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(currentPage || 'home');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= 1024;
  });

  useEffect(() => {
    saveDarkMode(darkMode);
  }, [darkMode]);

  useEffect(() => subscribeToDarkModeChanges(setDarkMode), []);

  useEffect(() => {
    if (currentPage) {
      setActiveSection(currentPage);
    }
  }, [currentPage]);

  useEffect(() => {
    const updateScrolled = () => {
      const scrollTop =
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;
      setIsScrolled(scrollTop > 16);
      setIsDesktop(window.innerWidth >= 1024);
    };

    updateScrolled();
    window.addEventListener('scroll', updateScrolled, { passive: true });
    document.addEventListener('scroll', updateScrolled, { passive: true, capture: true });
    window.addEventListener('resize', updateScrolled);

    return () => {
      window.removeEventListener('scroll', updateScrolled);
      document.removeEventListener('scroll', updateScrolled, { capture: true } as EventListenerOptions);
      window.removeEventListener('resize', updateScrolled);
    };
  }, []);

  useEffect(() => {
    const sectionIds = ['home', 'about', 'services'];

    let ticking = false;

    const updateActiveSection = () => {
      const scrollPosition = window.scrollY + 140;

      let currentSection = 'home';

      for (const id of sectionIds) {
        const element = document.getElementById(id);
        if (!element) continue;

        const offsetTop = element.offsetTop;
        if (scrollPosition >= offsetTop) {
          currentSection = id;
        }
      }

      setActiveSection((prev) => (prev !== currentSection ? currentSection : prev));
      const scrollTop =
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;
      setIsScrolled(scrollTop > 16);
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateActiveSection);
        ticking = true;
      }
    };

    updateActiveSection();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleOpenPlans = () => {
    setMobileMenuOpen(false);
    if (currentPage !== 'home') {
      sessionStorage.setItem('pendingHomePlans', 'true');
      onNavigate('home');
      return;
    }

    window.dispatchEvent(new CustomEvent('uplan:open-plans'));
  };

  const handleSectionScroll = (sectionId: string) => {
    setActiveSection(sectionId);
    setMobileMenuOpen(false);

    if (currentPage !== 'home') {
      sessionStorage.setItem('pendingHomeSection', sectionId);
      onNavigate('home');
      return;
    }

    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  const navItems = [
    { id: 'home', label: t('navigation.home', 'Home') },
    { id: 'about', label: t('navigation.about', 'About us') },
    { id: 'services', label: t('navigation.services', 'Services') },
  ];

  const floatingVisible = isDesktop && isScrolled;

  return (
    <>
    <nav
      style={{
        transform: floatingVisible ? 'translateY(-100%)' : 'translateY(0)',
        opacity: floatingVisible ? 0 : 1,
        pointerEvents: floatingVisible ? 'none' : 'auto',
      }}
      className="sticky top-0 z-50 border-b border-blue-200 bg-slate-50/95 backdrop-blur-xl transition-all duration-500 dark:border-blue-900 dark:bg-slate-950/95"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-0 top-0 h-full w-40 bg-blue-700/5 blur-3xl dark:bg-blue-700/10" />
        <div className="absolute right-0 top-0 h-full w-40 bg-blue-700/5 blur-3xl dark:bg-blue-700/10" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-18 items-center justify-between">
          <button
            className="group relative flex items-center gap-3 rounded-2xl px-2 py-1.5 text-left transition-all duration-300 hover:scale-[1.01]"
            onClick={() => {
              handleSectionScroll('home');
            }}
          >
            <div className="relative overflow-hidden rounded-2xl border border-blue-200 bg-blue-50 p-1.5 shadow-sm transition-all duration-300 group-hover:shadow-md dark:border-blue-800 dark:bg-blue-950/50">
              <img
                src={logoImage}
                alt={t('navigation.logoAlt')}
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                className="h-10 w-10 select-none rounded-xl object-cover transition-transform duration-500 group-hover:scale-105 sm:h-12 sm:w-12"
              />
            </div>

            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="text-base font-bold tracking-[0.22em] text-blue-700 dark:text-blue-400 sm:text-lg">
                  UPLAN
                </div>
                
              </div>
              <div className="hidden text-xs font-medium text-slate-500 dark:text-slate-400 sm:block">
                {t('navigation.subtitle')}
              </div>
            </div>
          </button>

          <div className="hidden items-center gap-2 lg:flex">
            <div className="flex items-center gap-1 rounded-full border border-blue-200 bg-slate-50 p-1 shadow-sm dark:border-blue-900 dark:bg-slate-900">
              {navItems.map((item) => {
                const isActive = activeSection === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSectionScroll(item.id)}
                    className={`relative rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? 'bg-blue-700 text-white shadow-sm dark:bg-blue-700 dark:text-white'
                        : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-400'
                    }`}
                  >
                    <span className="relative z-10">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden items-center gap-3 lg:flex">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
                className="group h-10 w-10 rounded-full border border-blue-200 bg-white text-blue-700 shadow-sm transition-all duration-300 hover:scale-105 hover:bg-blue-50 hover:text-blue-700 dark:border-blue-900 dark:bg-slate-900 dark:text-blue-400 dark:hover:bg-slate-800 dark:hover:text-blue-300"
                title={
                  darkMode
                    ? t('navigation.switchToLight')
                    : t('navigation.switchToDark')
                }
              >
                {darkMode ? (
                  <Sun className="h-5 w-5 transition-transform duration-500 group-hover:rotate-12" />
                ) : (
                  <Moon className="h-5 w-5 transition-transform duration-500 group-hover:-rotate-12" />
                )}
              </Button>

              <LanguageSwitcher />

              <Button
                onClick={() => onNavigate('auth')}
                className="rounded-full bg-blue-700 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:scale-[1.03] hover:bg-blue-800 active:scale-95 dark:bg-blue-700 dark:text-white dark:hover:bg-blue-600"
              >
                {t('navigation.login')}
              </Button>
            </div>

            <div className="flex items-center gap-2 lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
                className="group h-10 w-10 rounded-full border border-blue-200 bg-white text-blue-700 shadow-sm transition-all duration-300 hover:scale-105 hover:bg-blue-50 hover:text-blue-700 dark:border-blue-900 dark:bg-slate-900 dark:text-blue-400 dark:hover:bg-slate-800 dark:hover:text-blue-300"
                title={
                  darkMode
                    ? t('navigation.switchToLight')
                    : t('navigation.switchToDark')
                }
              >
                {darkMode ? (
                  <Sun className="h-5 w-5 transition-transform duration-500 group-hover:rotate-12" />
                ) : (
                  <Moon className="h-5 w-5 transition-transform duration-500 group-hover:-rotate-12" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="group h-10 w-10 rounded-full border border-blue-200 bg-white text-blue-700 shadow-sm transition-all duration-300 hover:scale-105 hover:bg-blue-50 hover:text-blue-700 dark:border-blue-900 dark:bg-slate-900 dark:text-blue-400 dark:hover:bg-slate-800 dark:hover:text-blue-300"
                title={t('navigation.openMenu')}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" />
                ) : (
                  <Menu className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`overflow-hidden border-t border-blue-200 bg-white/95 backdrop-blur-xl transition-all duration-300 dark:border-blue-900 dark:bg-slate-950/95 lg:hidden ${
          mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="mx-4 my-3 rounded-3xl border border-blue-200 bg-slate-50 p-3 shadow-lg dark:border-blue-900 dark:bg-slate-900">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSectionScroll(item.id);
                  }}
                  className={`block w-full rounded-2xl px-4 py-3 text-left text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-blue-700 text-white shadow-sm dark:bg-blue-700 dark:text-white'
                      : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-400'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}

            <div className="mt-3 border-t border-blue-200 pt-3 dark:border-blue-900">
              <Button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('auth');
                }}
                className="w-full rounded-2xl bg-blue-700 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:bg-blue-800 active:scale-95 dark:bg-blue-700 dark:hover:bg-blue-600"
              >
                {t('navigation.login')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <div
      style={{
        zIndex: 80,
        display: isDesktop ? 'block' : 'none',
        opacity: floatingVisible ? 1 : 0,
        pointerEvents: floatingVisible ? 'auto' : 'none',
        transform: floatingVisible
          ? 'translate(-50%, 0)'
          : 'translate(-50%, -16px)',
      }}
      className="fixed left-1/2 top-4 w-max max-w-[calc(100vw-2rem)] transition-all duration-500"
      aria-hidden={!floatingVisible}
    >
      <div className="mx-auto flex max-w-[calc(100vw-2rem)] items-center gap-1 overflow-x-auto rounded-lg border border-slate-200/90 bg-white/92 px-1 py-0.5 shadow-[0_10px_26px_rgba(15,23,42,0.12)] ring-1 ring-white/70 backdrop-blur-2xl dark:border-slate-700/80 dark:bg-slate-950/88 dark:ring-white/10">
        <button
          onClick={() => handleSectionScroll('home')}
          className="flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-left transition-all duration-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label={t('navigation.logoAlt', 'U PLAN home')}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-md border border-blue-200 bg-blue-50 shadow-sm dark:border-blue-900/60 dark:bg-blue-950/40">
            <img
              src={logoImage}
              alt=""
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              className="h-4.5 w-4.5 rounded object-cover"
            />
          </span>
          <span className="text-[11px] font-bold tracking-[0.12em] text-blue-700 dark:text-blue-400">
            UPLAN
          </span>
        </button>

        <div className="flex min-w-0 items-center justify-center gap-1 px-0.5">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSectionScroll(item.id)}
                className={`shrink-0 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-all duration-300 ${
                  isActive
                    ? 'bg-slate-950 text-white shadow-[0_8px_20px_rgba(15,23,42,0.18)] dark:bg-white dark:text-slate-950'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            onClick={handleOpenPlans}
            className="h-7 rounded-md px-2.5 text-[11px] font-semibold text-slate-600 transition-all duration-300 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            {t('navigation.seePlans', 'See plans')}
          </Button>
          <Button
            onClick={() => onNavigate('auth')}
            className="h-7 rounded-md bg-blue-700 px-3 text-[11px] font-semibold text-white shadow-[0_7px_16px_rgba(37,99,235,0.20)] transition-all duration-300 hover:bg-blue-800 hover:shadow-[0_10px_22px_rgba(37,99,235,0.24)] dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            {t('navigation.login', 'Login')}
          </Button>
        </div>
      </div>
    </div>
    </>
  );
}
