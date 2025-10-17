import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

const RoleSelection = () => {
  const [selectedRole, setSelectedRole] = useState('');
  const [showFeatures, setShowFeatures] = useState(false);
  const navigate = useNavigate();

  const roles = [
    { value: 'admin', label: 'Admin/Educator' },
    { value: 'student', label: 'Student' }
  ];

  const adminFeatures = [
    'Create and manage examinations',
    'Monitor student progress and performance', 
    'Access advanced analytics and reports',
    'Configure proctoring settings',
    'Manage user accounts and permissions'
  ];

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    if (role === 'admin') {
      setShowFeatures(true);
    } else {
      setShowFeatures(false);
    }
  };

  const handleContinue = () => {
    if (selectedRole === 'admin') {
      navigate('/exam-creator-register');
    } else if (selectedRole === 'student') {
      navigate('/register', { state: { role: 'student' } });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="bg-red-500 rounded-full p-4 shadow-lg">
              <GraduationCap className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-red-600 mb-2">
            Select Your Role
          </h1>
          <p className="text-gray-600">
            Choose your role to access the appropriate features and dashboard
          </p>
        </div>

        {/* Role Selection Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <p className="text-center text-gray-700 font-medium mb-4">I am a:</p>
            
            <div className="relative">
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none bg-white cursor-pointer"
                value={selectedRole}
                onChange={(e) => handleRoleSelect(e.target.value)}
              >
                <option value="">Select your role...</option>
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Admin/Educator Features */}
          {showFeatures && selectedRole === 'admin' && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-3">Admin/Educator Features:</h3>
              <ul className="space-y-2">
                {adminFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start text-sm text-blue-700">
                    <span className="mr-2 mt-1">•</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            disabled={!selectedRole}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
              selectedRole
                ? selectedRole === 'admin'
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Continue
          </button>
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

export default RoleSelection;