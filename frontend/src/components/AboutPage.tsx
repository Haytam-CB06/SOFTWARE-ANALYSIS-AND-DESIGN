import { Target, Users, Lightbulb, Heart } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Button } from './ui/button';

interface AboutPageProps {
  onNavigate: (page: string) => void;
}

export default function AboutPage({ onNavigate }: AboutPageProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl mb-6">
              About Smart Studying Timetable Generator
            </h1>
            <p className="text-xl text-blue-100">
              Empowering students with intelligent time management tools
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl text-gray-900 mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-gray-700 mb-6">
                Our mission is to make studying more organized and effective for students. We built this tool to help learners automatically plan their study sessions around exams, classes, and personal availability — saving time and reducing stress.
              </p>
              <p className="text-lg text-gray-700 mb-6">
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
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl text-gray-900 mb-4">
              What We Stand For
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our core values guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-gray-900 mb-2">Vision</h3>
              <p className="text-gray-600">
                To empower every student with smart time management tools
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-gray-900 mb-2">Team</h3>
              <p className="text-gray-600">
                Developed by students passionate about learning and technology
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-gray-900 mb-2">Innovation</h3>
              <p className="text-gray-600">
                Constantly improving with cutting-edge AI and user feedback
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-gray-900 mb-2">Student-First</h3>
              <p className="text-gray-600">
                Every feature is designed with student success in mind
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-blue-50 p-8 sm:p-12 rounded-lg">
            <h2 className="text-3xl text-gray-900 mb-6 text-center">
              Our Story
            </h2>
            <p className="text-lg text-gray-700 mb-4">
              The Smart Studying Timetable Generator was born from a simple observation: students struggle to balance their academic workload with personal commitments. Traditional planners are static and don't adapt to the dynamic nature of student life.
            </p>
            <p className="text-lg text-gray-700 mb-4">
              We wanted to create something different — a tool that learns from your habits, understands your goals, and automatically adjusts when life gets in the way. Whether you're preparing for finals, juggling multiple courses, or trying to maintain a healthy work-life balance, our platform is here to help.
            </p>
            <p className="text-lg text-gray-700">
              Today, we're proud to serve thousands of students worldwide, helping them achieve their academic goals while maintaining their wellbeing. This is just the beginning — we're committed to continuous improvement and innovation.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl text-white mb-6">
            Join Our Community
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Be part of a growing community of students studying smarter
          </p>
          <Button 
            size="lg" 
            className="bg-white text-blue-600 hover:bg-blue-50"
            onClick={() => onNavigate('auth')}
          >
            Get Started Today
          </Button>
        </div>
      </section>
    </div>
  );
}
