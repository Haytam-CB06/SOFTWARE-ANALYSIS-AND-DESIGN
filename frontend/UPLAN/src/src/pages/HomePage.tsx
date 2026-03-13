import { Button } from '../../components/ui/button';
import { Calendar, Clock, BarChart3, Brain, BookOpen, Sparkles, Target, Users, Lightbulb, Heart, RefreshCw, TrendingUp, Zap } from 'lucide-react';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { 
  TimetableGenerationScreenshot, 
  AdaptiveUpdatesScreenshot, 
  ProgressTrackingScreenshot, 
  ExamIntegrationScreenshot 
} from '../../components/ServiceScreenshots';
  
interface HomePageProps {
  onNavigate: (page: string) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  const features = [
    {
      icon: Calendar,
      title: 'Smart Scheduling',
      description: 'Automatically optimize your study time based on priorities and deadlines',
    },
    {
      icon: Clock,
      title: 'Time Management',
      description: 'Track your study sessions and improve productivity',
    },
    {
      icon: BarChart3,
      title: 'Progress Tracking',
      description: 'Monitor your learning journey with detailed analytics',
    },
    {
      icon: Brain,
      title: 'AI-Powered',
      description: 'Intelligent recommendations based on your study patterns',
    },
    {
      icon: BookOpen,
      title: 'Subject Balance',
      description: 'Ensure equal focus across all your courses',
    },
    {
      icon: Sparkles,
      title: 'Adaptive Learning',
      description: 'Adjusts to your pace and learning style',
    },
  ];

  const services = [
    {
      icon: Calendar,
      title: 'Smart Timetable Generation',
      description: 'Automatically create a personalized study plan based on your input (exam dates, free hours, goals, etc.). Our intelligent algorithm considers your schedule, priorities, and learning patterns to generate an optimal timetable.',
      image: TimetableGenerationScreenshot,
      features: [
        'Conflict-free scheduling',
        'Priority-based planning',
        'Customizable study blocks',
        'Export to calendar apps',
      ],
    },
    {
      icon: RefreshCw,
      title: 'Adaptive Updates',
      description: 'If you skip or complete sessions, the system adjusts your timetable automatically. Life happens — our platform understands that and makes real-time adjustments to keep you on track.',
      image: AdaptiveUpdatesScreenshot,
      features: [
        'Real-time rescheduling',
        'Automatic deadline adjustments',
        'Flexible session management',
        'Smart recovery planning',
      ],
    },
    {
      icon: TrendingUp,
      title: 'Progress Tracking',
      description: 'Track your daily and weekly study progress to stay motivated. Visualize your achievements, identify patterns, and celebrate milestones as you work towards your goals.',
      image: ProgressTrackingScreenshot,
      features: [
        'Daily study logs',
        'Weekly progress reports',
        'Achievement badges',
        'Productivity insights',
      ],
    },
    {
      icon: Clock,
      title: 'Exam & Class Integration',
      description: 'Import your exam schedule and class timetable for a conflict-free plan. Seamlessly integrate your academic calendar to ensure optimal study time distribution.',
      image: ExamIntegrationScreenshot,
      features: [
        'Calendar synchronization',
        'Exam countdown timers',
        'Class conflict detection',
        'Automatic buffer times',
      ],
    },
  ];

  const comingSoon = [
    {
      icon: Sparkles,
      title: 'AI Study Recommendations',
      description: 'Personalized study tips based on your performance and learning style',
    },
    {
      icon: Zap,
      title: 'Performance Insights',
      description: 'Advanced analytics and predictions to optimize your study efficiency',
    },
  ];

 return (
  <div className="min-h-screen bg-background">
  
      
    

    {/* HERO */}
    <section
      id="home"
      className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white"
    >
      <div className="absolute inset-0 opacity-10">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&q=80"
          alt="Student studying"
          className="h-full w-full object-cover"
        />
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_35%)]" />
      <div className="absolute inset-0 bg-black/10" />

      <div className="relative mx-auto flex min-h-[calc(100svh-65px)] max-w-7xl items-center px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
        <div className="grid w-full items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Hero copy */}
          <div className="text-center lg:text-left">
            <div className="mb-4 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-white/90 backdrop-blur sm:text-sm">
              Built for students who want clarity, not chaos
            </div>

            <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Plan smarter.
              <span className="block text-blue-100">Study with less stress.</span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-blue-100 sm:text-lg lg:mx-0">
              U PLAN automatically builds your study timetable around exams, classes,
              deadlines, and your real free time.
            </p>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80 sm:text-base lg:mx-0">
              No more guessing when to study. No more overloaded days. Just a flexible,
              personalized plan that actually works.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Button
                size="lg"
                className="h-12 rounded-2xl bg-white px-8 text-base text-blue-700 shadow-lg transition-all hover:bg-blue-50 hover:shadow-xl"
                onClick={() => onNavigate("auth")}
              >
                Get Started
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="h-12 rounded-2xl border-white/30 bg-white/10 px-8 text-base text-white backdrop-blur hover:bg-white/15"
                onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}
              >
                See Features
              </Button>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                <div className="text-lg font-semibold">Auto Timetables</div>
                <div className="mt-1 text-sm text-blue-100">Generated around your real schedule</div>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                <div className="text-lg font-semibold">Deadline Aware</div>
                <div className="mt-1 text-sm text-blue-100">Plans around exams and assignments</div>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                <div className="text-lg font-semibold">Flexible</div>
                <div className="mt-1 text-sm text-blue-100">Adjusts when life gets busy</div>
              </div>
            </div>
          </div>

          {/* Hero phone mockup */}
          <div className="mx-auto w-full max-w-sm lg:max-w-md">
            <div className="rounded-[2rem] border border-white/15 bg-white/10 p-3 shadow-2xl backdrop-blur">
              <div className="rounded-[1.6rem] bg-slate-950 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">Today’s Plan</div>
                    <div className="text-xs text-blue-100/70">Organized automatically</div>
                  </div>
                  <div className="rounded-xl bg-blue-600 px-3 py-1 text-xs font-medium text-white">
                    Smart
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-2xl bg-white/5 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-sm font-medium text-white">Math Revision</div>
                      <div className="text-xs text-blue-200">08:00 - 09:30</div>
                    </div>
                    <div className="h-2 rounded-full bg-white/10">
                      <div className="h-2 w-3/4 rounded-full bg-blue-500" />
                    </div>
                    <div className="mt-2 text-xs text-white/60">Priority: High</div>
                  </div>

                  <div className="rounded-2xl bg-white/5 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-sm font-medium text-white">Physics Quiz Prep</div>
                      <div className="text-xs text-blue-200">11:00 - 12:00</div>
                    </div>
                    <div className="h-2 rounded-full bg-white/10">
                      <div className="h-2 w-1/2 rounded-full bg-indigo-400" />
                    </div>
                    <div className="mt-2 text-xs text-white/60">Deadline tomorrow</div>
                  </div>

                  <div className="rounded-2xl bg-blue-600/20 p-4 ring-1 ring-blue-400/20">
                    <div className="text-sm font-medium text-white">This week</div>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      <div className="rounded-xl bg-white/5 p-2 text-center">
                        <div className="text-lg font-bold text-white">12</div>
                        <div className="text-[11px] text-white/60">Sessions</div>
                      </div>
                      <div className="rounded-xl bg-white/5 p-2 text-center">
                        <div className="text-lg font-bold text-white">3</div>
                        <div className="text-[11px] text-white/60">Deadlines</div>
                      </div>
                      <div className="rounded-xl bg-white/5 p-2 text-center">
                        <div className="text-lg font-bold text-white">8h</div>
                        <div className="text-[11px] text-white/60">Planned</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-4 text-center text-sm text-blue-100/90">
              Designed to feel great on your phone first.
            </p>
          </div>
        </div>
      </div>
    </section>

    {/* ABOUT */}
    <section id="about" className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center sm:mb-16">
          <h2 className="text-3xl font-bold text-foreground sm:text-5xl">About U PLAN</h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-xl">
            Helping students manage their time with clarity and confidence
          </p>
        </div>

        <div className="mb-16 grid gap-8 lg:mb-20 lg:grid-cols-2 lg:items-center lg:gap-12">
          <div className="order-2 lg:order-1">
            <h3 className="text-2xl font-bold text-foreground sm:text-4xl">Our Mission</h3>
            <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
              We created U PLAN to make studying more organized, flexible, and realistic.
              Students already have enough pressure — your planning tool should reduce stress,
              not add to it.
            </p>
            <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
              By combining smart automation with student-first design, U PLAN helps you fit
              studying around exams, classes, deadlines, and life outside school.
            </p>
            <div className="mt-6">
              <Button size="lg" className="rounded-2xl px-6" onClick={() => onNavigate("auth")}>
                Start Your Journey
              </Button>
            </div>
          </div>

          <div className="order-1 overflow-hidden rounded-3xl border bg-card shadow-lg lg:order-2">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1760351065294-b069f6bcadc4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50cyUyMHN0dWR5aW5nJTIwdG9nZXRoZXJ8ZW58MXx8fHwxNzYwNzgwMDE0fDA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Students studying together"
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <div className="mb-16 sm:mb-20">
          <div className="mb-10 text-center sm:mb-16">
            <h3 className="text-2xl font-bold text-foreground sm:text-4xl">What We Stand For</h3>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
              The principles behind every feature we build
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6">
            <div className="rounded-3xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-950/30">
                <Target className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="text-center text-lg font-semibold text-foreground">Vision</h4>
              <p className="mt-2 text-center text-sm leading-6 text-muted-foreground">
                Smart time management for every student
              </p>
            </div>

            <div className="rounded-3xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-950/30">
                <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="text-center text-lg font-semibold text-foreground">Team</h4>
              <p className="mt-2 text-center text-sm leading-6 text-muted-foreground">
                Built by people who understand student pressure firsthand
              </p>
            </div>

            <div className="rounded-3xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-950/30">
                <Lightbulb className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="text-center text-lg font-semibold text-foreground">Innovation</h4>
              <p className="mt-2 text-center text-sm leading-6 text-muted-foreground">
                Practical AI that helps students take action
              </p>
            </div>

            <div className="rounded-3xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-950/30">
                <Heart className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="text-center text-lg font-semibold text-foreground">Student-First</h4>
              <p className="mt-2 text-center text-sm leading-6 text-muted-foreground">
                Every decision is designed around real student needs
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border bg-blue-50 p-6 shadow-sm dark:bg-blue-950/20 sm:p-10">
            <h3 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
              Why Students Choose U PLAN
            </h3>
            <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
              U PLAN was built for the reality of student life: shifting deadlines, changing schedules,
              multiple subjects, and limited energy. Traditional planners don’t adapt. We do.
            </p>
            <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
              Whether you’re preparing for finals, balancing multiple courses, or trying to stay
              consistent without burning out, U PLAN helps you study with more structure and less guesswork.
            </p>
          </div>
        </div>
      </div>
    </section>

    {/* SERVICES */}
    <section id="services" className="bg-accent/20 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center sm:mb-16">
          <h2 className="text-3xl font-bold text-foreground sm:text-5xl">What You Can Do</h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-xl">
            Everything you need to plan, track, and improve your study routine
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          {services.map((service, index) => {
            const Icon = service.icon;
            const ScreenshotComponent = service.image;

            return (
              <div
                key={index}
                className="overflow-hidden rounded-3xl border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="h-48 overflow-hidden sm:h-56">
                  <ScreenshotComponent />
                </div>

                <div className="p-5 sm:p-8">
                  <div className="mb-4 flex items-start gap-4">
                    <div className="rounded-2xl bg-blue-100 p-3 dark:bg-blue-950/30">
                      <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-foreground sm:text-2xl">
                        {service.title}
                      </h3>
                    </div>
                  </div>

                  <p className="mb-5 text-sm leading-6 text-muted-foreground sm:text-base">
                    {service.description}
                  </p>

                  <ul className="space-y-2">
                    {service.features.map((feature, fIndex) => (
                      <li
                        key={fIndex}
                        className="flex items-start text-sm text-muted-foreground sm:text-base"
                      >
                        <div className="mr-3 mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Access / additional items */}
        <div className="mt-16">
          <h3 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
            Access More
          </h3>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
            {comingSoon.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="rounded-3xl border border-dashed bg-card/60 p-6 shadow-sm"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className="rounded-xl bg-blue-100 p-2.5 dark:bg-blue-950/30">
                      <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h4 className="text-lg font-semibold text-foreground">{item.title}</h4>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground sm:text-base">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-14 text-center sm:mt-16">
          <div className="mx-auto max-w-2xl rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
            <h3 className="text-2xl font-bold text-foreground sm:text-3xl">
              Ready to study with a better plan?
            </h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              Join U PLAN and turn your schedule into a realistic, personalized study system.
            </p>
            <Button
              size="lg"
              className="mt-6 h-12 rounded-2xl bg-blue-600 px-8 text-base hover:bg-blue-700"
              onClick={() => onNavigate("auth")}
            >
              Start Now
            </Button>
          </div>
        </div>
      </div>
    </section>
  </div>
);}