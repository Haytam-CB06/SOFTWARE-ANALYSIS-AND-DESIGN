import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { Button } from '../../components/ui/button';
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
} from 'lucide-react';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { useTranslation } from 'react-i18next';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  const { t } = useTranslation();
  const pageRef = useRef<HTMLDivElement>(null);
  const cursorOrbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const page = pageRef.current;
      const orb = cursorOrbRef.current;
      if (!page || !orb) return;

      const x = event.clientX;
      const y = event.clientY;

      page.style.setProperty('--cursor-x', `${x}px`);
      page.style.setProperty('--cursor-y', `${y}px`);
      orb.style.transform = `translate3d(${x - 110}px, ${y - 110}px, 0)`;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, []);

  const handleInteractiveMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;

    target.style.setProperty('--px', `${px}`);
    target.style.setProperty('--py', `${py}`);
  };

  const handleInteractiveLeave = (event: ReactPointerEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    target.style.setProperty('--px', '0.5');
    target.style.setProperty('--py', '0.5');
  };

  const interactiveCardProps = {
    onPointerMove: handleInteractiveMove,
    onPointerLeave: handleInteractiveLeave,
  };

  const features = [
    {
      icon: Calendar,
      title: t('homepage.features.smartScheduling.title'),
      description: t('homepage.features.smartScheduling.description'),
    },
    {
      icon: Clock,
      title: t('homepage.features.timeManagement.title'),
      description: t('homepage.features.timeManagement.description'),
    },
    {
      icon: BarChart3,
      title: t('homepage.features.progressTracking.title'),
      description: t('homepage.features.progressTracking.description'),
    },
    {
      icon: Brain,
      title: t('homepage.features.aiPowered.title'),
      description: t('homepage.features.aiPowered.description'),
    },
    {
      icon: BookOpen,
      title: t('homepage.features.subjectBalance.title'),
      description: t('homepage.features.subjectBalance.description'),
    },
    {
      icon: Sparkles,
      title: t('homepage.features.adaptiveLearning.title'),
      description: t('homepage.features.adaptiveLearning.description'),
    },
  ];

  const floatingFeatureBubbles = [
    {
      icon: Brain,
      label: t('homepage.features.aiPowered.title'),
      className: 'bubble-pos-1',
    },
    {
      icon: Calendar,
      label: t('homepage.features.smartScheduling.title'),
      className: 'bubble-pos-2',
    },
    {
      icon: BarChart3,
      label: t('homepage.features.progressTracking.title'),
      className: 'bubble-pos-3',
    },
    {
      icon: Sparkles,
      label: t('homepage.features.adaptiveLearning.title'),
      className: 'bubble-pos-4',
    },
  ];

  const services = [
    {
      icon: Calendar,
      title: t('homepage.services.smartTimetableGeneration.title'),
      description: t('homepage.services.smartTimetableGeneration.description'),
      features: [
        t('homepage.services.smartTimetableGeneration.features.conflictFreeScheduling'),
        t('homepage.services.smartTimetableGeneration.features.priorityBasedPlanning'),
        t('homepage.services.smartTimetableGeneration.features.customizableStudyBlocks'),
        t('homepage.services.smartTimetableGeneration.features.exportToCalendarApps'),
      ],
    },
    {
      icon: RefreshCw,
      title: t('homepage.services.adaptiveUpdates.title'),
      description: t('homepage.services.adaptiveUpdates.description'),
      features: [
        t('homepage.services.adaptiveUpdates.features.realTimeRescheduling'),
        t('homepage.services.adaptiveUpdates.features.automaticDeadlineAdjustments'),
        t('homepage.services.adaptiveUpdates.features.flexibleSessionManagement'),
        t('homepage.services.adaptiveUpdates.features.smartRecoveryPlanning'),
      ],
    },
    {
      icon: TrendingUp,
      title: t('homepage.services.progressTracking.title'),
      description: t('homepage.services.progressTracking.description'),
      features: [
        t('homepage.services.progressTracking.features.dailyStudyLogs'),
        t('homepage.services.progressTracking.features.weeklyProgressReports'),
        t('homepage.services.progressTracking.features.achievementBadges'),
        t('homepage.services.progressTracking.features.productivityInsights'),
      ],
    },
    {
      icon: Clock,
      title: t('homepage.services.examClassIntegration.title'),
      description: t('homepage.services.examClassIntegration.description'),
      features: [
        t('homepage.services.examClassIntegration.features.calendarSynchronization'),
        t('homepage.services.examClassIntegration.features.examCountdownTimers'),
        t('homepage.services.examClassIntegration.features.classConflictDetection'),
        t('homepage.services.examClassIntegration.features.automaticBufferTimes'),
      ],
    },
  ];

  const stats = [
    { number: '10K+', label: t('homepage.stats.activeStudents') },
    { number: '2M+', label: t('homepage.stats.hoursPlanned') },
    { number: '98%', label: t('homepage.stats.successRate') },
    { number: '4.6', label: t('homepage.stats.averageRating') },
  ];

  const collaborationFeatures = [
    {
      icon: Users,
      title: t('homepage.collaborationFeatures.teamCollaborationWorkspaces.title'),
      description: t('homepage.collaborationFeatures.teamCollaborationWorkspaces.description'),
    },
    {
      icon: Share2,
      title: t('homepage.collaborationFeatures.smartMemberSharing.title'),
      description: t('homepage.collaborationFeatures.smartMemberSharing.description'),
    },
    {
      icon: MessageSquare,
      title: t('homepage.collaborationFeatures.integratedTeamChat.title'),
      description: t('homepage.collaborationFeatures.integratedTeamChat.description'),
    },
    {
      icon: Layers,
      title: t('homepage.collaborationFeatures.hierarchicalSubworkspaces.title'),
      description: t('homepage.collaborationFeatures.hierarchicalSubworkspaces.description'),
    },
    {
      icon: BarChart3,
      title: t('homepage.collaborationFeatures.teamProgressDashboard.title'),
      description: t('homepage.collaborationFeatures.teamProgressDashboard.description'),
    },
    {
      icon: Settings,
      title: t('homepage.collaborationFeatures.workspaceCustomization.title'),
      description: t('homepage.collaborationFeatures.workspaceCustomization.description'),
    },
  ];

  const testimonials = [
    {
      name: 'Emily Rodriguez',
      role: t('homepage.testimonials.emily.role'),
      university: 'MIT',
      rating: 5,
      text: t('homepage.testimonials.emily.text'),
      highlight: t('homepage.testimonials.emily.highlight'),
    },
    {
      name: 'James Chen',
      role: t('homepage.testimonials.james.role'),
      university: 'Stanford University',
      rating: 5,
      text: t('homepage.testimonials.james.text'),
      highlight: t('homepage.testimonials.james.highlight'),
    },
    {
      name: 'Sophia Williams',
      role: t('homepage.testimonials.sophia.role'),
      university: 'Harvard Medical School',
      rating: 5,
      text: t('homepage.testimonials.sophia.text'),
      highlight: t('homepage.testimonials.sophia.highlight'),
    },
  ];

  const values = [
    {
      icon: Target,
      title: t('homepage.values.vision.title'),
      description: t('homepage.values.vision.description'),
    },
    {
      icon: Users,
      title: t('homepage.values.team.title'),
      description: t('homepage.values.team.description'),
    },
    {
      icon: Lightbulb,
      title: t('homepage.values.innovation.title'),
      description: t('homepage.values.innovation.description'),
    },
    {
      icon: Heart,
      title: t('homepage.values.studentFirst.title'),
      description: t('homepage.values.studentFirst.description'),
    },
  ];

  const quickBenefits = [
    t('homepage.hero.cards.autoTimetables.title'),
    t('homepage.hero.cards.deadlineAware.title'),
    t('homepage.hero.cards.flexible.title'),
  ];

  const trustPoints = [
    t('homepage.stats.activeStudents'),
    t('homepage.stats.hoursPlanned'),
    t('homepage.stats.successRate'),
  ];

  return (
    <div
      ref={pageRef}
      className="homepage min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100"
    >
      <div ref={cursorOrbRef} aria-hidden="true" className="cursor-orb hidden xl:block" />

      <section className="hero-shell relative overflow-hidden border-b border-slate-200 dark:border-slate-800">
        <div className="hero-grid absolute inset-0" />
        <div className="hero-spot absolute inset-0" />

        <div className="container-shell relative">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold tracking-wide text-slate-900 dark:text-white">
                  AI Study Planner
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{t('homepage.hero.badge')}</div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            </div>
          </div>

          <div className="hero-layout">
            <div className="max-w-3xl">
              <div className="fade-in-up inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold tracking-[0.12em] text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300">
                <ShieldCheck className="h-4 w-4" />
                <span>{t('homepage.hero.badge')}</span>
              </div>

              <h1 className="fade-in-up-delay mt-6 text-balance text-4xl font-bold leading-tight tracking-[-0.05em] text-slate-900 dark:text-white sm:text-5xl xl:text-6xl">
                <span className="block">{t('homepage.hero.titleLine1')}</span>
                <span className="mt-2 block text-slate-600 dark:text-slate-300">
                  {t('homepage.hero.titleLine2')}
                </span>
              </h1>

              <p className="fade-in-up-delay-2 mt-6 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
                {t('homepage.hero.description1')}
              </p>

              <p className="fade-in-up-delay-3 mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400 sm:text-base">
                {t('homepage.hero.description2')}
              </p>

              <div className="fade-in-up-delay-4 mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="group h-12 rounded-2xl bg-blue-600 px-8 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition-all duration-300 hover:-translate-y-1 hover:bg-blue-700 sm:text-base"
                  onClick={() => onNavigate('auth')}
                >
                  {t('homepage.hero.getStarted')}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-2xl border-slate-300 bg-white px-8 text-sm font-semibold text-slate-700 transition-all duration-300 hover:-translate-y-1 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 sm:text-base"
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <PlayCircle className="mr-2 h-4 w-4" />
                  {t('homepage.hero.seeFeatures')}
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap gap-2">
                {quickBenefits.map((benefit, index) => (
                  <div
                    key={benefit}
                    className="fade-in-up rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 sm:text-sm"
                    style={{ animationDelay: `${index * 120}ms` }}
                  >
                    <span className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-500 dark:text-slate-400">
                {trustPoints.map((item) => (
                  <div key={item} className="inline-flex items-center gap-2">
                    <Star className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mx-auto w-full max-w-[460px] xl:max-w-[500px]">
              <div className="dashboard-wrap">
                <div className="floating-badge left-[-16px] top-8 hidden 2xl:block">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    {t('homepage.mockup.thisWeek')}
                  </div>
                  <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">+24%</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{t('homepage.stats.successRate')}</div>
                </div>

                <div className="floating-badge right-[-14px] bottom-12 hidden 2xl:block">
                  <div className="flex items-center gap-2">
                    <LineChart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-slate-800 dark:text-white">
                      {t('homepage.mockup.organizedAutomatically')}
                    </span>
                  </div>
                </div>

                {floatingFeatureBubbles.map((bubble, index) => {
                  const Icon = bubble.icon;
                  return (
                    <div
                      key={bubble.label}
                      className={`feature-bubble ${bubble.className} hidden lg:flex`}
                      style={{ animationDelay: `${index * 1.2}s` }}
                    >
                      <div className="feature-bubble-icon">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="feature-bubble-label">{bubble.label}</span>
                    </div>
                  );
                })}

                <div className="dashboard-shell">
                  <div className="dashboard-header">
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        {t('homepage.mockup.todayPlan')}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {t('homepage.mockup.organizedAutomatically')}
                      </div>
                    </div>
                    <div className="rounded-xl bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                      {t('homepage.mockup.smart')}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="plan-task">
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          {t('homepage.mockup.mathRevision')}
                        </div>
                        <div className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                          08:00 - 09:30
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                        <div className="progress-blue w-3/4" />
                      </div>
                      <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        {t('homepage.mockup.priorityHigh')}
                      </div>
                    </div>

                    <div className="plan-task">
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          {t('homepage.mockup.physicsQuizPrep')}
                        </div>
                        <div className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                          11:00 - 12:00
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                        <div className="progress-blue w-1/2" />
                      </div>
                      <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        {t('homepage.mockup.deadlineTomorrow')}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">
                          {t('homepage.mockup.thisWeek')}
                        </div>
                        <FolderKanban className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <div className="small-stat">
                          <div className="text-lg font-bold text-slate-900 dark:text-white">12</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {t('homepage.mockup.sessions')}
                          </div>
                        </div>
                        <div className="small-stat">
                          <div className="text-lg font-bold text-slate-900 dark:text-white">3</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {t('homepage.mockup.deadlines')}
                          </div>
                        </div>
                        <div className="small-stat">
                          <div className="text-lg font-bold text-slate-900 dark:text-white">8h</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {t('homepage.mockup.planned')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
                  {t('homepage.mockup.phoneFirst')}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-14 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="hero-stat-card fade-in-up"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <div className="text-2xl font-bold tracking-[-0.03em] text-slate-900 dark:text-white sm:text-3xl">
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

      <section id="about" className="section-shell">
        <div className="container-shell">
          <div className="section-heading">
            <div className="section-pill">{t('homepage.about.title')}</div>
            <h2 className="section-title">{t('homepage.about.subtitle')}</h2>
          </div>

          <div className="content-grid">
            <div>
              <h3 className="text-2xl font-bold tracking-[-0.03em] text-slate-900 dark:text-white sm:text-4xl">
                {t('homepage.about.missionTitle')}
              </h3>
              <p className="mt-5 text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
                {t('homepage.about.missionParagraph1')}
              </p>
              <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
                {t('homepage.about.missionParagraph2')}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="rounded-2xl bg-blue-600 px-7 text-white transition-all duration-300 hover:-translate-y-1 hover:bg-blue-700"
                  onClick={() => onNavigate('auth')}
                >
                  {t('homepage.about.startJourney')}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-2xl border-slate-300 bg-white px-7 text-slate-700 transition-all duration-300 hover:-translate-y-1 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  {t('homepage.hero.seeFeatures')}
                </Button>
              </div>
            </div>

            <div
              className="interactive-card overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-3 shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900"
              {...interactiveCardProps}
            >
              <div className="pointer-shine" />
              <div className="overflow-hidden rounded-[1.5rem]">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1760351065294-b069f6bcadc4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200"
                  alt={t('homepage.about.studentsStudyingTogetherAlt')}
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
                />
              </div>
            </div>
          </div>

          <div className="mt-20">
            <div className="section-heading">
              <h3 className="section-title">{t('homepage.values.title')}</h3>
              <p className="section-subtitle">{t('homepage.values.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6">
              {values.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="interactive-card premium-card" {...interactiveCardProps}>
                    <div className="pointer-shine" />
                    <div className="premium-icon">
                      <Icon className="h-7 w-7" />
                    </div>
                    <h4 className="text-center text-lg font-semibold text-slate-900 dark:text-white">
                      {item.title}
                    </h4>
                    <p className="mt-2 text-center text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="section-shell border-y border-slate-200 dark:border-slate-800">
        <div className="container-shell">
          <div className="section-heading">
            <div className="section-pill">{t('homepage.featuresSection.title')}</div>
            <p className="section-subtitle">{t('homepage.featuresSection.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="interactive-card feature-card fade-in-up"
                  style={{ animationDelay: `${index * 80}ms` }}
                  {...interactiveCardProps}
                >
                  <div className="pointer-shine" />
                  <div className="mb-5 inline-flex items-center justify-center rounded-2xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">{feature.title}</h3>
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="services" className="section-shell">
        <div className="container-shell">
          <div className="section-heading">
            <div className="section-pill">{t('homepage.servicesSection.title')}</div>
            <p className="section-subtitle">{t('homepage.servicesSection.subtitle')}</p>
          </div>

          <div className="grid grid-cols-2 gap-6 xl:grid-cols-2 xl:gap-8">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.title}
                  className="interactive-card service-card fade-in-up"
                  style={{ animationDelay: `${index * 90}ms` }}
                  {...interactiveCardProps}
                >
                  <div className="pointer-shine" />
                  <div className="p-6 sm:p-8">
                    <div className="mb-5 flex items-start gap-4">
                      <div className="rounded-2xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold tracking-[-0.02em] text-slate-900 dark:text-white sm:text-2xl">
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

          <div className="mt-16 text-center">
            <div className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-2xl font-bold tracking-[-0.03em] text-slate-900 dark:text-white sm:text-3xl">
                {t('homepage.servicesSection.ctaTitle')}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
                {t('homepage.servicesSection.ctaDescription')}
              </p>
              <Button
                size="lg"
                className="mt-6 h-12 rounded-2xl bg-blue-600 px-8 text-base text-white transition-all duration-300 hover:-translate-y-1 hover:bg-blue-700"
                onClick={() => onNavigate('auth')}
              >
                {t('homepage.servicesSection.startNow')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell border-y border-slate-200 dark:border-slate-800">
        <div className="container-shell">
          <div className="section-heading">
            <div className="section-pill">{t('homepage.collaborationSection.badge')}</div>
            <h2 className="section-title">{t('homepage.collaborationSection.title')}</h2>
            <p className="section-subtitle">{t('homepage.collaborationSection.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {collaborationFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="interactive-card feature-card fade-in-up"
                  style={{ animationDelay: `${index * 80}ms` }}
                  {...interactiveCardProps}
                >
                  <div className="pointer-shine" />
                  <div className="mb-5 inline-flex items-center justify-center rounded-2xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">{feature.title}</h3>
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-shell">
        <div className="container-shell">
          <div className="section-heading">
            <div className="section-pill">{t('homepage.testimonialsSection.badge')}</div>
            <h2 className="section-title">{t('homepage.testimonialsSection.title')}</h2>
            <p className="section-subtitle">{t('homepage.testimonialsSection.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div
                key={`${testimonial.name}-${testimonial.university}`}
                className="interactive-card testimonial-card fade-in-up"
                style={{ animationDelay: `${index * 70}ms` }}
                {...interactiveCardProps}
              >
                <div className="pointer-shine" />
                <div className="mb-4 flex items-center gap-1.5">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Award key={i} className="h-4 w-4 fill-blue-500 text-blue-500" />
                  ))}
                </div>

                <p className="mb-4 text-sm leading-7 text-slate-700 dark:text-slate-300">“{testimonial.text}”</p>

                <div className="mb-5 inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300">
                  {testimonial.highlight}
                </div>

                <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{testimonial.name}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{testimonial.role}</p>
                  <p className="mt-1 text-xs font-medium text-blue-600 dark:text-blue-400">{testimonial.university}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-shell border-y border-slate-200 dark:border-slate-800">
        <div className="container-shell">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {stats.map((stat, index) => (
              <div
                key={`${stat.label}-banner`}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center shadow-sm fade-in-up dark:border-slate-800 dark:bg-slate-900"
                style={{ animationDelay: `${index * 110}ms` }}
              >
                <div className="text-3xl font-bold tracking-[-0.03em] text-slate-900 dark:text-white sm:text-5xl">
                  {stat.number}
                </div>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-shell">
        <div className="container-shell text-center">
          <div
            className="interactive-card mx-auto max-w-4xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_18px_50px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900"
            {...interactiveCardProps}
          >
            <div className="pointer-shine" />
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
              <Zap className="h-7 w-7" />
            </div>

            <h2 className="text-4xl font-bold tracking-[-0.04em] text-slate-900 dark:text-white sm:text-5xl">
              {t('homepage.finalCta.title')}
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              {t('homepage.finalCta.description')}
            </p>

            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                className="group rounded-2xl bg-blue-600 px-8 py-4 text-base font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-blue-700"
                onClick={() => onNavigate('auth')}
              >
                {t('homepage.finalCta.startFreeTrial')}
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="rounded-2xl border-2 border-blue-600 bg-white px-8 py-4 text-base font-semibold text-blue-600 transition-all duration-300 hover:-translate-y-1 hover:bg-blue-50 dark:border-blue-400 dark:bg-slate-900 dark:text-blue-400 dark:hover:bg-slate-800"
              >
                {t('homepage.finalCta.bookDemo')}
              </Button>
            </div>

            <p className="mt-8 text-sm text-slate-500 dark:text-slate-400">{t('homepage.finalCta.footer')}</p>
          </div>
        </div>
      </section>

      <style>{`
        .homepage {
          --cursor-x: 50vw;
          --cursor-y: 18vh;
        }

        .container-shell {
          width: 100%;
          max-width: 1280px;
          margin-inline: auto;
          padding-inline: 1rem;
        }

        @media (min-width: 640px) {
          .container-shell {
            padding-inline: 1.5rem;
          }
        }

        @media (min-width: 1024px) {
          .container-shell {
            padding-inline: 2rem;
          }
        }

        .section-shell {
          position: relative;
          padding-block: clamp(4rem, 7vw, 6rem);
        }

        .hero-shell {
          position: relative;
          padding-block: clamp(2rem, 4vw, 3rem) clamp(4.5rem, 8vw, 6.5rem);
          background: linear-gradient(to bottom, rgba(255,255,255,0.98), rgba(248,250,252,0.98));
        }

        .dark .hero-shell {
          background: linear-gradient(to bottom, rgba(2,6,23,0.98), rgba(15,23,42,0.98));
        }

        .hero-layout {
          display: grid;
          gap: 2.75rem;
          align-items: center;
        }

        @media (min-width: 1024px) {
          .hero-layout {
            grid-template-columns: minmax(0, 1.05fr) minmax(420px, 0.95fr);
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
            gap: 3.25rem;
          }
        }

        .section-heading {
          margin-bottom: 3rem;
          text-align: center;
        }

        .section-title {
          margin-top: 1.25rem;
          font-size: clamp(1.875rem, 4vw, 3rem);
          line-height: 1.05;
          font-weight: 700;
          letter-spacing: -0.03em;
          color: rgb(15 23 42);
        }

        .dark .section-title {
          color: white;
        }

        .section-subtitle {
          margin-inline: auto;
          margin-top: 1rem;
          max-width: 42rem;
          font-size: 1rem;
          line-height: 1.75rem;
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
  z-index: 10;
  transition: transform 120ms linear;
  filter: blur(60px);

  /* Light mode */
  background: radial-gradient(
    circle,
    rgba(37, 99, 235, 0.12) 0%,
    rgba(37, 99, 235, 0.06) 40%,
    transparent 75%
  );
}

.dark .cursor-orb {
  /* Dark mode (stronger but still soft) */
  background: radial-gradient(
    circle,
    rgba(59, 130, 246, 0.18) 0%,
    rgba(59, 130, 246, 0.10) 40%,
    transparent 75%
  );
}

        .hero-grid {
          background-image:
            linear-gradient(rgba(96, 106, 121, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148,163,184,0.10) 1px, transparent 1px);
          background-size: 34px 34px;
          mask-image: linear-gradient(to bottom, rgba(0,0,0,0.95), rgba(0,0,0,0.5));
          -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,0.95), rgba(0,0,0,0.5));
        }

        .dark .hero-grid {
          background-image:
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
        }

        .hero-spot {
          pointer-events: none;
          background: radial-gradient(
            260px circle at var(--cursor-x) var(--cursor-y),
            rgba(59,130,246,0.10),
            transparent 70%
          );
        }

        .hero-mini-card {
          border: 1px solid rgb(226 232 240);
          background: white;
          padding: 1rem;
          border-radius: 1rem;
          box-shadow: 0 1px 2px rgba(15,23,42,0.04);
          transition: transform 300ms ease, box-shadow 300ms ease, border-color 300ms ease;
        }

        .hero-mini-card:hover {
          transform: translateY(-4px);
          border-color: rgb(191 219 254);
          box-shadow: 0 14px 34px rgba(15,23,42,0.08);
        }

        .dark .hero-mini-card {
          border-color: rgb(30 41 59);
          background: rgb(15 23 42);
        }

        .dashboard-wrap {
          position: relative;
          animation: dashboardFloat 7s ease-in-out infinite;
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

        .feature-bubble {
          position: absolute;
          z-index: 3;
          align-items: center;
          gap: 0.55rem;
          min-height: 3.25rem;
          padding: 0.5rem 0.85rem 0.5rem 0.55rem;
          border-radius: 9999px;
          border: 1px solid rgba(226, 232, 240, 0.92);
          background: rgba(255, 255, 255, 0.88);
          box-shadow: 0 16px 36px rgba(15, 23, 42, 0.08);
          backdrop-filter: blur(12px);
          animation: featureBubbleFloat 7s ease-in-out infinite;
          white-space: nowrap;
        }

        .dark .feature-bubble {
          border-color: rgba(51, 65, 85, 0.85);
          background: rgba(15, 23, 42, 0.82);
          box-shadow: 0 16px 40px rgba(2, 6, 23, 0.28);
        }

        .feature-bubble-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 2.15rem;
          height: 2.15rem;
          border-radius: 9999px;
          background: rgba(37, 99, 235, 0.08);
          color: rgb(37 99 235);
          flex-shrink: 0;
        }

        .dark .feature-bubble-icon {
          background: rgba(59, 130, 246, 0.14);
          color: rgb(147 197 253);
        }

        .feature-bubble-label {
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: -0.01em;
          color: rgb(51 65 85);
        }

        .dark .feature-bubble-label {
          color: rgb(226 232 240);
        }

        .bubble-pos-1 {
          top: -10%;
          right: -10%;
        }

        .bubble-pos-2 {
          top: 28%;
          left: -30%;
        }

        .bubble-pos-3 {
          bottom: 40%;
          right: -12%;
        }

        .bubble-pos-4 {
          bottom: 2%;
          left: -10%;
        }

        .dashboard-shell {
          border-radius: 2rem;
          border: 1px solid rgb(226 232 240);
          background: white;
          padding: 0.9rem;
          box-shadow: 0 24px 60px rgba(15,23,42,0.10);
        }

        .dark .dashboard-shell {
          border-color: rgb(30 41 59);
          background: rgb(15 23 42);
        }

        .dashboard-header {
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .plan-task {
          border: 1px solid rgb(226 232 240);
          background: rgb(248 250 252);
          padding: 1rem;
          border-radius: 1rem;
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

        .small-stat {
          border-radius: 0.9rem;
          background: white;
          border: 1px solid rgb(226 232 240);
          padding: 0.75rem;
          text-align: center;
        }

        .dark .small-stat {
          background: rgb(15 23 42);
          border-color: rgb(30 41 59);
        }

        .hero-stat-card {
          border: 1px solid rgb(226 232 240);
          background: white;
          padding: 1rem;
          border-radius: 1rem;
          text-align: center;
          box-shadow: 0 1px 2px rgba(15,23,42,0.04);
          transition: transform 300ms ease, border-color 300ms ease, box-shadow 300ms ease;
        }

        .hero-stat-card:hover {
          transform: translateY(-4px);
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
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
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
          border-radius: 1.75rem;
          border: 1px solid rgb(226 232 240);
          background: white;
          box-shadow: 0 1px 2px rgba(15,23,42,0.04);
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
          padding: 1.5rem;
        }

        .service-card {
          border-radius: 2rem;
        }

        .premium-icon {
          margin: 0 auto 1rem;
          display: flex;
          height: 3.5rem;
          width: 3.5rem;
          align-items: center;
          justify-content: center;
          border-radius: 1rem;
          background: rgb(239 246 255);
          color: rgb(37 99 235);
          box-shadow: 0 10px 24px rgba(59,130,246,0.12);
        }

        .dark .premium-icon {
          background: rgba(30,58,138,0.25);
          color: rgb(96 165 250);
        }

        .fade-in-up {
          animation: fadeUp 700ms ease both;
        }

        .fade-in-up-delay {
          animation: fadeUp 900ms ease both;
        }

        .fade-in-up-delay-2 {
          animation: fadeUp 1050ms ease both;
        }

        .fade-in-up-delay-3 {
          animation: fadeUp 1200ms ease both;
        }

        .fade-in-up-delay-4 {
          animation: fadeUp 1350ms ease both;
        }

        @keyframes fadeUp {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes dashboardFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }

        @keyframes badgeFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }

        @keyframes featureBubbleFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }

        @keyframes progressEnter {
          0% { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }

        @media (max-width: 1279px) {
          .interactive-card {
            transform: none !important;
          }

          .pointer-shine {
            display: none;
          }
        }

        @media (max-width: 1199px) {
          .feature-bubble {
            display: none !important;
          }
        }

        @media (max-width: 1023px) {
          .section-heading {
            margin-bottom: 2.25rem;
          }

          .hero-layout {
            gap: 2rem;
          }
        }

        @media (max-width: 639px) {
          .cursor-orb {
            display: none !important;
          }

          .section-shell {
            padding-block: 4rem;
          }

          .hero-shell {
            padding-block: 1.5rem 4rem;
          }

          .hero-spot {
            display: none;
          }

          .dashboard-wrap {
            animation: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .cursor-orb,
          .dashboard-wrap,
          .floating-badge,
          .feature-bubble,
          .progress-blue,
          .fade-in-up,
          .fade-in-up-delay,
          .fade-in-up-delay-2,
          .fade-in-up-delay-3,
          .fade-in-up-delay-4 {
            animation: none !important;
          }

          .interactive-card,
          .hero-mini-card,
          .hero-stat-card,
          .plan-task {
            transition: none !important;
            transform: none !important;
          }

          .pointer-shine,
          .hero-spot {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}