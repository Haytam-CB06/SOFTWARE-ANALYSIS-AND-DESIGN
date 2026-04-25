import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  Calendar,
  Clock,
  BarChart3,
  Brain,
  BookOpen,
  Sparkles,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Users,
  Award,
  Target,
  Lightbulb,
  Heart,
  RefreshCw,
  Share2,
  MessageSquare,
  Layers,
  Settings,
  ShieldCheck,
  PlayCircle,
  LineChart,
  FolderKanban,
  Zap,
  Star,
  Mail,
  Phone,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useInlineText } from '../../i18n/inlineText';
import SubscriptionPrompt, { SubscriptionPlan } from '../../components/SubscriptionPrompt';
interface HomePageProps {
  onNavigate: (page: string) => void;
} 

export default function HomePage({ onNavigate }: HomePageProps) {
  const { t } = useTranslation();
  const tt = useInlineText();

  const heroRef = useRef<HTMLElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const cursorOrbRef = useRef<HTMLDivElement>(null);

  const [bookDemoOpen, setBookDemoOpen] = useState(false);
  const [plansOpen, setPlansOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<'email' | 'phone' | null>(null);

  const ownerName = 'UPLAN Team';
  const ownerRole = 'BOOK YOUR DEMO';
  const ownerEmail = 'U.PLAN@outlook.com';
  const ownerPhone = '+000 00 00 00 00';
  const ownerPhoneRaw = '000000000000';

  const handleCopy = async (value: string, field: 'email' | 'phone') => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      window.setTimeout(() => {
        setCopiedField((current) => (current === field ? null : current));
      }, 1800);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    if (plan === 'free') {
      setPlansOpen(false);
      onNavigate('auth');
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

    window.alert(
      t(
        'homepage.errors.planLinkMissing',
        'Payment/contact link is not configured yet. Add it in frontend/UPLAN/.env.'
      )
    );
  };

  const heroTitleLine1 = t('homepage.hero.titleLine1', 'Plan smarter, study better');
  const heroTitleLine2 = t('homepage.hero.titleLine2', 'Stay ahead every day');

  const splitText = (text: string) =>
    text.split('').map((char, index) => (
      <span
        key={`${char}-${index}`}
        className="split-char"
        style={{ animationDelay: `${index * 28}ms` }}
      >
        {char === ' ' ? '\u00A0' : char}
      </span>
    ));

  const features = [
    {
      icon: Calendar,
      title: t('homepage.features.smartScheduling.title', 'Smart Scheduling'),
      description: t(
        'homepage.features.smartScheduling.description',
        'Build study plans automatically based on your goals and deadlines.'
      ),
    },
    {
      icon: Clock,
      title: t('homepage.features.timeManagement.title', 'Time Management'),
      description: t(
        'homepage.features.timeManagement.description',
        'Organize sessions better and use your available time more efficiently.'
      ),
    },
    {
      icon: BarChart3,
      title: t('homepage.features.progressTracking.title', 'Progress Tracking'),
      description: t(
        'homepage.features.progressTracking.description',
        'Monitor completed sessions and keep momentum with visible progress.'
      ),
    },
    {
      icon: Brain,
      title: t('homepage.features.aiPowered.title', 'AI-Powered'),
      description: t(
        'homepage.features.aiPowered.description',
        'Use practical AI support to adapt your plan when priorities change.'
      ),
    },
    {
      icon: BookOpen,
      title: t('homepage.features.subjectBalance.title', 'Subject Balance'),
      description: t(
        'homepage.features.subjectBalance.description',
        'Distribute effort across subjects without neglecting important areas.'
      ),
    },
    {
      icon: Sparkles,
      title: t('homepage.features.adaptiveLearning.title', 'Adaptive Learning'),
      description: t(
        'homepage.features.adaptiveLearning.description',
        'Adjust your workload and recommendations based on your real performance.'
      ),
    },
  ];

  const services = [
    {
      icon: Calendar,
      title: t('homepage.services.smartTimetableGeneration.title', 'Smart Timetable Generation'),
      description: t(
        'homepage.services.smartTimetableGeneration.description',
        'Generate structured plans that fit your schedule and priorities.'
      ),
      features: [
        t(
          'homepage.services.smartTimetableGeneration.features.conflictFreeScheduling',
          'Conflict-free scheduling'
        ),
        t(
          'homepage.services.smartTimetableGeneration.features.priorityBasedPlanning',
          'Priority-based planning'
        ),
        t(
          'homepage.services.smartTimetableGeneration.features.customizableStudyBlocks',
          'Customizable study blocks'
        ),
        t(
          'homepage.services.smartTimetableGeneration.features.exportToCalendarApps',
          'Export to calendar apps'
        ),
      ],
    },
    {
      icon: RefreshCw,
      title: t('homepage.services.adaptiveUpdates.title', 'Adaptive Updates'),
      description: t(
        'homepage.services.adaptiveUpdates.description',
        'Update your plan in real time when deadlines or availability change.'
      ),
      features: [
        t(
          'homepage.services.adaptiveUpdates.features.realTimeRescheduling',
          'Real-time rescheduling'
        ),
        t(
          'homepage.services.adaptiveUpdates.features.automaticDeadlineAdjustments',
          'Automatic deadline adjustments'
        ),
        t(
          'homepage.services.adaptiveUpdates.features.flexibleSessionManagement',
          'Flexible session management'
        ),
        t(
          'homepage.services.adaptiveUpdates.features.smartRecoveryPlanning',
          'Smart recovery planning'
        ),
      ],
    },
    {
      icon: TrendingUp,
      title: t('homepage.services.progressTracking.title', 'Progress Tracking'),
      description: t(
        'homepage.services.progressTracking.description',
        'Turn planning into measurable progress with clear insights.'
      ),
      features: [
        t('homepage.services.progressTracking.features.dailyStudyLogs', 'Daily study logs'),
        t(
          'homepage.services.progressTracking.features.weeklyProgressReports',
          'Weekly progress reports'
        ),
        t(
          'homepage.services.progressTracking.features.achievementBadges',
          'Achievement badges'
        ),
        t(
          'homepage.services.progressTracking.features.productivityInsights',
          'Productivity insights'
        ),
      ],
    },
    {
      icon: Clock,
      title: t('homepage.services.examClassIntegration.title', 'Exam & Class Integration'),
      description: t(
        'homepage.services.examClassIntegration.description',
        'Connect exams, classes, and study sessions in one smart workflow.'
      ),
      features: [
        t(
          'homepage.services.examClassIntegration.features.calendarSynchronization',
          'Calendar synchronization'
        ),
        t(
          'homepage.services.examClassIntegration.features.examCountdownTimers',
          'Exam countdown timers'
        ),
        t(
          'homepage.services.examClassIntegration.features.classConflictDetection',
          'Class conflict detection'
        ),
        t(
          'homepage.services.examClassIntegration.features.automaticBufferTimes',
          'Automatic buffer times'
        ),
      ],
    },
  ];

  const stats = [
    { number: '10K+', label: t('homepage.stats.activeStudents', 'Active students') },
    { number: '2M+', label: t('homepage.stats.hoursPlanned', 'Hours planned') },
    { number: '98%', label: t('homepage.stats.successRate', 'Success rate') },
    { number: '4.6', label: t('homepage.stats.averageRating', 'Average rating') },
  ];

  const collaborationFeatures = [
    {
      icon: Users,
      title: t(
        'homepage.collaborationFeatures.teamCollaborationWorkspaces.title',
        'Team Collaboration Workspaces'
      ),
      description: t(
        'homepage.collaborationFeatures.teamCollaborationWorkspaces.description',
        'Work together in structured spaces built for student collaboration.'
      ),
    },
    {
      icon: Share2,
      title: t('homepage.collaborationFeatures.smartMemberSharing.title', 'Smart Member Sharing'),
      description: t(
        'homepage.collaborationFeatures.smartMemberSharing.description',
        'Share responsibilities and updates clearly with the right people.'
      ),
    },
    {
      icon: MessageSquare,
      title: t('homepage.collaborationFeatures.integratedTeamChat.title', 'Integrated Team Chat'),
      description: t(
        'homepage.collaborationFeatures.integratedTeamChat.description',
        'Communicate directly inside the workflow without losing context.'
      ),
    },
    {
      icon: Layers,
      title: t(
        'homepage.collaborationFeatures.hierarchicalSubworkspaces.title',
        'Hierarchical Subworkspaces'
      ),
      description: t(
        'homepage.collaborationFeatures.hierarchicalSubworkspaces.description',
        'Keep projects, groups, and tasks organized at multiple levels.'
      ),
    },
    {
      icon: BarChart3,
      title: t(
        'homepage.collaborationFeatures.teamProgressDashboard.title',
        'Team Progress Dashboard'
      ),
      description: t(
        'homepage.collaborationFeatures.teamProgressDashboard.description',
        'Track shared milestones and progress across your workspace.'
      ),
    },
    {
      icon: Settings,
      title: t(
        'homepage.collaborationFeatures.workspaceCustomization.title',
        'Workspace Customization'
      ),
      description: t(
        'homepage.collaborationFeatures.workspaceCustomization.description',
        'Adjust the environment to match how your team studies and works.'
      ),
    },
  ];

  const testimonials = [
    {
      name: 'Emily Rodriguez',
      role: t('homepage.testimonials.emily.role', 'Engineering Student'),
      university: 'MIT',
      rating: 5,
      text: t(
        'homepage.testimonials.emily.text',
        'UPLAN helped me stay consistent and finally manage all my deadlines without chaos.'
      ),
      highlight: t('homepage.testimonials.emily.highlight', 'More clarity every week'),
    },
    {
      name: 'James Chen',
      role: t('homepage.testimonials.james.role', 'Computer Science Student'),
      university: 'Stanford University',
      rating: 5,
      text: t(
        'homepage.testimonials.james.text',
        'The planning system feels simple, fast, and actually useful for everyday study.'
      ),
      highlight: t('homepage.testimonials.james.highlight', 'Smarter daily structure'),
    },
    {
      name: 'Sophia Williams',
      role: t('homepage.testimonials.sophia.role', 'Medical Student'),
      university: 'Harvard Medical School',
      rating: 5,
      text: t(
        'homepage.testimonials.sophia.text',
        'I finally feel like my workload is under control, even during intense periods.'
      ),
      highlight: t('homepage.testimonials.sophia.highlight', 'Less stress, better focus'),
    },
  ];

  const values = [
    {
      icon: Target,
      title: t('homepage.values.vision.title', 'Vision'),
      description: t('homepage.values.vision.description', 'Smart time management for every student.'),
    },
    {
      icon: Users,
      title: t('homepage.values.team.title', 'Team'),
      description: t(
        'homepage.values.team.description',
        'Built by people who understand student pressure firsthand.'
      ),
    },
    {
      icon: Lightbulb,
      title: t('homepage.values.innovation.title', 'Innovation'),
      description: t(
        'homepage.values.innovation.description',
        'Practical AI that helps students take action.'
      ),
    },
    {
      icon: Heart,
      title: t('homepage.values.studentFirst.title', 'Student First'),
      description: t(
        'homepage.values.studentFirst.description',
        'Every feature is made to reduce stress and improve consistency.'
      ),
    },
  ];

  const quickBenefits = [
    t('homepage.hero.cards.autoTimetables.title', 'Auto Timetables'),
    t('homepage.hero.cards.deadlineAware.title', 'Deadline Aware'),
    t('homepage.hero.cards.flexible.title', 'Flexible Planning'),
  ];

  const trustPoints = [
    t('homepage.stats.activeStudents', 'Active students'),
    t('homepage.stats.hoursPlanned', 'Hours planned'),
    t('homepage.stats.successRate', 'Success rate'),
  ];

  const phoneWeekdays = [
    t('homepage.phone.weekdays.mon', 'M'),
    t('homepage.phone.weekdays.tue', 'T'),
    t('homepage.phone.weekdays.wed', 'W'),
    t('homepage.phone.weekdays.thu', 'T'),
    t('homepage.phone.weekdays.fri', 'F'),
  ];

  const phoneSessions = [
    {
      time: '08:00',
      title: t('homepage.phone.sessions.math.title', 'Math Revision'),
      label: t('homepage.phone.sessions.math.label', 'High priority'),
      progress: '78%',
    },
    {
      time: '10:00',
      title: t('homepage.phone.sessions.physics.title', 'Physics Quiz Prep'),
      label: t('homepage.phone.sessions.physics.label', 'Due tomorrow'),
      progress: '46%',
    },
    {
      time: '12:30',
      title: t('homepage.phone.sessions.essay.title', 'Essay Draft'),
      label: t('homepage.phone.sessions.essay.label', 'Writing block'),
      progress: '58%',
    },
  ];

  const demoIncludes = [
    t('homepage.demo.includes.walkthrough', 'Full application walkthrough'),
    t('homepage.demo.includes.premium', 'Access-style premium experience'),
    t('homepage.demo.includes.advanced', 'Advanced features and workflows'),
    t('homepage.demo.includes.useCases', 'Real academic use cases'),
  ];

  const revealIds = useMemo(
    () => ({
      heroBadge: 'reveal-hero-badge',
      heroTitle: 'reveal-hero-title',
    }),
    []
  );

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.14,
        rootMargin: '0px 0px -8% 0px',
      }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const page = pageRef.current;
      const orb = cursorOrbRef.current;
      const hero = heroRef.current;
      if (!page || !orb || !hero) return;

      const x = event.clientX;
      const y = event.clientY;
      const heroRect = hero.getBoundingClientRect();
      const isInsideHero =
        x >= heroRect.left &&
        x <= heroRect.right &&
        y >= heroRect.top &&
        y <= heroRect.bottom;

      page.style.setProperty('--cursor-x', `${x}px`);
      page.style.setProperty('--cursor-y', `${y}px`);
      orb.style.transform = `translate3d(${x - 95}px, ${y - 95}px, 0)`;
      orb.classList.toggle('is-active', isInsideHero);
      hero.classList.toggle('is-cursor-active', isInsideHero);
    };

    const handlePointerLeave = () => {
      cursorOrbRef.current?.classList.remove('is-active');
      heroRef.current?.classList.remove('is-cursor-active');
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, []);

  useEffect(() => {
    const handleHeroParallax = () => {
      const hero = heroRef.current;
      if (!hero) return;

      const rect = hero.getBoundingClientRect();
      const progress = rect.top / window.innerHeight;
      hero.style.setProperty('--hero-scroll', `${progress}`);
    };

    const handleHeroPointerMove = (e: PointerEvent) => {
      const hero = heroRef.current;
      if (!hero) return;

      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      hero.style.setProperty('--hero-parallax-x', `${Math.max(0, Math.min(1, x))}`);
      hero.style.setProperty('--hero-parallax-y', `${Math.max(0, Math.min(1, y))}`);
    };

    window.addEventListener('scroll', handleHeroParallax, { passive: true });
    window.addEventListener('resize', handleHeroParallax);
    window.addEventListener('pointermove', handleHeroPointerMove, { passive: true });

    handleHeroParallax();

    return () => {
      window.removeEventListener('scroll', handleHeroParallax);
      window.removeEventListener('resize', handleHeroParallax);
      window.removeEventListener('pointermove', handleHeroPointerMove);
    };
  }, []);

  useEffect(() => {
    const pendingSection = sessionStorage.getItem('pendingHomeSection');
    const hashSection = window.location.hash.replace('#', '');
    const targetSection = pendingSection || hashSection;

    if (!targetSection) return;

    sessionStorage.removeItem('pendingHomeSection');

    window.requestAnimationFrame(() => {
      const element = document.getElementById(targetSection);
      if (!element) return;

      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }, []);

  useEffect(() => {
    const openPlans = () => setPlansOpen(true);

    if (sessionStorage.getItem('pendingHomePlans') === 'true') {
      sessionStorage.removeItem('pendingHomePlans');
      window.requestAnimationFrame(openPlans);
    }

    window.addEventListener('uplan:open-plans', openPlans);
    return () => window.removeEventListener('uplan:open-plans', openPlans);
  }, []);

  const handleInteractiveMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;

    target.style.setProperty('--px', `${px}`);
    target.style.setProperty('--py', `${py}`);
  };

  const handleInteractiveLeave = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    target.style.setProperty('--px', '0.5');
    target.style.setProperty('--py', '0.5');
  };

  const interactiveCardProps = {
    onPointerMove: handleInteractiveMove,
    onPointerLeave: handleInteractiveLeave,
  };

  return (
    <div
      ref={pageRef}
      className="homepage min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100"
    >
      <div ref={cursorOrbRef} aria-hidden="true" className="cursor-orb" />

      <section
        id="home"
        ref={heroRef}
        className="hero-shell relative scroll-mt-0 overflow-hidden border-b border-slate-200 dark:border-slate-800"
      >
        <div className="hero-grid absolute inset-0" />
        <div className="hero-spot absolute inset-0" />

        <div className="container-shell relative">
          <div className="hero-layout">
            <div className="max-w-2xl">
              <div
                data-reveal
                id={revealIds.heroBadge}
                className="reveal reveal-up inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold tracking-[0.12em] text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>{t('homepage.hero.badge', 'Built for focused students')}</span>
              </div>

              <h1
                data-reveal
                id={revealIds.heroTitle}
                className="reveal reveal-up mt-5 text-balance text-3xl font-bold leading-[1.04] text-slate-900 dark:text-white sm:text-4xl xl:text-5xl"
              >
                <span className="block split-line">{splitText(heroTitleLine1)}</span>
                <span className="mt-2 block split-line text-blue-700 dark:text-blue-700">
                  {splitText(heroTitleLine2)}
                </span>
              </h1>

              <p
                data-reveal
                className="reveal reveal-up reveal-delay-2 mt-5 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base"
              >
                {t(
                  'homepage.hero.description1',
                  'UPLAN helps students plan intelligently, adapt quickly, and move forward with clarity.'
                )}
              </p>

              <p
                data-reveal
                className="reveal reveal-up reveal-delay-3 mt-3 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400"
              >
                {t(
                  'homepage.hero.description2',
                  'A modern academic planning system designed for real deadlines, real pressure, and real progress.'
                )}
              </p>

              <div
                data-reveal
                className="reveal reveal-up reveal-delay-4 mt-7 flex flex-col gap-3 sm:flex-row"
              >
                <Button
                  size="lg"
                className="group cta-primary rounded-lg bg-blue-600 px-7 py-3 text-sm font-semibold text-white hover:bg-blue-700 dark:bg-blue-700 sm:text-base"
                  onClick={() => onNavigate('auth')}
                >
                  {t('homepage.hero.getStarted', 'Get Started')}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="cta-secondary h-11 rounded-lg border-slate-300 bg-white px-7 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 sm:text-base"
                  onClick={() => setPlansOpen(true)}
                >
                  <PlayCircle className="mr-2 h-4 w-4" />
                  {t('homepage.actions.seePlans', 'See plans')}
                </Button>
              </div>

              <div
                data-reveal
                className="reveal reveal-up reveal-delay-5 mt-7 flex flex-wrap gap-2"
              >
                {quickBenefits.map((benefit, index) => (
                  <div
                    key={benefit}
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 sm:text-sm"
                    style={{ transitionDelay: `${index * 40}ms` }}
                  >
                    <span className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>

              <div
                data-reveal
                className="reveal reveal-up reveal-delay-6 mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-slate-500 dark:text-slate-400 sm:text-sm"
              >
                {trustPoints.map((item) => (
                  <div key={item} className="inline-flex items-center gap-2">
                    <Star className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mx-auto w-full max-w-[520px] xl:max-w-[560px]">
              <div data-reveal className="dashboard-wrap reveal reveal-scale reveal-delay-3">
                <div className="dashboard-float">
                  <div className="floating-badge left-[-16px] top-8 hidden 2xl:block">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                      {t('homepage.mockup.thisWeek', 'This Week')}
                    </div>
                    <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">+24%</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {t('homepage.stats.successRate', 'Success rate')}
                    </div>
                  </div>

                  <div className="floating-badge right-[-14px] bottom-12 hidden 2xl:block">
                    <div className="flex items-center gap-2">
                      <LineChart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-slate-800 dark:text-white">
                        {t('homepage.mockup.organizedAutomatically', 'Organized automatically')}
                      </span>
                    </div>
                  </div>

                  <div className="dashboard-shell">
                    <div className="dashboard-header">
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">
                          {t('homepage.mockup.todayPlan', 'Today Plan')}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {t('homepage.mockup.organizedAutomatically', 'Organized automatically')}
                        </div>
                      </div>
                      <div className="rounded-xl bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                        {t('homepage.mockup.smart', 'Smart')}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="plan-task">
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <div className="text-sm font-medium text-slate-900 dark:text-white">
                            {t('homepage.mockup.mathRevision', 'Math Revision')}
                          </div>
                          <div className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                            08:00 - 09:30
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                          <div className="progress-blue w-3/4" />
                        </div>
                        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                          {t('homepage.mockup.priorityHigh', 'High priority')}
                        </div>
                      </div>

                      <div className="plan-task">
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <div className="text-sm font-medium text-slate-900 dark:text-white">
                            {t('homepage.mockup.physicsQuizPrep', 'Physics Quiz Prep')}
                          </div>
                          <div className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                            11:00 - 12:00
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                          <div className="progress-blue w-1/2" />
                        </div>
                        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                          {t('homepage.mockup.deadlineTomorrow', 'Deadline tomorrow')}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">
                            {t('homepage.mockup.thisWeek', 'This Week')}
                          </div>
                          <FolderKanban className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          <div className="small-stat">
                            <div className="text-lg font-bold text-slate-900 dark:text-white">12</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {t('homepage.mockup.sessions', 'Sessions')}
                            </div>
                          </div>
                          <div className="small-stat">
                            <div className="text-lg font-bold text-slate-900 dark:text-white">3</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {t('homepage.mockup.deadlines', 'Deadlines')}
                            </div>
                          </div>
                          <div className="small-stat">
                            <div className="text-lg font-bold text-slate-900 dark:text-white">8h</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {t('homepage.mockup.planned', 'Planned')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
                    {t('homepage.mockup.phoneFirst', 'Designed to feel simple, clear, and mobile-first')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="proof-strip border-b border-slate-200 dark:border-slate-800">
        <div className="container-shell">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                data-reveal
                className="hero-stat-card reveal reveal-up"
                style={{ ['--reveal-delay' as never]: `${index * 80}ms` }}
              >
                <div className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                  {stat.number}
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="section-shell scroll-mt-24">
        <div className="container-shell">
          <div className="product-grid">
            <div className="reveal reveal-left" data-reveal>
              <div className="section-pill">{t('homepage.values.title', 'What We Stand For')}</div>
              <h2 className="section-title text-left">
                {t('homepage.product.heading', 'A sharper way to plan, adapt, and win')}
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">
                {t(
                  'homepage.product.description',
                  'UPLAN is designed like a modern productivity system: structured, adaptive, and focused on real progress.'
                )}
              </p>

              <div className="mt-8 grid gap-4">
                {values.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      data-reveal
                      className="mini-value-card reveal reveal-up"
                      style={{ ['--reveal-delay' as never]: `${index * 90}ms` }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="mini-icon">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-base font-semibold text-slate-900 dark:text-white">
                            {item.title}
                          </h4>
                          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                className="cta-primary rounded-lg bg-blue-600 px-6 text-white"
                  onClick={() => onNavigate('auth')}
                >
                  {t('homepage.about.startJourney', 'Start Your Journey')}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="cta-secondary rounded-lg border-slate-300 bg-white px-6 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  {t('homepage.hero.seeFeatures', 'See Features')}
                </Button>
              </div>
            </div>

            <div className="values-phone-panel reveal reveal-right" data-reveal>
              <div className="values-phone-stage">
                <div className="values-phone-device" aria-label={t('homepage.values.phoneAlt', 'U PLAN mobile app')}>
                  <div className="values-phone-speaker" aria-hidden="true" />
                  <div className="values-phone-screen">
                    <div className="phone-ui-preview">
                      <div className="phone-status-row">
                        <span>9:41</span>
                        <span className="phone-status-dots">
                          <span />
                          <span />
                          <span />
                        </span>
                      </div>

                      <div className="phone-app-header">
                        <div>
                          <p className="phone-kicker">
                            {t('homepage.phone.kicker', 'Study Timetable')}
                          </p>
                          <h3>{t('homepage.phone.today', 'Today')}</h3>
                        </div>
                        <div className="phone-bell">
                          <Calendar className="h-3.5 w-3.5" />
                        </div>
                      </div>

                      <div className="phone-date-strip">
                        {phoneWeekdays.map((day, index) => (
                          <div key={`${day}-${index}`} className={index === 2 ? 'is-active' : ''}>
                            <span>{day}</span>
                            <strong>{22 + index}</strong>
                          </div>
                        ))}
                      </div>

                      <div className="phone-focus-card">
                        <div>
                          <p>{t('homepage.phone.nextFocus', 'Next focus')}</p>
                          <h4>{t('homepage.phone.chemistryReview', 'Chemistry Review')}</h4>
                        </div>
                        <span>68%</span>
                      </div>

                      <div className="phone-session-list">
                        {phoneSessions.map(({ time, title, label, progress }) => (
                          <div className="phone-session" key={title}>
                            <div className="phone-session-time">{time}</div>
                            <div className="phone-session-body">
                              <div className="phone-session-title">
                                <strong>{title}</strong>
                                <CheckCircle className="h-3.5 w-3.5" />
                              </div>
                              <p>{label}</p>
                              <div className="phone-progress-track">
                                <span style={{ width: progress }} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="phone-bottom-nav">
                        <span className="is-active">
                          <Calendar className="h-3.5 w-3.5" />
                          {t('homepage.phone.nav.plan', 'Plan')}
                        </span>
                        <span>
                          <BarChart3 className="h-3.5 w-3.5" />
                          {t('homepage.phone.nav.progress', 'Progress')}
                        </span>
                        <span>
                          <BookOpen className="h-3.5 w-3.5" />
                          {t('homepage.phone.nav.tasks', 'Tasks')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="values-phone-caption">
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                      {t('homepage.values.mobilePreview', 'Mobile preview')}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                      {t('homepage.values.clearDailyPlan', 'Clear daily planning at a glance')}
                    </p>
                  </div>
                  <div className="rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white">
                    {t('homepage.mockup.smart', 'Smart')}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <section id="services" className="section-shell scroll-mt-24 border-y border-slate-200 dark:border-slate-800">
        <div className="container-shell">
          <div className="section-heading reveal reveal-up" data-reveal>
            <div className="section-pill">{t('homepage.servicesSection.title', 'Services')}</div>
            <p className="section-subtitle">
              {t(
                'homepage.servicesSection.subtitle',
                'A complete planning system built to help students stay organized and consistent.'
              )}
            </p>
          </div>

          <div className="services-bento">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.title}
                  data-reveal
                  className="interactive-card service-card reveal reveal-up"
                  style={{ ['--reveal-delay' as never]: `${index * 110}ms` }}
                  {...interactiveCardProps}
                >
                  <div className="pointer-shine" />
                  <div className="p-5 sm:p-6">
                    <div className="mb-5 flex items-start gap-4">
                      <div className="rounded-2xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white sm:text-2xl">
                          {service.title}
                        </h3>
                      </div>
                    </div>

                    <p className="mb-5 text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
                      {service.description}
                    </p>

                    <ul className="grid gap-2">
                      {service.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                        >
                          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-shell">
        <div className="container-shell">
          <div className="collab-layout">
            <div className="section-heading text-left reveal reveal-left" data-reveal>
              <div className="section-pill">
                {t('homepage.collaborationSection.badge', 'Collaboration')}
              </div>
              <h2 className="section-title text-left">
                {t('homepage.collaborationSection.title', 'Built for teamwork too')}
              </h2>
              <p className="section-subtitle !mx-0 max-w-xl text-left">
                {t(
                  'homepage.collaborationSection.subtitle',
                  'Create spaces where students can coordinate, communicate, and stay aligned.'
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {collaborationFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    data-reveal
                    className="interactive-card feature-card reveal reveal-up"
                    style={{ ['--reveal-delay' as never]: `${index * 80}ms` }}
                    {...interactiveCardProps}
                  >
                    <div className="pointer-shine" />
                    <div className="mb-5 inline-flex items-center justify-center rounded-2xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
                      {feature.title}
                    </h3>
                    <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell border-y border-slate-200 dark:border-slate-800">
        <div className="container-shell">
          <div className="section-heading reveal reveal-up" data-reveal>
            <div className="section-pill">
              {t('homepage.testimonialsSection.badge', 'Testimonials')}
            </div>
            <h2 className="section-title">
              {t('homepage.testimonialsSection.title', 'What students say')}
            </h2>
            <p className="section-subtitle">
              {t(
                'homepage.testimonialsSection.subtitle',
                'Students use UPLAN to stay organized, reduce stress, and improve consistency.'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div
                key={`${testimonial.name}-${testimonial.university}`}
                data-reveal
                className="interactive-card testimonial-card reveal reveal-up"
                style={{ ['--reveal-delay' as never]: `${index * 80}ms` }}
                {...interactiveCardProps}
              >
                <div className="pointer-shine" />
                <div className="mb-4 flex items-center gap-1.5">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Award key={i} className="h-4 w-4 fill-blue-500 text-blue-500" />
                  ))}
                </div>

                <p className="mb-4 text-sm leading-7 text-slate-700 dark:text-slate-300">
                  “{testimonial.text}”
                </p>

                <div className="mb-5 inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300">
                  {testimonial.highlight}
                </div>

                <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {testimonial.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {testimonial.role}
                  </p>
                  <p className="mt-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                    {testimonial.university}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-shell">
        <div className="container-shell text-center">
          <div
            data-reveal
            className="interactive-card reveal reveal-scale mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900 sm:p-7"
            {...interactiveCardProps}
          >
            <div className="pointer-shine" />
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
              <Zap className="h-7 w-7" />
            </div>

            <h2 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
              {t('homepage.finalCta.title', 'Ready to plan with confidence?')}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">
              {t(
                'homepage.finalCta.description',
                'Start organizing your academic life with a system that adapts to your real needs.'
              )}
            </p>

            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                className="group cta-primary rounded-lg bg-blue-600 px-7 py-3 text-sm font-semibold text-white hover:bg-blue-700 dark:bg-blue-700 sm:text-base"
                onClick={() => onNavigate('auth')}
              >
                {t('homepage.finalCta.startFreeTrial', 'Start Free Trial')}
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="cta-secondary rounded-lg border-2 border-blue-600 bg-white px-7 py-3 text-sm font-semibold text-blue-600 dark:border-blue-400 dark:bg-slate-900 dark:text-blue-400 sm:text-base"
                onClick={() => setPlansOpen(true)}
              >
                {t('homepage.actions.seePlans', 'See plans')}
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="cta-secondary rounded-lg border-2 border-slate-300 bg-white px-7 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 sm:text-base"
                onClick={() => setBookDemoOpen(true)}
              >
                {t('homepage.finalCta.bookDemo', 'Book Demo')}
              </Button>
            </div>

            <p className="mt-8 text-sm text-slate-500 dark:text-slate-400">
              {t('homepage.finalCta.footer', 'No complexity. Just better planning.')}
            </p>
          </div>
        </div>
      </section>

      <Dialog open={bookDemoOpen} onOpenChange={setBookDemoOpen}>
  <DialogOverlay className="bg-slate-950/60 backdrop-blur-md" />

  <DialogContent className="!w-[min(94vw,960px)] !max-w-[960px] border border-slate-200 bg-white p-0 shadow-[0_32px_120px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-950">
    <div className="grid overflow-hidden lg:grid-cols-[1.35fr_0.8fr]">
      {/* Left side */}
      <div className="border-b border-slate-200 p-8 lg:border-b-0 lg:border-r dark:border-slate-800">
        <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300">
          {t('homepage.demo.badge', 'Premium Demo Access')}
        </div>

        <h3 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">
          {t('homepage.demo.title', 'Book Your Demo')}
        </h3>

        <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
          {t('homepage.demo.description1', 'This demo is designed to give users the complete UPLAN experience. During the session, they will discover the platform in the same way a top-tier customer would, with a full walkthrough of all major features, premium workflows, and advanced capabilities.')}
        </p>

        <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
          {t('homepage.demo.description2', 'Rather than a limited preview, the demo is structured to showcase the real value of the product across planning, progress tracking, collaboration, and smart academic organization.')}
        </p>
  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
    {t('homepage.demo.includedTitle', 'What is included')}
  </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {demoIncludes.map((item) => (
            <div
              key={item}
              className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right side */}
      <div className="bg-slate-50/70 p-8 dark:bg-slate-900/40">
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-700 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-300">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          {t('homepage.demo.replyTime', 'Usually replies within 24h')}
        </div>
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-slate-900 dark:text-white">
                {ownerName}
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {ownerRole}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              {t('homepage.demo.emailLabel', 'Email')}
            </div>

            <div className="mt-2 flex items-center gap-2">
              <a
                href={`mailto:${ownerEmail}`}
                className="flex-1 truncate rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-900 transition hover:text-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:text-blue-400"
              >
                {ownerEmail}
              </a>

              <button
                onClick={() => handleCopy(ownerEmail, 'email')}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white transition hover:border-blue-200 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-900/40 dark:hover:text-blue-400"
              >
                {copiedField === 'email' ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
              {t('homepage.demo.contactMeta', 'No commitment. Quick response. Direct access.')}
            </p>
          <div className="mt-6 space-y-3">
            <a href={`mailto:${ownerEmail}`} className="block">
              <Button className="w-full rounded-xl bg-blue-600 text-white">
                {t('homepage.demo.requestDemo', 'Request Demo')}
              </Button>
            </a>

            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-slate-600 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-slate-300">
              {t('homepage.demo.contactNote', 'You can request a personalized demo, ask product questions, or discuss partnership opportunities directly.')}
            </div>
          </div>
        </div>
      </div>
    </div>
  </DialogContent>
</Dialog>

      <style>{`
        .homepage {
          --cursor-x: 50vw;
          --cursor-y: 18vh;
          --container-max: 1120px;
          --container-px: clamp(16px, 2.4vw, 28px);
          --section-y: clamp(36px, 5svh, 64px);
          --hero-parallax-x: 0.5;
          --hero-parallax-y: 0.5;
          --hero-scroll: 0;
          scroll-behavior: smooth;
        }

        .homepage > section {
          scroll-margin-top: 76px;
        }

        .services-bento,
        .collab-layout,
        .content-grid,
        .product-grid {
          width: 100%;
        }

        img,
        svg {
          max-width: 100%;
        }

        .dashboard-shell,
        .service-card,
        .feature-card,
        .testimonial-card,
        .premium-card {
          width: 100%;
        }

        .container-shell {
          width: min(100%, var(--container-max));
          margin-inline: auto;
          padding-inline: var(--container-px);
        }

        .section-shell {
          position: relative;
          padding-block: var(--section-y);
        }

        .proof-strip {
          padding-block: 1rem;
          background: rgba(255,255,255,0.72);
          backdrop-filter: blur(10px);
        }

        .dark .proof-strip {
          background: rgba(2,6,23,0.72);
        }

        .hero-shell {
          position: relative;
          min-height: calc(100svh - 72px);
          display: flex;
          align-items: center;
          padding-block:
            clamp(24px, 4svh, 48px)
            clamp(32px, 5svh, 60px);
          background: rgb(248 250 252);
        }

        .dark .hero-shell {
          background: rgb(2 6 23);
        }

        .reveal {
          opacity: 0;
          will-change: transform, opacity, filter;
          transition:
            opacity 900ms cubic-bezier(0.22, 1, 0.36, 1),
            transform 900ms cubic-bezier(0.22, 1, 0.36, 1),
            filter 900ms cubic-bezier(0.22, 1, 0.36, 1);
          transition-delay: var(--reveal-delay, 0ms);
          filter: blur(10px);
        }

        .reveal-up {
          transform: translate3d(0, 34px, 0);
        }

        .reveal-scale {
          transform: translate3d(0, 28px, 0) scale(0.965);
        }

        .reveal-left {
          transform: translate3d(-28px, 0, 0);
        }

        .reveal-right {
          transform: translate3d(28px, 0, 0);
        }

        .reveal.is-visible {
          opacity: 1;
          transform: translate3d(0, 0, 0) scale(1);
          filter: blur(0);
        }

        .reveal-delay-2 { --reveal-delay: 140ms; }
        .reveal-delay-3 { --reveal-delay: 220ms; }
        .reveal-delay-4 { --reveal-delay: 320ms; }
        .reveal-delay-5 { --reveal-delay: 420ms; }
        .reveal-delay-6 { --reveal-delay: 520ms; }

        .split-line {
          display: block;
          overflow: hidden;
        }

        .split-char {
          display: inline-block;
          opacity: 0;
          transform: translate3d(0, 1.1em, 0) rotate(4deg);
          filter: blur(8px);
          animation: splitCharIn 900ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        @keyframes splitCharIn {
          0% {
            opacity: 0;
            transform: translate3d(0, 1.1em, 0) rotate(4deg);
            filter: blur(8px);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) rotate(0deg);
            filter: blur(0);
          }
        }

        .section-heading.is-visible .section-title,
        .section-heading.is-visible .section-subtitle,
        .section-heading.is-visible .section-pill {
          animation: sectionRise 800ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .section-heading.is-visible .section-subtitle {
          animation-delay: 100ms;
        }

        @keyframes sectionRise {
          0% {
            opacity: 0;
            transform: translateY(20px);
            filter: blur(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        .hero-layout {
          display: grid;
          gap: clamp(22px, 3vw, 40px);
          align-items: center;
        }

        @media (min-width: 1080px) {
          .hero-layout {
            grid-template-columns: minmax(0, 0.95fr) minmax(320px, 0.85fr);
          }
        }

        .product-grid {
          display: grid;
          gap: clamp(22px, 3vw, 36px);
          align-items: center;
          max-width: none;
        }

        @media (min-width: 1024px) {
          .product-grid {
            grid-template-columns: minmax(0, 1fr) minmax(260px, 340px);
          }
        }

        .collab-layout {
          display: grid;
          gap: 1.5rem;
        }

        .services-bento {
          display: grid;
          gap: 1rem;
          grid-template-columns: 1fr;
        }

        @media (min-width: 1100px) {
          .services-bento {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 1.25rem;
          }
        }

        .content-grid {
          display: grid;
          gap: 2rem;
          align-items: center;
        }

        @media (min-width: 1024px) {
          .content-grid {
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
            gap: 3rem;
          }
        }

        .section-heading {
          margin-bottom: 2rem;
          text-align: center;
        }

        .section-title {
          margin-top: 1rem;
          font-size: 2rem;
          line-height: 1.08;
          font-weight: 700;
          letter-spacing: 0;
          color: rgb(15 23 42);
        }

        .dark .section-title {
          color: white;
        }

        .section-subtitle {
          margin-inline: auto;
          margin-top: 0.85rem;
          max-width: 38rem;
          font-size: 0.95rem;
          line-height: 1.65rem;
          color: rgb(71 85 105);
        }

        .dark .section-subtitle {
          color: rgb(203 213 225);
        }

        .cursor-orb {
          position: fixed;
          left: 0;
          top: 0;
          width: 190px;
          height: 190px;
          border-radius: 9999px;
          pointer-events: none;
          z-index: 45;
          opacity: 0;
          transform: translate3d(var(--cursor-x), var(--cursor-y), 0);
          transition:
            opacity 180ms ease,
            transform 90ms linear;
          filter: blur(48px);
          background: radial-gradient(
            circle,
            rgba(37, 99, 235, 0.22) 0%,
            rgba(37, 99, 235, 0.12) 42%,
            transparent 75%
          );
          mix-blend-mode: multiply;
          will-change: transform, opacity;
        }

        .cursor-orb.is-active {
          opacity: 1;
        }

        .dark .cursor-orb {
          background: radial-gradient(
            circle,
            rgba(96, 165, 250, 0.26) 0%,
            rgba(59, 130, 246, 0.16) 42%,
            transparent 75%
          );
          mix-blend-mode: screen;
        }

        .hero-grid {
          display: none;
          background-image:
            linear-gradient(rgba(96, 106, 121, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148,163,184,0.10) 1px, transparent 1px);
          background-size: 34px 34px;
          mask-image: linear-gradient(to bottom, rgba(0,0,0,0.95), rgba(0,0,0,0.5));
          -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,0.95), rgba(0,0,0,0.5));
          transform:
            translate3d(
              calc((var(--hero-parallax-x) - 0.5) * 12px),
              calc(var(--hero-scroll) * -18px),
              0
            );
          transition: transform 280ms ease-out;
        }

        .dark .hero-grid {
          background-image:
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
        }

        .dashboard-float {
          animation: dashboardFloat 10s ease-in-out infinite;
        }

        .hero-spot {
          opacity: 0;
          pointer-events: none;
          background: radial-gradient(
            300px circle at var(--cursor-x) var(--cursor-y),
            rgba(59,130,246,0.16),
            transparent 70%
          );
          transform:
            translate3d(
              calc((var(--hero-parallax-x) - 0.5) * 18px),
              calc((var(--hero-parallax-y) - 0.5) * 18px),
              0
            );
          transition:
            opacity 180ms ease,
            transform 220ms ease-out;
        }

        .hero-shell.is-cursor-active .hero-spot {
          opacity: 1;
        }

        .hero-layout > div:first-child {
          transform:
            translate3d(
              calc((var(--hero-parallax-x) - 0.5) * -10px),
              calc(var(--hero-scroll) * -8px),
              0
            );
          transition: transform 300ms ease-out;
        }

        .dashboard-wrap {
          position: relative;
          transform:
            translate3d(
              calc((var(--hero-parallax-x) - 0.5) * 16px),
              calc((var(--hero-parallax-y) - 0.5) * 12px),
              0
            );
          transition: transform 300ms ease-out;
        }

        .floating-badge {
          position: absolute;
          z-index: 2;
          border-radius: 1rem;
          border: 1px solid rgb(226 232 240);
          background: rgba(255,255,255,0.92);
          padding: 0.9rem 1rem;
          box-shadow: 0 18px 36px rgba(15,23,42,0.10);
          backdrop-filter: blur(10px);
          animation: badgeFloat 6s ease-in-out infinite;
        }

        .dark .floating-badge {
          border-color: rgb(30 41 59);
          background: rgba(15,23,42,0.9);
        }

        .dashboard-shell {
          position: relative;
          overflow: hidden;
          border-radius: 0.875rem;
          border: 1px solid rgb(226 232 240);
          background: white;
          padding: 0.75rem;
          box-shadow: 0 18px 44px rgba(15,23,42,0.09);
        }

        .dashboard-shell::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: inherit;
          pointer-events: none;
          background:
            linear-gradient(
              135deg,
              rgba(59,130,246,0.16),
              rgba(255,255,255,0),
              rgba(59,130,246,0.08)
            );
          opacity: 0.8;
          mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          -webkit-mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          mask-composite: exclude;
          -webkit-mask-composite: xor;
          padding: 1px;
        }

        .dark .dashboard-shell {
          border-color: rgb(30 41 59);
          background: rgb(15 23 42);
        }

        .dashboard-header {
          margin-bottom: 0.8rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .plan-task {
          border: 1px solid rgb(226 232 240);
          background: rgb(248 250 252);
          padding: 0.8rem;
          border-radius: 0.5rem;
          transition: transform 300ms ease, border-color 300ms ease, box-shadow 300ms ease;
        }

        .plan-task:hover {
          transform: translateY(-3px);
          border-color: rgb(191 219 254);
          box-shadow: 0 14px 30px rgba(15,23,42,0.06);
        }

        .dark .plan-task {
          border-color: rgb(30 41 59);
          background: rgb(15 23 42);
        }

        .progress-blue {
          height: 100%;
          border-radius: 9999px;
          background: rgb(59 130 246);
          animation: progressEnter 1.1s ease-out both;
          transform-origin: left;
        }

        .small-stat,
        .mini-value-card {
          border-radius: 0.5rem;
          background: white;
          border: 1px solid rgb(226 232 240);
          padding: 0.85rem;
          transition:
            transform 300ms ease,
            border-color 300ms ease,
            box-shadow 300ms ease;
        }

        .mini-value-card:hover {
          transform: translateY(-4px);
          border-color: rgb(191 219 254);
          box-shadow: 0 14px 30px rgba(15,23,42,0.06);
        }

        .dark .small-stat,
        .dark .mini-value-card {
          background: rgb(15 23 42);
          border-color: rgb(30 41 59);
        }

        .mini-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 2.45rem;
          height: 2.45rem;
          border-radius: 0.5rem;
          background: rgb(239 246 255);
          color: rgb(37 99 235);
          flex-shrink: 0;
        }

        .dark .mini-icon {
          background: rgba(30,58,138,0.25);
          color: rgb(96 165 250);
        }

        .values-phone-panel {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 500px;
          overflow: visible;
        }

        @media (min-width: 1024px) {
          .values-phone-panel {
            justify-content: flex-end;
          }
        }

        .values-phone-stage {
          position: relative;
          width: min(100%, 340px);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .values-phone-stage::before {
          content: '';
          position: absolute;
          inset: 10% 0 16%;
          border-radius: 999px;
          background:
            radial-gradient(circle at 52% 42%, rgba(37,99,235,0.18), transparent 58%),
            linear-gradient(145deg, rgba(14,165,233,0.16), rgba(15,23,42,0));
          filter: blur(30px);
          pointer-events: none;
        }

        .values-phone-device {
          position: relative;
          width: min(250px, 72vw);
          aspect-ratio: 9 / 19.5;
          border-radius: 1.85rem;
          padding: 0.55rem;
          background:
            linear-gradient(145deg, #111827, #020617 46%, #1e293b),
            #020617;
          border: 1px solid rgba(255,255,255,0.18);
          box-shadow:
            0 34px 70px rgba(15,23,42,0.24),
            0 10px 24px rgba(37,99,235,0.14),
            inset 0 0 0 1px rgba(255,255,255,0.08);
          isolation: isolate;
        }

        .values-phone-device::before {
          left: -0.16rem;
          top: 6.2rem;
          width: 0.2rem;
          height: 3.5rem;
          inset: auto;
          border-radius: 999px;
          background: linear-gradient(to bottom, #64748b, #1e293b);
          z-index: auto;
        }

        .values-phone-device::after {
          right: -0.18rem;
          top: 7.7rem;
          width: 0.2rem;
          height: 4.7rem;
          border-radius: 999px;
          background: linear-gradient(to bottom, #94a3b8, #334155);
          box-shadow: none;
        }

        .values-phone-speaker {
          position: absolute;
          left: 50%;
          top: 1rem;
          z-index: 4;
          display: block;
          width: 5.4rem;
          height: 1.15rem;
          transform: translateX(-50%);
          border-radius: 0 0 1rem 1rem;
          background: #020617;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.08);
        }

        .values-phone-speaker::after {
          content: '';
          position: absolute;
          left: 50%;
          top: 0.34rem;
          width: 2.25rem;
          height: 0.26rem;
          transform: translateX(-50%);
          border-radius: 999px;
          background: #1e293b;
        }

        .values-phone-screen {
          position: relative;
          height: 100%;
          overflow: hidden;
          border-radius: 1.35rem;
          background: #020617;
          box-shadow:
            inset 0 0 0 1px rgba(255,255,255,0.08),
            inset 0 0 18px rgba(2,6,23,0.55);
        }

        .values-phone-screen::before {
          z-index: 2;
          background:
            linear-gradient(115deg, rgba(255,255,255,0.22), transparent 22%, transparent 76%, rgba(255,255,255,0.10)),
            linear-gradient(to bottom, rgba(255,255,255,0.10), transparent 18%);
          mix-blend-mode: screen;
        }

        .values-phone-screen::after {
          z-index: 3;
          box-shadow: inset 0 0 0 1px rgba(15,23,42,0.18);
        }

        .phone-ui-preview {
          position: relative;
          display: flex;
          min-height: 100%;
          flex-direction: column;
          gap: 0.72rem;
          overflow: hidden;
          background:
            linear-gradient(180deg, #eff6ff 0%, #f8fafc 32%, #ffffff 100%);
          padding: 1.55rem 0.72rem 0.72rem;
          color: #0f172a;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .phone-status-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.62rem;
          font-weight: 700;
          color: #0f172a;
        }

        .phone-status-dots {
          display: inline-flex;
          align-items: center;
          gap: 0.18rem;
        }

        .phone-status-dots span {
          display: block;
          width: 0.28rem;
          height: 0.28rem;
          border-radius: 999px;
          background: #2563eb;
        }

        .phone-status-dots span:last-child {
          width: 0.72rem;
          border-radius: 999px;
        }

        .phone-app-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .phone-kicker {
          margin: 0;
          font-size: 0.55rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #64748b;
        }

        .phone-app-header h3 {
          margin: 0.12rem 0 0;
          font-size: 1.05rem;
          line-height: 1.1;
          font-weight: 800;
          color: #0f172a;
        }

        .phone-bell {
          display: inline-flex;
          width: 1.9rem;
          height: 1.9rem;
          align-items: center;
          justify-content: center;
          border-radius: 0.5rem;
          background: #dbeafe;
          color: #2563eb;
          box-shadow: inset 0 0 0 1px rgba(37,99,235,0.08);
        }

        .phone-date-strip {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 0.35rem;
        }

        .phone-date-strip div {
          display: flex;
          min-height: 2.7rem;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 0.5rem;
          border: 1px solid #e2e8f0;
          background: rgba(255,255,255,0.82);
          color: #64748b;
        }

        .phone-date-strip span {
          font-size: 0.52rem;
          font-weight: 700;
        }

        .phone-date-strip strong {
          margin-top: 0.1rem;
          font-size: 0.75rem;
          color: #0f172a;
        }

        .phone-date-strip .is-active {
          border-color: #2563eb;
          background: #2563eb;
          color: white;
          box-shadow: 0 0.65rem 1rem rgba(37,99,235,0.18);
        }

        .phone-date-strip .is-active strong {
          color: white;
        }

        .phone-focus-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-radius: 0.65rem;
          background: linear-gradient(135deg, #1d4ed8, #3b82f6);
          padding: 0.85rem;
          color: white;
          box-shadow: 0 1rem 1.6rem rgba(37,99,235,0.22);
        }

        .phone-focus-card p {
          margin: 0;
          font-size: 0.58rem;
          font-weight: 700;
          opacity: 0.82;
        }

        .phone-focus-card h4 {
          margin: 0.16rem 0 0;
          font-size: 0.9rem;
          line-height: 1.1;
          font-weight: 800;
        }

        .phone-focus-card span {
          display: inline-flex;
          min-width: 2.25rem;
          height: 2.25rem;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: rgba(255,255,255,0.18);
          font-size: 0.72rem;
          font-weight: 800;
        }

        .phone-session-list {
          display: grid;
          gap: 0.55rem;
        }

        .phone-session {
          display: grid;
          grid-template-columns: 2.35rem minmax(0, 1fr);
          gap: 0.45rem;
          align-items: stretch;
        }

        .phone-session-time {
          padding-top: 0.55rem;
          font-size: 0.55rem;
          font-weight: 700;
          color: #64748b;
        }

        .phone-session-body {
          border-radius: 0.55rem;
          border: 1px solid #e2e8f0;
          background: white;
          padding: 0.62rem;
          box-shadow: 0 0.45rem 1rem rgba(15,23,42,0.04);
        }

        .phone-session-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.4rem;
          color: #0f172a;
        }

        .phone-session-title strong {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 0.68rem;
          font-weight: 800;
        }

        .phone-session-title svg {
          flex: 0 0 auto;
          color: #2563eb;
        }

        .phone-session-body p {
          margin: 0.18rem 0 0.48rem;
          font-size: 0.56rem;
          font-weight: 600;
          color: #64748b;
        }

        .phone-progress-track {
          height: 0.26rem;
          overflow: hidden;
          border-radius: 999px;
          background: #e2e8f0;
        }

        .phone-progress-track span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #2563eb, #60a5fa);
        }

        .phone-bottom-nav {
          margin-top: auto;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.35rem;
          border-radius: 0.65rem;
          border: 1px solid #e2e8f0;
          background: rgba(255,255,255,0.9);
          padding: 0.35rem;
          box-shadow: 0 -0.35rem 1.2rem rgba(15,23,42,0.04);
        }

        .phone-bottom-nav span {
          display: inline-flex;
          min-width: 0;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.12rem;
          border-radius: 0.45rem;
          padding: 0.38rem 0.18rem;
          font-size: 0.48rem;
          font-weight: 800;
          color: #64748b;
        }

        .phone-bottom-nav .is-active {
          background: #eff6ff;
          color: #2563eb;
        }

        .values-phone-caption {
          position: relative;
          z-index: 1;
          display: flex;
          width: min(100%, 320px);
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          border-radius: 0.5rem;
          border: 1px solid rgb(226 232 240);
          background: rgba(255,255,255,0.88);
          padding: 0.85rem;
          box-shadow: 0 18px 40px rgba(15,23,42,0.08);
          backdrop-filter: blur(12px);
        }

        .dark .values-phone-stage::before {
          background:
            radial-gradient(circle at 52% 42%, rgba(59,130,246,0.24), transparent 58%),
            linear-gradient(145deg, rgba(14,165,233,0.15), rgba(15,23,42,0));
        }

        .dark .values-phone-device {
          border-color: rgba(148,163,184,0.24);
          box-shadow:
            0 34px 78px rgba(0,0,0,0.42),
            0 10px 24px rgba(37,99,235,0.16),
            inset 0 0 0 1px rgba(255,255,255,0.10);
        }

        .dark .values-phone-caption {
          border-color: rgba(51,65,85,0.85);
          background: rgba(15,23,42,0.88);
        }

        .hero-stat-card {
          border: 1px solid rgb(226 232 240);
          background: white;
          padding: 0.85rem;
          border-radius: 0.5rem;
          text-align: center;
          box-shadow: 0 1px 2px rgba(15,23,42,0.04);
          transition:
            transform 320ms ease,
            box-shadow 320ms ease,
            border-color 320ms ease,
            background-color 320ms ease;
        }

        .hero-stat-card:hover {
          transform: translateY(-6px);
          border-color: rgb(191 219 254);
          box-shadow: 0 14px 34px rgba(15,23,42,0.08);
        }

        .dark .hero-stat-card {
          border-color: rgb(30 41 59);
          background: rgb(15 23 42);
        }

        .section-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 9999px;
          border: 1px solid rgb(191 219 254);
          background: rgb(239 246 255);
          padding: 0.42rem 0.85rem;
          font-size: 0.78rem;
          font-weight: 600;
          color: rgb(29 78 216);
        }

        .dark .section-pill {
          border-color: rgba(30,64,175,0.4);
          background: rgba(30,58,138,0.16);
          color: rgb(147 197 253);
        }

        .interactive-card {
          --px: 0.5;
          --py: 0.5;
          position: relative;
          transform:
            perspective(1000px)
            rotateX(calc((var(--py) - 0.5) * -4deg))
            rotateY(calc((var(--px) - 0.5) * 4deg));
          transition:
            transform 180ms ease,
            box-shadow 220ms ease,
            border-color 220ms ease;
        }

        .interactive-card:hover {
          box-shadow: 0 20px 44px rgba(15,23,42,0.10);
        }

        .pointer-shine {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          opacity: 0;
          transition: opacity 180ms ease;
          background: radial-gradient(
            220px circle at calc(var(--px) * 100%) calc(var(--py) * 100%),
            rgba(59,130,246,0.10),
            transparent 70%
          );
        }

        .interactive-card:hover .pointer-shine {
          opacity: 1;
        }

        .premium-card,
        .feature-card,
        .service-card,
        .testimonial-card {
          overflow: hidden;
          border-radius: 0.5rem;
          border: 1px solid rgb(226 232 240);
          background: white;
          box-shadow: 0 1px 2px rgba(15,23,42,0.04);
          transition:
            transform 320ms ease,
            box-shadow 320ms ease,
            border-color 320ms ease,
            background-color 320ms ease;
        }

        .premium-card:hover,
        .feature-card:hover,
        .service-card:hover,
        .testimonial-card:hover {
          transform: translateY(-6px);
        }

        .dark .premium-card,
        .dark .feature-card,
        .dark .service-card,
        .dark .testimonial-card {
          border-color: rgb(30 41 59);
          background: rgb(15 23 42);
        }

        .premium-card,
        .feature-card,
        .testimonial-card {
          padding: 1.15rem;
        }

        .service-card {
          border-radius: 0.5rem;
        }

        .cta-primary,
        .cta-secondary {
          position: relative;
          overflow: hidden;
          transition:
            transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 220ms ease,
            background-color 220ms ease,
            border-color 220ms ease,
            color 220ms ease;
        }

        .cta-primary::before,
        .cta-secondary::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(
              120deg,
              transparent 20%,
              rgba(255,255,255,0.20) 45%,
              transparent 70%
            );
          transform: translateX(-130%);
          transition: transform 700ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .cta-primary:hover,
        .cta-secondary:hover {
          transform: translateY(-3px) scale(1.01);
        }

        .cta-primary:hover::before,
        .cta-secondary:hover::before {
          transform: translateX(130%);
        }

        .cta-primary:active,
        .cta-secondary:active {
          transform: translateY(-1px) scale(0.99);
        }

        .cta-primary {
          box-shadow:
            0 14px 30px rgba(37,99,235,0.22),
            0 0 0 0 rgba(59,130,246,0.0);
        }

        .cta-primary:hover {
          box-shadow:
            0 20px 38px rgba(37,99,235,0.28),
            0 0 0 8px rgba(59,130,246,0.10);
        }

        .cta-secondary {
          box-shadow: 0 8px 20px rgba(15,23,42,0.04);
        }

        .cta-secondary:hover {
          box-shadow: 0 14px 28px rgba(15,23,42,0.08);
        }

        @keyframes dashboardFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }

        @keyframes badgeFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }

        @keyframes progressEnter {
          0% { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }

        @media (min-width: 1024px) and (min-height: 740px) {
          .section-shell {
            min-height: calc(100svh - 72px);
            display: flex;
            align-items: center;
          }

          .section-shell > .container-shell {
            width: min(100%, var(--container-max));
          }

          .homepage {
            scroll-padding-top: 72px;
          }
        }

        @media (max-height: 760px) and (min-width: 1024px) {
          .homepage {
            --section-y: 32px;
          }

          .hero-shell {
            min-height: auto;
            padding-block: 28px 36px;
          }

          .values-phone-panel {
            min-height: 440px;
          }

          .values-phone-device {
            width: min(220px, 70vw);
          }
        }

        @media (max-width: 1279px) {
          .interactive-card {
            transform: none !important;
          }

          .pointer-shine {
            display: none;
          }
        }

        @media (max-width: 1023px) {
          .homepage {
            --container-px: 18px;
            --section-y: 44px;
          }

          .section-heading {
            margin-bottom: 1.75rem;
          }

          .hero-layout {
            gap: 2rem;
          }

          .values-phone-panel {
            min-height: auto;
            padding-top: 0.5rem;
          }

        }

        @media (max-width: 639px) {
          .cursor-orb {
            display: none !important;
          }

          .section-shell {
            padding-block: 36px;
          }

          .hero-shell {
            min-height: auto;
            padding-block: 28px 42px;
          }

          .hero-spot {
            display: none;
          }

          .dashboard-wrap {
            animation: none;
          }

          .values-phone-device {
            width: min(235px, 78vw);
          }

          .values-phone-caption {
            width: min(100%, 290px);
            align-items: flex-start;
          }

        }

        @media (prefers-reduced-motion: reduce) {
          .dashboard-float,
          .floating-badge,
          .progress-blue,
          .split-char {
            animation: none !important;
          }

          .hero-grid,
          .hero-spot,
          .hero-layout > div:first-child,
          .dashboard-wrap,
          .cta-primary,
          .cta-secondary,
          .cta-primary::before,
          .cta-secondary::before,
          .interactive-card,
          .hero-stat-card,
          .plan-task,
          .premium-card,
          .feature-card,
          .service-card,
          .testimonial-card,
          .mini-value-card {
            transition: none !important;
            transform: none !important;
          }

          .reveal,
          .reveal-up,
          .reveal-scale,
          .reveal-left,
          .reveal-right {
            opacity: 1 !important;
            transform: none !important;
            filter: none !important;
            animation: none !important;
            transition: none !important;
          }

          .pointer-shine,
          .hero-spot {
            display: none !important;
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
