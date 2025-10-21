import { Button } from './ui/button';
import { Calendar, Clock, BarChart3, Brain, BookOpen, Sparkles } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

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

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 to-indigo-700 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&q=80"
            alt="Student studying"
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl mb-6">
              Plan Smarter. Study Better.
            </h1>
            <p className="text-xl sm:text-2xl text-blue-100 mb-4">
              Automatically generate your personalized study timetable based on your goals, exams, and free time.
            </p>
            <p className="text-lg text-blue-100 mb-8">
              The Smart Studying Timetable Generator helps students create optimized, flexible study plans. No more stress — just a smart way to manage your study hours efficiently.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-blue-50"
                onClick={() => onNavigate('auth')}
              >
                Get Started
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="bg-transparent text-white border-white hover:bg-white/10"
                onClick={() => onNavigate('services')}
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to make studying more organized and effective
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
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
