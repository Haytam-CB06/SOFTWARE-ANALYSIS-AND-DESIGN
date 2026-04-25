import { lazy, Suspense } from 'react';
import { PageType } from '../types';

const HomePage = lazy(() => import('./HomePage'));
const AuthPage = lazy(() => import('../../components/AuthPage'));
const TermsOfService = lazy(() => import('../../components/TermsOfService'));
const PrivacyPolicy = lazy(() => import('../../components/PrivacyPolicy'));

interface PublicPagesProps {
  currentPage: PageType;
  onNavigate: (page: string) => void;
  onBack: () => void;
  onLogin: (name: string, email: string) => void;
}

/**
 * Renders public-facing pages (before authentication)
 */
export const PublicPages = ({ currentPage, onNavigate, onBack, onLogin }: PublicPagesProps) => {
  const pageFallback = (
    <div className="min-h-[70vh] animate-pulse bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl">
        <div className="h-8 w-56 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="mt-6 h-64 rounded-2xl bg-slate-100 dark:bg-slate-900" />
      </div>
    </div>
  );

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={onNavigate} />;
      case 'auth':
        return <AuthPage onLogin={onLogin} onNavigate={onNavigate} onBack={onBack} />;
      case 'terms':
        return <TermsOfService onBack={onBack} />;
      case 'privacy':
        return <PrivacyPolicy onBack={onBack} />;
      default:
        return <HomePage onNavigate={onNavigate} />;
    }
  };

  return <Suspense fallback={pageFallback}>{renderPage()}</Suspense>;
};
