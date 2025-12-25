import { Button } from './ui/button';
import { Calendar, Clock, BarChart3, Brain, BookOpen, Sparkles, Target, Users, Lightbulb, Heart, RefreshCw, TrendingUp, Zap } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import timetableImage from 'figma:asset/4f862e6548475cce5869f6352f0b4a1c6377d2df.png';
import serviceImage from 'figma:asset/46b0b252038157c21ce016662fa615abc3c20802.png';
import { useState, useEffect } from 'react';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  // Dark mode is now handled in Navigation component
  
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
      features: [
        'Conflict-free scheduling',
        'Priority-based planning',
        'Customizable study blocks',
        'Export to calendar apps',
      ],
      image: serviceImage,
    },
    {
      icon: RefreshCw,
      title: 'Adaptive Updates',
      description: 'If you skip or complete sessions, the system adjusts your timetable automatically. Life happens — our platform understands that and makes real-time adjustments to keep you on track.',
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
      {/* HOME SECTION */}
      <section id="home" className="relative bg-gradient-to-br from-blue-600 to-indigo-700 text-white overflow-hidden min-h-[600px] flex items-center">
        {/* Subtle texture overlay - very minimal */}
        <div className="absolute inset-0 opacity-[0.02]">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&q=80"
            alt="Student studying"
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 w-full">
          <div className="text-center max-w-4xl mx-auto">
            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl mb-6 leading-tight">
              Plan Smarter, Study Better.
            </h1>
            
            {/* Subheading */}
            <p className="text-xl sm:text-2xl text-blue-50 mb-4 leading-relaxed">
              Automatically generate your personalized study timetable based on your goals, exams, and free time.
            </p>
            
            {/* Description */}
            <p className="text-base sm:text-lg text-blue-100 mb-10 max-w-3xl mx-auto leading-relaxed">
              U PLAN helps students create optimized, flexible study plans. No more stress — just a smart way to manage your study hours efficiently.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
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
                className="bg-transparent text-white border-2 border-blue-300 hover:bg-blue-500/20 px-8 py-6 text-lg transition-all"
                onClick={() => {
                  document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
                }}
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
                Our Story
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
          <div className="mb-20">
            <div className="text-center mb-16">
              <h3 className="text-3xl sm:text-4xl text-foreground mb-4">
                What We Offer
              </h3>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Everything you need to master your study schedule and achieve academic success
              </p>
            </div>

            <div className="space-y-16">
              {services.map((service, index) => {
                const Icon = service.icon;
                const isEven = index % 2 === 0;
                
                return (
                  <div
                    key={index}
                    className={`grid lg:grid-cols-2 gap-8 lg:gap-12 items-center ${
                      !isEven ? 'lg:grid-flow-dense' : ''
                    }`}
                  >
                    <div className={isEven ? '' : 'lg:col-start-2'}>
                      <div className="bg-blue-100 dark:bg-blue-950/30 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                        <Icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h4 className="text-2xl sm:text-3xl text-foreground mb-4">
                        {service.title}
                      </h4>
                      <p className="text-lg text-muted-foreground mb-6">
                        {service.description}
                      </p>
                      <ul className="space-y-3">
                        {service.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start">
                            <svg
                              className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-2 flex-shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            <span className="text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className={`${isEven ? '' : 'lg:col-start-1 lg:row-start-1'}`}>
                      {service.image ? (
                        <div className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-lg border border-border h-64 lg:h-80">
                          <img 
                            src={service.image} 
                            alt={service.title}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg p-8 h-64 flex items-center justify-center border border-border">
                          <Icon className="w-32 h-32 text-blue-600 dark:text-blue-400 opacity-20" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Coming Soon Section */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <div className="inline-block bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-full mb-4">
                Coming Soon
              </div>
              <h3 className="text-3xl sm:text-4xl text-foreground mb-4">
                Future Features
              </h3>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                We're constantly innovating to bring you the best study experience
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {comingSoon.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="bg-card p-8 rounded-lg shadow-sm border-2 border-dashed border-blue-200 dark:border-blue-800"
                  >
                    <div className="bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-950/30 dark:to-indigo-950/30 w-16 h-16 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h4 className="text-xl text-foreground mb-2">
                      {feature.title}
                    </h4>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* How It Works */}
          <div>
            <div className="text-center mb-16">
              <h3 className="text-3xl sm:text-4xl text-foreground mb-4">
                How It Works
              </h3>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Get started in three simple steps
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">
                  1
                </div>
                <h4 className="text-xl text-foreground mb-2">Sign Up</h4>
                <p className="text-muted-foreground">
                  Create your free account and set up your profile
                </p>
              </div>

              <div className="text-center">
                <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">
                  2
                </div>
                <h4 className="text-xl text-foreground mb-2">Input Details</h4>
                <p className="text-muted-foreground">
                  Add your courses, exams, and available study time
                </p>
              </div>

              <div className="text-center">
                <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">
                  3
                </div>
                <h4 className="text-xl text-foreground mb-2">Start Studying</h4>
                <p className="text-muted-foreground">
                  Follow your personalized timetable and track progress
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl text-white mb-6">
            Ready to Transform Your Study Routine?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of students who are studying smarter, not harder.
          </p>
          <Button 
            size="lg" 
            className="bg-white text-blue-600 hover:bg-blue-50"
            onClick={() => onNavigate('auth')}
          >
            Generate My Timetable
          </Button>
        </div>
      </section>
    </div>
  );
}