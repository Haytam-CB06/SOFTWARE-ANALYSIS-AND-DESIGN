import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle, ArrowLeft, Eye, EyeOff, Calendar, HelpCircle, CreditCard } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner';
import logoImage from 'figma:asset/0550e77f773f70cb0e6201f9400b3cccad8c1d9b.png';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import SubscriptionPrompt, { SubscriptionPlan } from './SubscriptionPrompt';

interface AuthPageProps {
  onLogin: (name: string, email: string) => void;
  onNavigate: (page: string) => void;
  onBack?: () => void;
}

export default function AuthPage({ onLogin, onNavigate, onBack }: AuthPageProps) {
  const { t } = useTranslation();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupGender, setSignupGender] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupDateOfBirth, setSignupDateOfBirth] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [passwordError, setPasswordError] = useState('');
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showVerificationCode, setShowVerificationCode] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [socialLoginProvider, setSocialLoginProvider] = useState<string | null>(null);
  const [socialEmail, setSocialEmail] = useState('');
  const [socialName, setSocialName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [ageError, setAgeError] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [genderError, setGenderError] = useState('');
  const [showSignupVerification, setShowSignupVerification] = useState(false);
  const [signupVerificationCode, setSignupVerificationCode] = useState('');
  const [signupVerified, setSignupVerified] = useState(false);
  const [signupVerificationLoading, setSignupVerificationLoading] = useState(false);
  const [signupSubmitting, setSignupSubmitting] = useState(false);
  const [plansOpen, setPlansOpen] = useState(false);

  const usernameRequirements = {
    validLength: signupName.length >= 3 && signupName.length <= 20,
    validFormat: /^[a-zA-Z0-9_.]{3,20}$/.test(signupName),
    noSpaces: !/\s/.test(signupName),
    notReserved: !['admin', 'system', 'null', 'me', 'root', 'user', 'test', 'help'].includes(signupName.toLowerCase()),
  };

  const passwordRequirements = {
    minLength: signupPassword.length >= 8,
    hasUpperCase: /[A-Z]/.test(signupPassword),
    hasLowerCase: /[a-z]/.test(signupPassword),
    hasNumber: /[0-9]/.test(signupPassword),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(signupPassword),
  };

  const newPasswordRequirements = {
    minLength: newPassword.length >= 8,
    hasUpperCase: /[A-Z]/.test(newPassword),
    hasLowerCase: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
  };

  const checkPasswordMatch = (password: string, confirmPassword: string) => {
    if (confirmPassword && password !== confirmPassword) {
      setPasswordError(t('auth.errors.passwordMismatch'));
    } else {
      setPasswordError('');
    }
  };

  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  const validateAge = (dateOfBirth: string): boolean => {
    if (!dateOfBirth) {
      setAgeError(t('auth.errors.dateOfBirthRequired'));
      return false;
    }

    const age = calculateAge(dateOfBirth);

    if (age < 13) {
      setAgeError(t('auth.errors.ageRestriction'));
      return false;
    }

    setAgeError('');
    return true;
  };

  const acceptInviteIfPresent = async (): Promise<boolean> => {
    const params = new URLSearchParams(window.location.search);
    const inviteToken = params.get('invite_token');

    if (!inviteToken) return false;

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
      const userId = localStorage.getItem('currentUserId');

      if (!userId) return false;

      const res = await fetch(`${API_BASE_URL}/workspaces/accept-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
        },
        body: JSON.stringify({ token: inviteToken }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || t('auth.errors.acceptInviteFailed'));
      }

      const nextParams = new URLSearchParams(window.location.search);
      nextParams.delete('invite_token');
      window.history.replaceState({}, '', `?${nextParams.toString()}`);

      return true;
    } catch (err: any) {
      console.error('Invite acceptance failed:', err);
      toast.error( t('auth.errors.inviteInvalid'));
      return false;
    }
  };

  const createVerifiedAccount = async () => {
    try {
      setSignupSubmitting(true);

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
      const inviteToken = new URLSearchParams(window.location.search).get('invite_token');
      const normalizedSignupEmail = signupEmail.trim().toLowerCase();

      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: signupName,
          email: normalizedSignupEmail,
          password: signupPassword,
          full_name: signupName,
          date_of_birth: signupDateOfBirth,
          gender: signupGender,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          invite_token: inviteToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || t('auth.errors.signupFailed'));
      }

      localStorage.setItem('currentUserEmail', normalizedSignupEmail);
      if (data.user_id) localStorage.setItem('currentUserId', data.user_id);
      if (data.full_name) localStorage.setItem('currentUserName', data.full_name);
      if (data.user_id) {
        localStorage.setItem(`uplan_profile_questionnaire_pending_${data.user_id}`, 'true');
      }

      toast.success(t('auth.success.accountCreated', { name: signupName }));

      setSignupVerified(false);
      setSignupVerificationCode('');
      setShowSignupVerification(false);

      onLogin(data.full_name || signupName, normalizedSignupEmail);

      await acceptInviteIfPresent();
      onNavigate('workspace');
    } catch (err: any) {
      toast.error(err?.message || t('auth.errors.signupFailed'));
    } finally {
      setSignupSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: loginEmail,
          password: loginPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(t('auth.errors.loginFailed'));
        return;
      }

      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }

      localStorage.setItem('currentUserEmail', loginEmail);

      if (data.user_id) localStorage.setItem('currentUserId', data.user_id);
      if (data.full_name) localStorage.setItem('currentUserName', data.full_name);

      toast.success(t('auth.success.welcomeBack'));
      onLogin(data.full_name || '', loginEmail);
      await acceptInviteIfPresent();
      onNavigate('workspace');
    } catch (err: any) {
      console.error('Login error:', err);
      toast.error( t('auth.errors.loginUnexpected'));
    }
  };

  function PasswordRequirement({ ok, label }: { ok: boolean; label: string }) {
    return (
      <div className="flex items-center gap-2">
        {ok ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500" />
        )}
        <span className={`text-sm ${ok ? 'text-green-600 dark:text-green-400' : 'text-slate-600 dark:text-slate-400'}`}>
          {label}
        </span>
      </div>
    );
  }

  const handleVerifySignupCode = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
      const normalizedSignupEmail = signupEmail.trim().toLowerCase();

      const response = await fetch(`${API_BASE_URL}/auth/verify-signup-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedSignupEmail,
          code: signupVerificationCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error( t('auth.errors.invalidSignupCode'));
        return;
      }

      setSignupVerified(true);
      setShowSignupVerification(false);
      toast.success(t('auth.success.emailVerified'));

      await createVerifiedAccount();
    } catch (err: any) {
      console.error('Signup code verification error:', err);
      toast.error( t('auth.errors.verifySignupCodeFailed'));
    }
  };

  const handleRequestSignupCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!usernameRequirements.validLength) {
      setUsernameError(t('auth.errors.usernameLength'));
      toast.error(t('auth.errors.usernameLength'));
      return;
    }

    if (!usernameRequirements.validFormat) {
      setUsernameError(t('auth.errors.usernameFormat'));
      toast.error(t('auth.errors.usernameFormat'));
      return;
    }

    if (!usernameRequirements.noSpaces) {
      setUsernameError(t('auth.errors.usernameNoSpaces'));
      toast.error(t('auth.errors.usernameNoSpaces'));
      return;
    }

    if (!usernameRequirements.notReserved) {
      setUsernameError(t('auth.errors.usernameReserved'));
      toast.error(t('auth.errors.usernameReserved'));
      return;
    }

    if (!signupEmail) {
      toast.error(t('auth.errors.emailRequired'));
      return;
    }

    if (!validateAge(signupDateOfBirth)) {
      toast.error( t('auth.errors.ageRestriction'));
      return;
    }

    if (!signupGender) {
      setGenderError(t('auth.errors.genderRequired'));
      toast.error(t('auth.errors.genderRequired'));
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      toast.error(t('auth.errors.passwordMismatch'));
      return;
    }

    if (!passwordRequirements.minLength) {
      toast.error(t('auth.errors.passwordLength'));
      return;
    }

    if (!passwordRequirements.hasUpperCase) {
      toast.error(t('auth.errors.passwordUpper'));
      return;
    }

    if (!passwordRequirements.hasLowerCase) {
      toast.error(t('auth.errors.passwordLower'));
      return;
    }

    if (!passwordRequirements.hasNumber) {
      toast.error(t('auth.errors.passwordNumber'));
      return;
    }

    if (!passwordRequirements.hasSpecialChar) {
      toast.error(t('auth.errors.passwordSpecial'));
      return;
    }

    try {
      setSignupVerificationLoading(true);
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
      const normalizedSignupEmail = signupEmail.trim().toLowerCase();

      const response = await fetch(`${API_BASE_URL}/auth/request-signup-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedSignupEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(t('auth.errors.sendSignupCodeFailed'));
        return;
      }

      toast.success(t('auth.success.signupCodeSent', { email: signupEmail }));
      setSignupVerified(false);
      setSignupVerificationCode('');
      setShowSignupVerification(true);
    } catch (err: any) {
      console.error('Signup verification request error:', err);
      toast.error( t('auth.errors.sendSignupCodeFailed'));
    } finally {
      setSignupVerificationLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleRequestSignupCode(e);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

      const response = await fetch(`${API_BASE_URL}/request_reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error( t('auth.errors.emailNotFound'));
        return;
      }

      toast.success(t('auth.success.resetCodeSent', { email: resetEmail }));
      setShowForgotPassword(false);
      setShowVerificationCode(true);
    } catch (err: any) {
      console.error('Reset password error:', err);
      toast.error(t('auth.errors.requestResetFailed'));
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

      const response = await fetch(`${API_BASE_URL}/verify_code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail,
          code: verificationCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(t('auth.errors.invalidResetCode'), {
          duration: 4000,
          position: 'top-center',
        });
        setVerificationCode('');
        return;
      }

      toast.success(t('auth.success.verificationSuccess'), {
        duration: 3000,
        position: 'top-center',
      });

      setShowVerificationCode(false);
      setShowResetPassword(true);
    } catch (err: any) {
      console.error('Verify code error:', err);
      toast.error(t('auth.errors.verifyCodeFailed'));
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmNewPassword) {
      toast.error(t('auth.errors.passwordMismatch'));
      return;
    }
    if (newPassword.length < 8) {
      toast.error(t('auth.errors.passwordLength'));
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      toast.error(t('auth.errors.passwordUpper'));
      return;
    }
    if (!/[a-z]/.test(newPassword)) {
      toast.error(t('auth.errors.passwordLower'));
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      toast.error(t('auth.errors.passwordNumber'));
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      toast.error(t('auth.errors.passwordSpecial'));
      return;
    }

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

      const response = await fetch(`${API_BASE_URL}/reset_password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail,
          code: verificationCode,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(t('auth.errors.resetPasswordFailed'));
        return;
      }

      toast.success(t('auth.success.passwordReset'));

      setShowResetPassword(false);
      setResetEmail('');
      setVerificationCode('');
      setGeneratedCode('');
      setNewPassword('');
      setConfirmNewPassword('');

      onLogin('', resetEmail);
    } catch (err: any) {
      console.error('Reset password error:', err);
      toast.error(t('auth.errors.resetPasswordUnexpected'));
    }
  };

  const handleSocialLogin = (provider: string) => {
    if (provider !== 'google') return;

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    window.location.href = `${API_BASE_URL}/login`;
  };

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    if (plan === 'free') {
      setPlansOpen(false);
      setActiveTab('signup');
      return;
    }

    const targetUrl =
      plan === 'pro'
        ? import.meta.env.VITE_STRIPE_CHECKOUT_URL
        : import.meta.env.VITE_UNIVERSITY_PLAN_CONTACT_URL || import.meta.env.VITE_STRIPE_CHECKOUT_URL;

    if (targetUrl) {
      window.location.href = targetUrl;
      return;
    }

    setPlansOpen(false);
    toast.error('Payment/contact link is not configured yet. Add it in frontend/UPLAN/.env.');
  };

  const handleSocialLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!socialEmail || !socialName) {
      toast.error(t('auth.errors.fillRequired'));
      return;
    }

    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const existingUser = users.find((u: any) => u.email === socialEmail);

    if (existingUser) {
      localStorage.setItem('currentUserEmail', existingUser.email);
      toast.success(t('auth.success.welcomeBackName', { name: existingUser.name }));
      onLogin(existingUser.name, existingUser.email);
    } else {
      const newUser = {
        name: socialName,
        email: socialEmail,
        provider: socialLoginProvider,
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      localStorage.setItem('registeredUsers', JSON.stringify(users));
      localStorage.setItem('currentUserEmail', socialEmail);

      toast.success(t('auth.success.accountCreated', { name: socialName }));
      onLogin(socialName, socialEmail);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_28%),linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.10),_transparent_26%),linear-gradient(180deg,#050816_0%,#0b1120_100%)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-orb-slow absolute -left-20 top-20 h-72 w-72 rounded-full bg-blue-300/25 blur-3xl dark:bg-blue-500/10" />
        <div className="animate-orb-medium absolute right-0 top-24 h-80 w-80 rounded-full bg-indigo-300/20 blur-3xl dark:bg-indigo-500/10" />
        <div className="animate-orb-fast absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-sky-200/25 blur-3xl dark:bg-sky-500/10" />
      </div>

      <div className={`relative min-h-screen lg:grid lg:grid-cols-[1.05fr_0.95fr] transition-all duration-300 ${showSignupVerification ? 'pointer-events-none select-none' : ''}`}>
        <div className="relative hidden overflow-hidden lg:flex">
          <div className="absolute inset-0 bg-blue-700 from-blue-700 via-blue-600 to-indigo-700" />
          <div className="absolute inset-0 opacity-10">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&q=80"
              alt={t('auth.hero.imageAlt')}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_25%,rgba(255,255,255,0.10)_50%,transparent_75%)] animate-hero-sheen" />

          <div className="relative z-10 flex h-full w-full flex-col justify-between p-10 xl:p-14">
            <div className="animate-fade-up flex items-center gap-4">
  <div className="group relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 shadow-lg backdrop-blur-md ring-1 ring-white/15 transition-all duration-500 hover:scale-105">
    <div className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-100" />
    <img
      src={logoImage}
      alt={t('auth.brand.logoAlt')}
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      className="relative z-10 h-10 w-10 select-none rounded-xl object-cover animate-logo-float"
    />
  </div>
              <div>
                <div className="text-2xl font-bold tracking-tight text-white">{t('auth.brand.name')}</div>
                <div className="text-sm font-medium text-blue-100/85">
                  {t('auth.brand.subtitle')}
                </div>
              </div>
            </div>

            <div className="max-w-xl space-y-7">
              <div className="animate-fade-up-delay inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white/95 backdrop-blur-md">
                {t('auth.hero.badge')}
              </div>

              <div className="space-y-4">
                <h1 className="animate-slide-up animate-text-breathe text-5xl font-bold leading-[1.02] tracking-[-0.04em] text-white xl:text-6xl">
                  {t('auth.hero.titleLine1')}
                  <span className="block text-blue-100">{t('auth.hero.titleLine2')}</span>
                </h1>

                <p className="animate-fade-up-delay-2 max-w-lg text-lg leading-8 text-blue-50/90">
                  {t('auth.hero.description')}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="animate-card-rise rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                  <div className="text-sm font-medium text-blue-100">{t('auth.hero.cards.smartPlanning.title')}</div>
                  <div className="mt-1 text-xs text-white/75">
                    {t('auth.hero.cards.smartPlanning.description')}
                  </div>
                </div>
                <div className="animate-card-rise rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md [animation-delay:120ms]">
                  <div className="text-sm font-medium text-blue-100">{t('auth.hero.cards.flexibleFlow.title')}</div>
                  <div className="mt-1 text-xs text-white/75">
                    {t('auth.hero.cards.flexibleFlow.description')}
                  </div>
                </div>
                <div className="animate-card-rise rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md [animation-delay:240ms]">
                  <div className="text-sm font-medium text-blue-100">{t('auth.hero.cards.studentFirst.title')}</div>
                  <div className="mt-1 text-xs text-white/75">
                    {t('auth.hero.cards.studentFirst.description')}
                  </div>
                </div>
              </div>
            </div>

            <div className="animate-fade-up-delay-3 text-sm text-blue-100/75">
              {t('auth.hero.footer')}
            </div>
          </div>
        </div>

        <div className="relative flex min-h-screen items-center justify-center px-4 py-6 sm:px-6 lg:px-10">
          <div className={`relative w-full max-w-lg transition-all duration-300 ${showSignupVerification ? 'scale-[0.98] blur-[2px]' : 'scale-100 blur-0'}`}>
            <div className="animate-fade-up mb-5 flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => {
                  if (onBack) onBack();
                  else onNavigate('home');
                }}
                className="rounded-2xl text-slate-600 transition-all duration-300 hover:-translate-x-0.5 hover:bg-white/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('auth.actions.backToHome')}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => setPlansOpen(true)}
                className="rounded-2xl border-blue-200 bg-white/80 text-blue-700 shadow-sm hover:bg-blue-50 dark:border-blue-900/60 dark:bg-slate-900/80 dark:text-blue-300 dark:hover:bg-slate-800"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                See plans
              </Button>

              <div className="lg:hidden flex items-center gap-3 rounded-2xl bg-white/70 px-3 py-2 shadow-sm ring-1 ring-slate-200/70 backdrop-blur dark:bg-slate-900/70 dark:ring-slate-800">
                <img
                  src={logoImage}
                  alt={t('auth.brand.logoAlt')}
                  className="h-9 w-9 rounded-lg"
                />
                <div className="leading-tight">
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{t('auth.brand.name')}</div>
                  <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {t('auth.brand.subtitle')}
                  </div>
                </div>
              </div>
            </div>

            <div className="animate-auth-card overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/80 shadow-[0_20px_70px_rgba(15,23,42,0.10)] backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/80">
              <div className="border-b border-slate-200/80 bg-blue-700 from-blue-600 to-blue-700 px-6 py-5 text-white dark:border-slate-800">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold tracking-tight">
                    {socialLoginProvider
                      ? t('auth.titles.continueWithProvider', { provider: socialLoginProvider })
                      : showVerificationCode
                      ? t('auth.titles.verifyAccount')
                      : showResetPassword
                      ? t('auth.titles.createNewPassword')
                      : showForgotPassword
                      ? t('auth.titles.resetPassword')
                      : activeTab === 'signup'
                      ? t('auth.titles.createAccount')
                      : t('auth.titles.welcomeBack')}
                  </h2>
                  <p className="text-sm text-blue-100/90">
                    {socialLoginProvider
                      ? t('auth.descriptions.completeSignIn')
                      : showVerificationCode
                      ? t('auth.descriptions.enterCodeSent')
                      : showResetPassword
                      ? t('auth.descriptions.chooseStrongPassword')
                      : showForgotPassword
                      ? t('auth.descriptions.sendVerificationToEmail')
                      : activeTab === 'signup'
                      ? t('auth.descriptions.joinAndOrganize')
                      : t('auth.descriptions.accessPlanner')}
                  </p>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                {socialLoginProvider ? (
                  <Card className="border-0 bg-transparent shadow-none animate-panel-in">
                    <CardHeader className="px-0 pt-0">
                      <CardTitle>{t('auth.titles.completeProviderLogin', { provider: socialLoginProvider })}</CardTitle>
                      <CardDescription>
                        {t('auth.descriptions.completeProviderLogin')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-0">
                      <form onSubmit={handleSocialLoginSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="social-email">{t('auth.labels.email')}</Label>
                          <Input
                            id="social-email"
                            type="email"
                            placeholder={t('auth.placeholders.socialEmail')}
                            value={socialEmail}
                            onChange={(e) => setSocialEmail(e.target.value)}
                            required
                            className="h-12 rounded-2xl transition-all duration-300 focus:scale-[1.01]"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="social-name">{t('auth.labels.fullName')}</Label>
                          <Input
                            id="social-name"
                            type="text"
                            placeholder={t('auth.placeholders.fullName')}
                            value={socialName}
                            onChange={(e) => setSocialName(e.target.value)}
                            required
                            className="h-12 rounded-2xl transition-all duration-300 focus:scale-[1.01]"
                          />
                        </div>

                        <Button
                          type="submit"
                          className="h-12 w-full rounded-2xl bg-blue-700 text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700"
                        >
                          {t('auth.actions.completeLogin')}
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          className="h-11 w-full rounded-2xl"
                          onClick={() => {
                            setSocialLoginProvider(null);
                            setSocialEmail('');
                            setSocialName('');
                          }}
                        >
                          {t('auth.actions.backToLogin')}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                ) : showVerificationCode ? (
                  <Card className="border-0 bg-transparent shadow-none animate-panel-in">
                    <CardHeader className="px-0 pt-0">
                      <div className="mb-2 flex items-center gap-2">
                        <button
                          onClick={() => {
                            setShowVerificationCode(false);
                            setShowForgotPassword(true);
                            setVerificationCode('');
                          }}
                          className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                        >
                          <ArrowLeft className="h-5 w-5" />
                        </button>
                        <CardTitle>{t('auth.titles.enterVerificationCode')}</CardTitle>
                      </div>
                      <CardDescription>
                        {t('auth.descriptions.resetCodeSentTo', { email: resetEmail })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-0">
                      <form onSubmit={handleVerifyCode} className="space-y-6">
                        <div className="space-y-3">
                          <Label htmlFor="verification-code" className="block text-center">
                            {t('auth.labels.verificationCode')}
                          </Label>
                          <Input
                            id="verification-code"
                            type="text"
                            placeholder={t('auth.placeholders.verificationCode')}
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            maxLength={6}
                            required
                            className="h-16 rounded-2xl text-center text-3xl font-bold tracking-[0.45em] transition-all duration-300 focus:scale-[1.01]"
                          />
                        </div>

                        <Button
                          type="submit"
                          className="h-12 w-full rounded-2xl bg-blue-700 text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700"
                          disabled={verificationCode.length !== 6}
                        >
                          {t('auth.actions.verifyCode')}
                        </Button>

                        <div className="space-y-2 text-center">
                          <p className="text-sm text-muted-foreground">{t('auth.helper.didntReceiveCode')}</p>
                          <button
                            type="button"
                            className="text-sm font-medium text-blue-700 hover:underline"
                            onClick={async (e) => {
                              e.preventDefault();
                              try {
                                const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
                                const response = await fetch(`${API_BASE_URL}/request_reset`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ email: resetEmail }),
                                });
                                const data = await response.json();
                                if (!response.ok) {
                                  toast.error(t('auth.errors.resendCodeFailed'));
                                  return;
                                }
                                toast.success(t('auth.success.newVerificationCodeSent'));
                                setVerificationCode('');
                              } catch (err: any) {
                                console.error('Resend code error:', err);
                                toast.error( t('auth.errors.somethingWentWrong'));
                              }
                            }}
                          >
                            {t('auth.actions.resendCode')}
                          </button>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          className="h-11 w-full rounded-2xl"
                          onClick={() => {
                            setShowVerificationCode(false);
                            setShowForgotPassword(false);
                            setResetEmail('');
                            setVerificationCode('');
                            setGeneratedCode('');
                          }}
                        >
                          {t('auth.actions.backToLogin')}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                ) : showResetPassword ? (
                  <Card className="border-0 bg-transparent shadow-none animate-panel-in">
                    <CardHeader className="px-0 pt-0">
                      <CardTitle>{t('auth.titles.createNewPassword')}</CardTitle>
                      <CardDescription>
                        {t('auth.descriptions.enterNewPasswordFor', { email: resetEmail })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-0">
                      <form onSubmit={handleResetPassword} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="new-password">{t('auth.labels.newPassword')}</Label>
                          <div className="relative">
                            <Input
                              id="new-password"
                              type={showNewPassword ? 'text' : 'password'}
                              placeholder={t('auth.placeholders.newPassword')}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              required
                              minLength={8}
                              className="h-12 rounded-2xl pr-10 transition-all duration-300 focus:scale-[1.01]"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            >
                              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>

                          {newPassword && (
                            <div className="mt-3 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                              <p className="mb-2 text-xs text-slate-600 dark:text-slate-400">{t('auth.helper.passwordMustContain')}</p>
                              <PasswordRequirement ok={newPasswordRequirements.minLength} label={t('auth.requirements.password.minLength')} />
                              <PasswordRequirement ok={newPasswordRequirements.hasUpperCase} label={t('auth.requirements.password.upper')} />
                              <PasswordRequirement ok={newPasswordRequirements.hasLowerCase} label={t('auth.requirements.password.lower')} />
                              <PasswordRequirement ok={newPasswordRequirements.hasNumber} label={t('auth.requirements.password.number')} />
                              <PasswordRequirement ok={newPasswordRequirements.hasSpecialChar} label={t('auth.requirements.password.special')} />
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confirm-new-password">{t('auth.labels.confirmNewPassword')}</Label>
                          <div className="relative">
                            <Input
                              id="confirm-new-password"
                              type={showConfirmNewPassword ? 'text' : 'password'}
                              placeholder={t('auth.placeholders.confirmNewPassword')}
                              value={confirmNewPassword}
                              onChange={(e) => setConfirmNewPassword(e.target.value)}
                              required
                              minLength={8}
                              className="h-12 rounded-2xl pr-10 transition-all duration-300 focus:scale-[1.01]"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            >
                              {showConfirmNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          {newPassword && confirmNewPassword && newPassword !== confirmNewPassword && (
                            <div className="flex items-center gap-1 text-red-500">
                              <XCircle className="h-3 w-3" />
                              <p className="text-xs">{t('auth.errors.passwordMismatch')}</p>
                            </div>
                          )}
                          {newPassword && confirmNewPassword && newPassword === confirmNewPassword && (
                            <div className="flex items-center gap-1 text-green-500">
                              <CheckCircle2 className="h-3 w-3" />
                              <p className="text-xs">{t('auth.success.passwordsMatch')}</p>
                            </div>
                          )}
                        </div>

                        <Button
                          type="submit"
                          className="h-12 w-full rounded-2xl bg-blue-700 text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700"
                          disabled={!newPassword || !confirmNewPassword || newPassword !== confirmNewPassword}
                        >
                          {t('auth.actions.resetPassword')}
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          className="h-11 w-full rounded-2xl"
                          onClick={() => {
                            setShowResetPassword(false);
                            setShowForgotPassword(false);
                            setResetEmail('');
                            setVerificationCode('');
                            setGeneratedCode('');
                            setNewPassword('');
                            setConfirmNewPassword('');
                          }}
                        >
                          {t('auth.actions.backToLogin')}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                ) : showForgotPassword ? (
                  <Card className=" border-0 bg-transparent shadow-none animate-panel-in">
                    <CardHeader className="px-1 pt-1">
                      <CardTitle>{t('auth.titles.resetPassword')}</CardTitle>
                      <CardDescription>
                        {t('auth.descriptions.resetPasswordHelp')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-0">
                      <form onSubmit={handleForgotPassword} className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="reset-email">{t('auth.labels.email')}</Label>
                          <Input
                            id="reset-email"
                            type="email"
                            placeholder={t('auth.placeholders.email')}
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            required
                            className="h-12 rounded-xl transition-all duration-300 focus:scale-[1.01]"
                          />
                        </div>

                        <Button
                          type="submit"
                          className="h-12 w-full rounded-2xl bg-blue-700 text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700"
                        >
                          {t('auth.actions.sendVerificationCode')}
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          className="h-11 w-full rounded-2xl"
                          onClick={() => {
                            setShowForgotPassword(false);
                            setResetEmail('');
                          }}
                        >
                          {t('auth.actions.backToLogin')}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                ) : (
                  <Tabs defaultValue={activeTab} className="w-full" onValueChange={setActiveTab}>
                    <TabsList className="mb-6 grid h-12 w-full grid-cols-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
                      <TabsTrigger
                        value="login"
                        className="rounded-xl transition-all duration-300 data-[state=active]:scale-[1.01] data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700"
                      >
                        {t('auth.actions.loginTab')}
                      </TabsTrigger>
                      <TabsTrigger
                        value="signup"
                        className="rounded-xl transition-all duration-300 data-[state=active]:scale-[1.01] data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700"
                      >
                        {t('auth.actions.signupTab')}
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="login" className="animate-tab-in">
                      
                        <CardHeader className="px-0 pt-0">
                          <CardTitle>{t('auth.titles.welcomeBackCard')}</CardTitle>
                          <CardDescription>
                            {t('auth.descriptions.loginCard')}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="px-0">
                          <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="login-email">{t('auth.labels.emailOrUsername')}</Label>
                              <Input
                                id="login-email"
                                type="text"
                                placeholder={t('auth.placeholders.emailOrUsername')}
                                value={loginEmail}
                                onChange={(e) => setLoginEmail(e.target.value)}
                                required
                                className="h-12 rounded-2xl transition-all duration-300 focus:scale-[1.01]"
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label htmlFor="login-password">{t('auth.labels.password')}</Label>
                                <button
                                  type="button"
                                  className="text-sm text-blue-700 hover:underline"
                                  onClick={() => setShowForgotPassword(true)}
                                >
                                  {t('auth.actions.forgotPassword')}
                                </button>
                              </div>
                              <div className="relative">
                                <Input
                                  id="login-password"
                                  type={showPassword ? 'text' : 'password'}
                                  placeholder={t('auth.placeholders.password')}
                                  value={loginPassword}
                                  onChange={(e) => setLoginPassword(e.target.value)}
                                  required
                                  className="h-12 rounded-2xl pr-10 transition-all duration-300 focus:scale-[1.01]"
                                />
                                <button
                                  type="button"
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                  ) : (
                                    <Eye className="h-5 w-5" />
                                  )}
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="remember"
                                checked={rememberMe}
                                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                              />
                              <label
                                htmlFor="remember"
                                className="select-none text-sm cursor-pointer"
                              >
                                {t('auth.actions.rememberMe')}
                              </label>
                            </div>

                            <Button
                              type="submit"
                              className="h-12 w-full rounded-2xl bg-blue-700 text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700"
                            >
                              {t('auth.actions.signIn')}
                            </Button>

                            <div className="relative my-4">
                              <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-slate-200 dark:border-slate-700" />
                              </div>
                              <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-3 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                                  {t('auth.actions.orContinueWith')}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleSocialLogin('google')}
                                className="h-12 w-full rounded-2xl transition-all duration-300 hover:-translate-y-0.5"
                              >
                                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                {t('auth.actions.continueWithGoogle')}
                              </Button>
                            </div>
                          </form>
                        </CardContent>
                      
                    </TabsContent>

                    <TabsContent value="signup" className="animate-tab-in">
                      
                        <CardHeader className="px-0 pt-0">
                          <CardTitle>{t('auth.titles.createAccountCard')}</CardTitle>
                          <CardDescription>
                            {t('auth.descriptions.signupCard')}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="px-0">
                          <form onSubmit={handleSignup} className="space-y-4">
                            {signupVerified && (
                              <div className="flex items-center gap-1 text-green-500">
                                <CheckCircle2 className="h-3 w-3" />
                                <p className="text-xs">{t('auth.success.emailVerifiedInline')}</p>
                              </div>
                            )}

                            <div className="space-y-2">
                              <Label htmlFor="signup-name">{t('auth.labels.username')}</Label>
                              <Input
                                id="signup-name"
                                type="text"
                                placeholder={t('auth.placeholders.username')}
                                value={signupName}
                                onChange={(e) => {
                                  setSignupName(e.target.value);
                                  setUsernameError('');
                                }}
                                required
                                className="h-12 rounded-2xl transition-all duration-300 focus:scale-[1.01]"
                              />
                              {signupName && (
                                <div className="mt-3 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                                  <p className="mb-2 text-xs text-slate-600 dark:text-slate-400">{t('auth.helper.usernameRequirements')}</p>
                                  <PasswordRequirement ok={usernameRequirements.validLength} label={t('auth.requirements.username.length')} />
                                  <PasswordRequirement ok={usernameRequirements.validFormat} label={t('auth.requirements.username.format')} />
                                  <PasswordRequirement ok={usernameRequirements.noSpaces} label={t('auth.requirements.username.noSpaces')} />
                                  <PasswordRequirement ok={usernameRequirements.notReserved} label={t('auth.requirements.username.notReserved')} />
                                </div>
                              )}
                              {usernameError && <p className="mt-1 text-sm text-red-500">{usernameError}</p>}
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="signup-email">{t('auth.labels.email')}</Label>
                              <Input
                                id="signup-email"
                                type="email"
                                placeholder={t('auth.placeholders.email')}
                                value={signupEmail}
                                onChange={(e) => setSignupEmail(e.target.value)}
                                required
                                className="h-12 rounded-2xl transition-all duration-300 focus:scale-[1.01]"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="signup-password">{t('auth.labels.password')}</Label>
                              <div className="relative">
                                <Input
                                  id="signup-password"
                                  type={showSignupPassword ? 'text' : 'password'}
                                  placeholder={t('auth.placeholders.createPassword')}
                                  value={signupPassword}
                                  onChange={(e) => {
                                    setSignupPassword(e.target.value);
                                    checkPasswordMatch(e.target.value, signupConfirmPassword);
                                    setShowPasswordRequirements(true);
                                  }}
                                  required
                                  className="h-12 rounded-2xl pr-10 transition-all duration-300 focus:scale-[1.01]"
                                />
                                <button
                                  type="button"
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                  onClick={() => setShowSignupPassword(!showSignupPassword)}
                                >
                                  {showSignupPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                  ) : (
                                    <Eye className="h-5 w-5" />
                                  )}
                                </button>
                              </div>

                              {showPasswordRequirements && (
                                <div className="mt-3 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                                  <p className="mb-2 text-xs text-slate-600 dark:text-slate-400">{t('auth.helper.passwordMustContain')}</p>
                                  <PasswordRequirement ok={passwordRequirements.minLength} label={t('auth.requirements.password.minLength')} />
                                  <PasswordRequirement ok={passwordRequirements.hasUpperCase} label={t('auth.requirements.password.upper')} />
                                  <PasswordRequirement ok={passwordRequirements.hasLowerCase} label={t('auth.requirements.password.lower')} />
                                  <PasswordRequirement ok={passwordRequirements.hasNumber} label={t('auth.requirements.password.number')} />
                                  <PasswordRequirement ok={passwordRequirements.hasSpecialChar} label={t('auth.requirements.password.special')} />
                                </div>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="signup-confirm-password">{t('auth.labels.confirmPassword')}</Label>
                              <div className="relative">
                                <Input
                                  id="signup-confirm-password"
                                  type={showConfirmPassword ? 'text' : 'password'}
                                  placeholder={t('auth.placeholders.confirmPassword')}
                                  value={signupConfirmPassword}
                                  onChange={(e) => {
                                    setSignupConfirmPassword(e.target.value);
                                    checkPasswordMatch(signupPassword, e.target.value);
                                  }}
                                  required
                                  className="h-12 rounded-2xl pr-10 transition-all duration-300 focus:scale-[1.01]"
                                />
                                <button
                                  type="button"
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                  {showConfirmPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                  ) : (
                                    <Eye className="h-5 w-5" />
                                  )}
                                </button>
                              </div>
                              {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="signup-date-of-birth">{t('auth.labels.dateOfBirth')}</Label>
                              <div className="relative">
                                <Input
                                  id="signup-date-of-birth"
                                  type="date"
                                  value={signupDateOfBirth}
                                  onChange={(e) => {
                                    setSignupDateOfBirth(e.target.value);
                                    if (e.target.value) {
                                      validateAge(e.target.value);
                                    } else {
                                      setAgeError('');
                                    }
                                  }}
                                  required
                                  className="h-12 rounded-2xl pr-10 transition-all duration-300 focus:scale-[1.01]"
                                  placeholder="mm / dd / yyyy"
                                />
                                <Calendar className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 pointer-events-none text-slate-400" />
                              </div>
                              {ageError && (
                                <div className="flex items-center gap-1 text-red-500">
                                  <XCircle className="h-3 w-3" />
                                  <p className="text-xs">{ageError}</p>
                                </div>
                              )}
                              {signupDateOfBirth && !ageError && (
                                <div className="flex items-center gap-1 text-green-500">
                                  <CheckCircle2 className="h-3 w-3" />
                                  <p className="text-xs">{t('auth.success.ageVerified')}</p>
                                </div>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="signup-gender">{t('auth.labels.gender')}</Label>
                              <Select
                                value={signupGender}
                                onValueChange={(value) => {
                                  setSignupGender(value);
                                  setGenderError('');
                                }}
                              >
                                <SelectTrigger id="signup-gender" className={`h-12 rounded-2xl ${genderError ? 'border-red-500' : ''}`}>
                                  <SelectValue placeholder={t('auth.placeholders.selectGender')} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="male">{t('auth.genderOptions.male')}</SelectItem>
                                  <SelectItem value="female">{t('auth.genderOptions.female')}</SelectItem>
                                  <SelectItem value="other">{t('auth.genderOptions.other')}</SelectItem>
                                  <SelectItem value="prefer-not-to-say">{t('auth.genderOptions.preferNotToSay')}</SelectItem>
                                </SelectContent>
                              </Select>
                              {genderError && (
                                <div className="flex items-center gap-1 text-red-500">
                                  <XCircle className="h-3 w-3" />
                                  <p className="text-xs">{genderError}</p>
                                </div>
                              )}
                              {signupGender && !genderError && (
                                <div className="flex items-center gap-1 text-green-500">
                                  <CheckCircle2 className="h-3 w-3" />
                                  <p className="text-xs">{t('auth.success.genderSelected')}</p>
                                </div>
                              )}
                            </div>

                            <div className="flex items-start space-x-2">
                              <Checkbox id="terms" required />
                              <label
                                htmlFor="terms"
                                className="cursor-pointer select-none text-sm leading-6"
                              >
                                {t('auth.helper.agreeTermsBefore')}
                                {' '}
                                <button
                                  type="button"
                                  className="text-blue-700 hover:underline"
                                  onClick={() => onNavigate('terms')}
                                >
                                  {t('auth.helper.termsOfService')}
                                </button>
                                {' '}
                                {t('auth.helper.and')}
                                {' '}
                                <button
                                  type="button"
                                  className="text-blue-700 hover:underline"
                                  onClick={() => onNavigate('privacy')}
                                >
                                  {t('auth.helper.privacyPolicy')}
                                </button>
                              </label>
                            </div>

                            <Button
                              type="submit"
                              className="h-12 w-full rounded-2xl bg-blue-700 text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700"
                              disabled={signupVerificationLoading || signupSubmitting}
                            >
                              {signupVerificationLoading
                                ? t('auth.actions.sendingCode')
                                : t('auth.actions.signUp')}
                            </Button>

                            <div className="relative my-4">
                              <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-slate-200 dark:border-slate-700" />
                              </div>
                              <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-3 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                                  {t('auth.actions.orContinueWith')}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleSocialLogin('google')}
                                className="h-12 w-full rounded-2xl transition-all duration-300 hover:-translate-y-0.5"
                              >
                                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                {t('auth.actions.continueWithGoogle')}
                              </Button>
                            </div>

                            <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
                              {t('auth.helper.byContinuing')}
                              {' '}
                              <a
                                href="#terms"
                                className="text-blue-700 hover:underline"
                                onClick={(e) => {
                                  e.preventDefault();
                                  onNavigate('terms');
                                }}
                              >
                                {t('auth.helper.termsOfService')}
                              </a>
                              {' '}
                              {t('auth.helper.and')}
                              {' '}
                              <a
                                href="#privacy"
                                className="text-blue-700 hover:underline"
                                onClick={(e) => {
                                  e.preventDefault();
                                  onNavigate('privacy');
                                }}
                              >
                                {t('auth.helper.privacyPolicy')}
                              </a>
                            </p>
                          </form>
                        </CardContent>
                      
                    </TabsContent>
                  </Tabs>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowHelp(!showHelp)}
            className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-700 text-white shadow-[0_10px_30px_rgba(37,99,235,0.35)] transition-all duration-300 hover:scale-105 hover:bg-blue-700"
            title={t('auth.actions.needHelp')}
          >
            <HelpCircle className="h-6 w-6" />
          </button>

          {showHelp && (
            <div className="animate-help-pop fixed bottom-24 right-6 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t('auth.help.title')}</h3>
                <button
                  onClick={() => setShowHelp(false)}
                  className="rounded-xl p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/60">
                  <p className="mb-2 font-medium text-slate-900 dark:text-slate-100">{t('auth.help.creatingAccountTitle')}</p>
                  <ul className="list-inside list-disc space-y-1 text-xs leading-5">
                    <li>{t('auth.help.points.username')}</li>
                    <li>{t('auth.help.points.email')}</li>
                    <li>{t('auth.help.points.password')}</li>
                    <li>{t('auth.help.points.age')}</li>
                  </ul>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/60">
                  <p className="mb-2 font-medium text-slate-900 dark:text-slate-100">{t('auth.help.issuesTitle')}</p>
                  <p className="text-xs leading-5">
                    {t('auth.help.issuesDescription')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showSignupVerification && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-md"
            onClick={() => {
              setShowSignupVerification(false);
              setSignupVerificationCode('');
            }}
          />

          <div className="animate-modal-pop relative z-[101] w-full max-w-md rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_25px_80px_rgba(15,23,42,0.25)] backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/90">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {t('auth.titles.verifyYourEmail')}
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {t('auth.descriptions.signupCodeSentTo', { email: signupEmail })}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowSignupVerification(false);
                  setSignupVerificationCode('');
                }}
                className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleVerifySignupCode} className="space-y-5">
              <div className="space-y-3">
                <Label htmlFor="signup-verification-code" className="block text-center">
                  {t('auth.labels.verificationCode')}
                </Label>

                <Input
                  id="signup-verification-code"
                  type="text"
                  placeholder={t('auth.placeholders.verificationCode')}
                  value={signupVerificationCode}
                  onChange={(e) =>
                    setSignupVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  maxLength={6}
                  required
                  className="h-16 rounded-2xl text-center text-3xl font-bold tracking-[0.45em] transition-all duration-300 focus:scale-[1.01]"
                />
              </div>

              <Button
                type="submit"
                className="h-12 w-full rounded-2xl bg-blue-700 text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700"
                disabled={signupVerificationCode.length !== 6 || signupSubmitting}
              >
                {signupSubmitting ? t('auth.actions.creatingAccount') : t('auth.actions.verifyEmail')}
              </Button>

              <div className="space-y-2 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t('auth.helper.didntReceiveCode')}
                </p>

                <button
                  type="button"
                  className="text-sm font-medium text-blue-700 hover:underline"
                  onClick={async (e) => {
                    e.preventDefault();
                    try {
                      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
                      const normalizedSignupEmail = signupEmail.trim().toLowerCase();
                      const response = await fetch(`${API_BASE_URL}/auth/request-signup-code`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: normalizedSignupEmail }),
                      });

                      const data = await response.json();

                      if (!response.ok) {
                        toast.error( t('auth.errors.resendSignupCodeFailed'));
                        return;
                      }

                      toast.success(t('auth.success.newSignupVerificationCodeSent'));
                      setSignupVerificationCode('');
                    } catch (err: any) {
                      console.error('Resend signup code error:', err);
                      toast.error( t('auth.errors.somethingWentWrong'));
                    }
                  }}
                >
                  {t('auth.actions.resendCode')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes orbSlow {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(22px, -18px, 0) scale(1.05); }
        }

        @keyframes orbMedium {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(-20px, 16px, 0) scale(0.96); }
        }

        @keyframes orbFast {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(12px, -10px, 0); }
        }
        @keyframes logoFloat {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }

        @keyframes textBreathe {
          0%, 100% {
            transform: translateY(0);
            letter-spacing: -0.04em;
          }
          50% {
            transform: translateY(-1px);
            letter-spacing: -0.038em;
          }
        }

        .animate-logo-float {
          animation: logoFloat 3.4s ease-in-out infinite;
        }

        .animate-text-breathe {
          animation: textBreathe 5s ease-in-out infinite;
        }
        @keyframes heroSheen {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(120%); }
        }

        @keyframes fadeUp {
          0% {
            opacity: 0;
            transform: translateY(16px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          0% {
            opacity: 0;
            transform: translateY(22px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes authCard {
          0% {
            opacity: 0;
            transform: translateY(24px) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes panelIn {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes helpPop {
          0% {
            opacity: 0;
            transform: translateY(10px) scale(0.96);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes modalPop {
          0% {
            opacity: 0;
            transform: translateY(16px) scale(0.96);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-orb-slow { animation: orbSlow 10s ease-in-out infinite; }
        .animate-orb-medium { animation: orbMedium 12s ease-in-out infinite; }
        .animate-orb-fast { animation: orbFast 8s ease-in-out infinite; }
        .animate-hero-sheen { animation: heroSheen 8s linear infinite; }
        .animate-fade-up { animation: fadeUp 700ms ease both; }
        .animate-fade-up-delay { animation: fadeUp 900ms ease both; }
        .animate-fade-up-delay-2 { animation: fadeUp 1100ms ease both; }
        .animate-fade-up-delay-3 { animation: fadeUp 1300ms ease both; }
        .animate-slide-up { animation: slideUp 850ms ease both; }
        .animate-card-rise { animation: fadeUp 750ms ease both; }
        .animate-auth-card { animation: authCard 700ms ease both; }
        .animate-panel-in { animation: panelIn 320ms ease both; }
        .animate-tab-in { animation: panelIn 280ms ease both; }
        .animate-help-pop { animation: helpPop 220ms ease both; }
        .animate-modal-pop { animation: modalPop 220ms ease both; }

        @media (prefers-reduced-motion: reduce) {
          .animate-orb-slow,
          .animate-orb-medium,
          .animate-orb-fast,
          .animate-hero-sheen,
          .animate-fade-up,
          .animate-fade-up-delay,
          .animate-fade-up-delay-2,
          .animate-fade-up-delay-3,
          .animate-slide-up,
          .animate-card-rise,
          .animate-auth-card,
          .animate-panel-in,
          .animate-tab-in,
          .animate-help-pop,
          .animate-modal-pop {
            animation: none !important;
          }
        }
      `}</style>
      <SubscriptionPrompt
        open={plansOpen}
        onClose={() => setPlansOpen(false)}
        onSelectPlan={handleSelectPlan}
      />
    </div>
  );
}
