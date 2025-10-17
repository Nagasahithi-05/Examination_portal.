import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Shield, Users, BarChart3, Clock, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: Shield,
      title: "Secure Proctoring",
      description: "Advanced AI-powered proctoring with real-time monitoring and violation detection."
    },
    {
      icon: Users,
      title: "Multi-Role Support",
      description: "Comprehensive role management for administrators, teachers, and students."
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Detailed performance analytics and reporting with interactive charts."
    },
    {
      icon: Clock,
      title: "Timed Exams",
      description: "Flexible timing options with automatic submission and time warnings."
    },
    {
      icon: Award,
      title: "Instant Results",
      description: "Automated grading with immediate feedback and detailed score breakdowns."
    }
  ];

  const getDashboardLink = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'teacher':
        return '/teacher/dashboard';
      case 'student':
        return '/student/dashboard';
      default:
        return '/login';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-700 to-red-800">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            {/* Graduation Cap Icon */}
            <div className="flex justify-center mb-8">
              <div className="bg-white bg-opacity-20 rounded-full p-6">
                <GraduationCap className="h-24 w-24 text-white" />
              </div>
            </div>
            
            {/* Main Title */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
              Online Examination
              <span className="block">System</span>
            </h1>
            
            {/* Description */}
            <p className="text-xl md:text-2xl text-red-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              A comprehensive and secure platform for conducting online examinations with 
              advanced proctoring, real-time monitoring, and intelligent analytics.
            </p>
            
            {/* Get Started Button */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to={user ? getDashboardLink() : '/role-selection'}
                className="bg-white text-red-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-red-50 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                {user ? 'Go to Dashboard' : 'Get Started'}
              </Link>
              
              {!user && (
                <Link
                  to="/login"
                  className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-red-600 transition-all duration-300"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white bg-opacity-10 rounded-full"></div>
          <div className="absolute top-40 right-20 w-16 h-16 bg-white bg-opacity-10 rounded-full"></div>
          <div className="absolute bottom-20 left-20 w-12 h-12 bg-white bg-opacity-10 rounded-full"></div>
          <div className="absolute bottom-40 right-10 w-24 h-24 bg-white bg-opacity-10 rounded-full"></div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need for secure, efficient, and comprehensive online examinations
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300">
                  <div className="bg-red-100 rounded-lg p-3 w-fit mb-4">
                    <IconComponent className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="bg-red-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-red-600 mb-2">10,000+</div>
              <div className="text-gray-600">Exams Conducted</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-red-600 mb-2">50,000+</div>
              <div className="text-gray-600">Students Enrolled</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-red-600 mb-2">1,000+</div>
              <div className="text-gray-600">Institutions</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-red-600 mb-2">99.9%</div>
              <div className="text-gray-600">Uptime</div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of institutions already using our platform for secure online examinations.
          </p>
          <Link
            to={user ? getDashboardLink() : '/role-selection'}
            className="bg-red-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-red-700 transition-colors duration-300"
          >
            {user ? 'Access Dashboard' : 'Start Free Trial'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;