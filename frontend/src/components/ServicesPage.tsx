import { Calendar, RefreshCw, TrendingUp, Clock, Sparkles, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ServicesPageProps {
  onNavigate: (page: string) => void;
}

export default function ServicesPage({ onNavigate }: ServicesPageProps) {
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
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl mb-6">
              Our Services
            </h1>
            <p className="text-xl text-blue-100">
              Comprehensive tools to revolutionize your study experience
            </p>
          </div>
        </div>
      </section>

      {/* Main Services */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl text-gray-900 mb-4">
              What We Offer
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
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
                    <div className="bg-blue-100 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                      <Icon className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-2xl sm:text-3xl text-gray-900 mb-4">
                      {service.title}
                    </h3>
                    <p className="text-lg text-gray-700 mb-6">
                      {service.description}
                    </p>
                    <ul className="space-y-3">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start">
                          <svg
                            className="w-6 h-6 text-blue-600 mr-2 flex-shrink-0"
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
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className={`${isEven ? '' : 'lg:col-start-1 lg:row-start-1'}`}>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-8 h-64 flex items-center justify-center">
                      <Icon className="w-32 h-32 text-blue-600 opacity-20" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Coming Soon Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-block bg-blue-100 text-blue-600 px-4 py-2 rounded-full mb-4">
              Coming Soon
            </div>
            <h2 className="text-3xl sm:text-4xl text-gray-900 mb-4">
              Future Features
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We're constantly innovating to bring you the best study experience
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {comingSoon.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white p-8 rounded-lg shadow-sm border-2 border-dashed border-blue-200"
                >
                  <div className="bg-gradient-to-br from-blue-100 to-indigo-100 w-16 h-16 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">
                1
              </div>
              <h3 className="text-xl text-gray-900 mb-2">Sign Up</h3>
              <p className="text-gray-600">
                Create your free account and set up your profile
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">
                2
              </div>
              <h3 className="text-xl text-gray-900 mb-2">Input Details</h3>
              <p className="text-gray-600">
                Add your courses, exams, and available study time
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">
                3
              </div>
              <h3 className="text-xl text-gray-900 mb-2">Start Studying</h3>
              <p className="text-gray-600">
                Follow your personalized timetable and track progress
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Experience the power of smart study planning today
          </p>
          <Button 
            size="lg" 
            className="bg-white text-blue-600 hover:bg-blue-50"
            onClick={() => onNavigate('auth')}
          >
            Create Your Timetable
          </Button>
        </div>
      </section>
    </div>
  );
}
