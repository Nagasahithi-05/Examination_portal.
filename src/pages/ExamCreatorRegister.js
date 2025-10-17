import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ExamCreatorRegister = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    institution: '',
    department: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.institution.trim()) {
      newErrors.institution = 'Institution is required';
    }

    if (!formData.department.trim()) {
      newErrors.department = 'Department is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    const registrationData = {
      name: formData.fullName,
      email: formData.email,
      password: formData.password,
      role: 'teacher',
      institution: formData.institution,
      department: formData.department
    };
    
    const result = await register(registrationData);
    
    if (result.success) {
      navigate('/create-exam');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/role-selection" 
            className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Role Selection
          </Link>
        </div>

        {/* Registration Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-red-500 rounded-full p-3">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-red-600 mb-2">
              Exam Creator
            </h1>
            <p className="text-gray-600 text-sm">
              Create your educator account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                placeholder="Enter your full name"
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                  errors.fullName ? 'border-red-300' : 'border-gray-300'
                }`}
                value={formData.fullName}
                onChange={handleChange}
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Institution/Organization */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Institution/Organization
              </label>
              <input
                type="text"
                name="institution"
                placeholder="Enter your institution"
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                  errors.institution ? 'border-red-300' : 'border-gray-300'
                }`}
                value={formData.institution}
                onChange={handleChange}
              />
              {errors.institution && (
                <p className="mt-1 text-sm text-red-600">{errors.institution}</p>
              )}
            </div>

            {/* Department/Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department/Subject
              </label>
              <input
                type="text"
                name="department"
                placeholder="Enter your department"
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                  errors.department ? 'border-red-300' : 'border-gray-300'
                }`}
                value={formData.department}
                onChange={handleChange}
              />
              {errors.department && (
                <p className="mt-1 text-sm text-red-600">{errors.department}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                placeholder="Create a password"
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                }`}
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm your password"
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                  errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                }`}
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
        </div>

        {/* Support Link */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Need help? Contact support at{' '}
            <a href="mailto:support@exampro.com" className="text-red-500 hover:text-red-600">
              support@exampro.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExamCreatorRegister;