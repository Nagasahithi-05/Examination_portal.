// API Configuration and Service Functions
const API_BASE_URL = 'http://localhost:5001/api';

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log('🔄 Making API request to:', url);
  console.log('🔄 Request options:', options);
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add auth token if available
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  try {
    console.log('🔄 Sending request with config:', config);
    const response = await fetch(url, config);
    console.log('✅ Response received:', response.status, response.statusText);
    
    const data = await response.json();
    console.log('✅ Response data:', data);

    if (!response.ok) {
      console.error('❌ API Error:', response.status, data.message);
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  } catch (error) {
    console.error('❌ API Request failed:', error);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

// Authentication APIs
export const authAPI = {
  // Register new user
  register: async (userData) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role,
        institution: userData.institution,
        department: userData.department
      }),
    });
  },

  // Login user
  login: async (credentials) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
    });
  },

  // Get current user profile
  getProfile: async () => {
    return apiRequest('/auth/me');
  },

  // Logout user
  logout: async () => {
    return apiRequest('/auth/logout', {
      method: 'POST',
    });
  },
};

// Exam APIs
export const examAPI = {
  // Get all exams
  getExams: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/exams?${queryString}`);
  },

  // Get exam by ID
  getExamById: async (examId) => {
    return apiRequest(`/exams/${examId}`);
  },

  // Get exam by access code
  getExamByCode: async (accessCode) => {
    return apiRequest(`/exams/code/${accessCode}`);
  },

  // Create new exam
  createExam: async (examData) => {
    return apiRequest('/exams', {
      method: 'POST',
      body: JSON.stringify(examData),
    });
  },

  // Update exam
  updateExam: async (examId, examData) => {
    return apiRequest(`/exams/${examId}`, {
      method: 'PUT',
      body: JSON.stringify(examData),
    });
  },

  // Delete exam
  deleteExam: async (examId) => {
    return apiRequest(`/exams/${examId}`, {
      method: 'DELETE',
    });
  },

  // Publish exam
  publishExam: async (examId) => {
    return apiRequest(`/exams/${examId}/publish`, {
      method: 'PATCH',
    });
  },
};

// Question APIs
export const questionAPI = {
  // Get questions for an exam
  getQuestionsByExam: async (examId) => {
    return apiRequest(`/questions/exam/${examId}`);
  },

  // Create new question
  createQuestion: async (questionData) => {
    return apiRequest('/questions', {
      method: 'POST',
      body: JSON.stringify(questionData),
    });
  },

  // Update question
  updateQuestion: async (questionId, questionData) => {
    return apiRequest(`/questions/${questionId}`, {
      method: 'PUT',
      body: JSON.stringify(questionData),
    });
  },

  // Delete question
  deleteQuestion: async (questionId) => {
    return apiRequest(`/questions/${questionId}`, {
      method: 'DELETE',
    });
  },
};

// Submission APIs
export const submissionAPI = {
  // Submit exam answers
  submitExam: async (submissionData) => {
    return apiRequest('/submissions', {
      method: 'POST',
      body: JSON.stringify(submissionData),
    });
  },

  // Create submission (alias for submitExam for backward compatibility)
  createSubmission: async (submissionData) => {
    return apiRequest('/submissions', {
      method: 'POST',
      body: JSON.stringify(submissionData),
    });
  },

  // Get submissions for an exam
  getSubmissionsByExam: async (examId) => {
    return apiRequest(`/submissions/exam/${examId}`);
  },

  // Get student's submissions
  getMySubmissions: async () => {
    return apiRequest('/submissions/my');
  },

  // Get submission by ID
  getSubmissionById: async (submissionId) => {
    return apiRequest(`/submissions/${submissionId}`);
  },

  // Get recent submissions for teacher
  getTeacherRecentSubmissions: async (limit = 10) => {
    return apiRequest(`/submissions/teacher/recent?limit=${limit}`);
  },

  // Get teacher statistics
  getTeacherStats: async () => {
    return apiRequest('/submissions/teacher/stats');
  },
};

// User APIs
export const userAPI = {
  // Get all users (admin only)
  getUsers: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/users?${queryString}`);
  },

  // Get user by ID
  getUserById: async (userId) => {
    return apiRequest(`/users/${userId}`);
  },

  // Update user profile
  updateProfile: async (userData) => {
    return apiRequest('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  // Delete user (admin only)
  deleteUser: async (userId) => {
    return apiRequest(`/users/${userId}`, {
      method: 'DELETE',
    });
  },
};

// Utility functions
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
};

export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

export const removeAuthToken = () => {
  localStorage.removeItem('authToken');
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = getAuthToken();
  if (!token) return false;

  try {
    // Decode JWT token to check expiration
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    if (payload.exp < currentTime) {
      removeAuthToken();
      return false;
    }
    
    return true;
  } catch (error) {
    removeAuthToken();
    return false;
  }
};

export default {
  authAPI,
  examAPI,
  questionAPI,
  submissionAPI,
  userAPI,
  setAuthToken,
  getAuthToken,
  removeAuthToken,
  isAuthenticated,
};