import HomePage from './HomePage';
import AuthPage from '../../components/AuthPage';
import TermsOfService from '../../components/TermsOfService';
import PrivacyPolicy from '../../components/PrivacyPolicy';
import { PageType } from '../types';

interface PublicPagesProps {
  currentPage: PageType;
  onNavigate: (page: string) => void;
  onLogin: (name: string, email: string) => void;
}

/**
 * Renders public-facing pages (before authentication)
 */
export const PublicPages = ({ currentPage, onNavigate, onLogin }: PublicPagesProps) => {
  switch (currentPage) {
    case 'home':
      return <HomePage onNavigate={onNavigate} />;
    case 'auth':
      return <AuthPage onLogin={onLogin} onNavigate={onNavigate} />;
    case 'terms':
      return <TermsOfService onBack={() => onNavigate('auth')} />;
    case 'privacy':
      return <PrivacyPolicy onBack={() => onNavigate('auth')} />;
    default:
      return <HomePage onNavigate={onNavigate} />;
  }
};