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
      {/* HOME SECTION - Full screen hero only */}
      <section id="home" className="relative bg-gradient-to-br from-blue-600 to-indigo-700 text-white overflow-hidden min-h-screen flex items-center">
        <div className="absolute inset-0 opacity-10">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&q=80"
            alt="Student studying"
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 w-full">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl mb-6">
              Plan Smarter, Study Better.
            </h1>
            <p className="text-xl sm:text-2xl text-blue-100 mb-4">
              Automatically generate your personalized study timetable based on your goals, exams, and free time.
            </p>
            <p className="text-lg text-blue-100 mb-8">
              U PLAN helps students create optimized, flexible study plans. No more stress — just a smart way to manage your study hours efficiently.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all px-8 py-6 text-lg"
                onClick={() => onNavigate('auth')}
              >
                Get Started
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="bg-transparent text-white border-2 border-white hover:bg-white/10 px-8 py-6 text-lg"
                onClick={() => onNavigate('auth')}
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section id="about" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl text-foreground mb-6">
              About U PLAN
            </h2>
            <p className="text-xl text-muted-foreground">
              Empowering students with intelligent time management tools
            </p>
          </div>

          {/* Mission Section */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <h2 className="text-3xl sm:text-4xl text-foreground mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Our mission is to make studying more organized and effective for students. We built this tool to help learners automatically plan their study sessions around exams, classes, and personal availability — saving time and reducing stress.
              </p>
              <p className="text-lg text-muted-foreground mb-6">
                We believe that every student deserves access to tools that help them succeed. By combining smart technology with an understanding of how students learn, we've created a platform that adapts to individual needs and learning styles.
              </p>
              <Button 
                size="lg"
                onClick={() => onNavigate('auth')}
              >
                Start Your Journey
              </Button>
            </div>
            <div className="rounded-lg overflow-hidden shadow-lg">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1760351065294-b069f6bcadc4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50cyUyMHN0dWR5aW5nJTIwdG9nZXRoZXJ8ZW58MXx8fHwxNzYwNzgwMDE0fDA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Students studying together"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Values Section */}
          <div className="mb-20">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl text-foreground mb-4">
                What We Stand For
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Our core values guide everything we do
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-card p-6 rounded-lg shadow-sm text-center border border-border">
                <div className="bg-blue-100 dark:bg-blue-950/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-foreground mb-2">Vision</h3>
                <p className="text-muted-foreground">
                  To empower every student with smart time management tools
                </p>
              </div>

              <div className="bg-card p-6 rounded-lg shadow-sm text-center border border-border">
                <div className="bg-blue-100 dark:bg-blue-950/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-foreground mb-2">Team</h3>
                <p className="text-muted-foreground">
                  Developed by students passionate about learning and technology
                </p>
              </div>

              <div className="bg-card p-6 rounded-lg shadow-sm text-center border border-border">
                <div className="bg-blue-100 dark:bg-blue-950/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lightbulb className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-foreground mb-2">Innovation</h3>
                <p className="text-muted-foreground">
                  Constantly improving with cutting-edge AI and user feedback
                </p>
              </div>

              <div className="bg-card p-6 rounded-lg shadow-sm text-center border border-border">
                <div className="bg-blue-100 dark:bg-blue-950/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-foreground mb-2">Student-First</h3>
                <p className="text-muted-foreground">
                  Every feature is designed with student success in mind
                </p>
              </div>
            </div>
          </div>

          {/* Story Section */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-blue-50 dark:bg-blue-950/30 p-8 sm:p-12 rounded-lg">
              <h2 className="text-3xl text-foreground mb-6 text-center">
                Why Choose Us
              </h2>
              <p className="text-lg text-muted-foreground mb-4">
                U PLAN was born from a simple observation: students struggle to balance their academic workload with personal commitments. Traditional planners are static and don't adapt to the dynamic nature of student life.
              </p>
              <p className="text-lg text-muted-foreground mb-4">
                We wanted to create something different — a tool that learns from your habits, understands your goals, and automatically adjusts when life gets in the way. Whether you're preparing for finals, juggling multiple courses, or trying to maintain a healthy work-life balance, our platform is here to help.
              </p>
              <p className="text-lg text-muted-foreground">
                Today, we're proud to serve thousands of students worldwide, helping them achieve their academic goals while maintaining their wellbeing. This is just the beginning — we're committed to continuous improvement and innovation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES SECTION */}
      <section id="services" className="py-20 bg-accent/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl text-foreground mb-6">
              Our Services
            </h2>
            <p className="text-xl text-muted-foreground mb-12">
              Comprehensive tools to revolutionize your study experience
            </p>
          </div>

          {/* Main Services */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {services.map((service, index) => {
              const Icon = service.icon;
              const ScreenshotComponent = service.image;
              return (
                <div key={index} className="bg-card rounded-lg shadow-sm border border-border hover:shadow-md transition-shadow overflow-hidden">
                  {/* Service Screenshot */}
                  <div className="h-48 overflow-hidden">
                    <ScreenshotComponent />
                  </div>
                  
                  {/* Service Content */}
                  <div className="p-8">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="bg-blue-100 dark:bg-blue-950/30 p-3 rounded-lg">
                        <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl text-foreground mb-2">{service.title}</h3>
                      </div>
                    </div>
                    <p className="text-muted-foreground mb-4">{service.description}</p>
                    <ul className="space-y-2">
                      {service.features.map((feature, fIndex) => (
                        <li key={fIndex} className="flex items-center text-muted-foreground">
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Coming Soon */}
          <div className="mt-16">
            <h3 className="text-3xl text-foreground text-center mb-8">Access Now</h3>
            <div className="grid md:grid-cols-2 gap-8">
              {comingSoon.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="bg-card/50 p-6 rounded-lg border border-border border-dashed">
                    <div className="flex items-center gap-3 mb-3">
                      <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      <h4 className="text-xl text-foreground">{item.title}</h4>
                    </div>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <Button 
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => onNavigate('auth')}
            >
              Start now
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}