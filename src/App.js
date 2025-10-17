import React, { useState, useEffect } from 'react';
import './App.css';
import backgroundImage from './assets/images/background.png';
import { authAPI, examAPI, submissionAPI, setAuthToken, removeAuthToken, isAuthenticated } from './services/api';

function App() {
  const [currentPage, setCurrentPage] = useState('home'); // Start from home
  const [selectedRole, setSelectedRole] = useState('Admin/Educator');
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // eslint-disable-next-line no-unused-vars
  const [users, setUsers] = useState([
    // Test student account
    {
      id: 1,
      fullName: 'Test Student',
      email: 'student@test.com',
      password: 'test123',
      role: 'Student',
      institution: 'Test University',
      department: 'Computer Science'
    },
    // Test admin account
    {
      id: 2,
      fullName: 'Test Admin',
      email: 'admin@test.com',
      password: 'admin123',
      role: 'Admin/Educator',
      institution: 'Test University',
      department: 'Computer Science'
    }
  ]); // Store registered users

  // Check authentication on app start
  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated()) {
        try {
          const response = await authAPI.getProfile();
          if (response.success) {
            setCurrentUser(response.data.user);
            // Determine which dashboard to show based on role
            if (response.data.user.role === 'student') {
              setCurrentPage('studentDashboard');
            } else {
              setCurrentPage('dashboard');
            }
          }
        } catch (error) {
          console.error('Failed to get user profile:', error);
          removeAuthToken();
        }
      }
    };

    checkAuth();
  }, []);

  // Fetch available exams for student demo codes
  const fetchAvailableExams = async () => {
    try {
      const response = await examAPI.getExams();
      const makeDemoExams = () => {
        const now = new Date();
        const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
        const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000);

        return [
          {
            _id: 'demo-exam-1',
            title: 'Demo Math Quiz',
            subject: 'Mathematics',
            duration: 30,
            totalMarks: 50,
            startDate: now.toISOString(),
            endDate: inOneHour.toISOString(),
            accessCode: 'MATH123',
            createdBy: { name: 'Demo Teacher' },
            questions: [
              { id: 'q1', question: '2+2 = ?', type: 'multiple-choice', options: ['2','3','4','5'], correctAnswer: '4', marks: 5 },
              { id: 'q2', question: '5*3 = ?', type: 'multiple-choice', options: ['8','15','10','12'], correctAnswer: '15', marks: 5 }
            ]
          },
          {
            _id: 'demo-exam-2',
            title: 'Demo Science Quiz',
            subject: 'Science',
            duration: 20,
            totalMarks: 40,
            startDate: now.toISOString(),
            endDate: inTwoHours.toISOString(),
            accessCode: 'SCI456',
            createdBy: { name: 'Demo Teacher' },
            questions: [
              { id: 'q1b', question: 'Water boils at 100°C. True or False?', type: 'multiple-choice', options: ['True','False'], correctAnswer: 'True', marks: 10 },
              { id: 'q2b', question: 'H2O is the chemical formula for what?', type: 'multiple-choice', options: ['Salt','Water','Oxygen'], correctAnswer: 'Water', marks: 10 }
            ]
          }
        ];
      };

      if (response && response.success) {
        const exams = response.data.exams || [];
        setAvailableExams(exams.length > 0 ? exams : makeDemoExams());
      } else {
        setAvailableExams(makeDemoExams());
      }
    } catch (error) {
      console.error('Failed to fetch exams:', error);
      // Use demo exams as fallback
      const now = new Date();
      const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
      const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      setAvailableExams([
        {
          _id: 'demo-exam-1',
          title: 'Demo Math Quiz',
          subject: 'Mathematics',
          duration: 30,
          totalMarks: 50,
          startDate: now.toISOString(),
          endDate: inOneHour.toISOString(),
          accessCode: 'MATH123',
          createdBy: { name: 'Demo Teacher' },
          questions: [
            { id: 'q1', question: '2+2 = ?', type: 'multiple-choice', options: ['2','3','4','5'], correctAnswer: '4', marks: 5 },
            { id: 'q2', question: '5*3 = ?', type: 'multiple-choice', options: ['8','15','10','12'], correctAnswer: '15', marks: 5 }
          ]
        },
        {
          _id: 'demo-exam-2',
          title: 'Demo Science Quiz',
          subject: 'Science',
          duration: 20,
          totalMarks: 40,
          startDate: now.toISOString(),
          endDate: inTwoHours.toISOString(),
          accessCode: 'SCI456',
          createdBy: { name: 'Demo Teacher' },
          questions: [
            { id: 'q1b', question: 'Water boils at 100°C. True or False?', type: 'multiple-choice', options: ['True','False'], correctAnswer: 'True', marks: 10 },
            { id: 'q2b', question: 'H2O is the chemical formula for what?', type: 'multiple-choice', options: ['Salt','Water','Oxygen'], correctAnswer: 'Water', marks: 10 }
          ]
        }
      ]);
    }
  };

  useEffect(() => {
    fetchAvailableExams();
  }, []);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    institution: '',
    department: '',
    password: '',
    confirmPassword: ''
  });
  const [signinData, setSigninData] = useState({
    email: '',
    password: ''
  });
  const [message, setMessage] = useState(''); // For success/error messages
  
  // Exam creation state
  const [examData, setExamData] = useState({
    title: '',
    subject: '',
    description: '',
    duration: '',
    totalMarks: '',
    questions: [],
    examCode: ''
  });
  const [currentQuestionType, setCurrentQuestionType] = useState('');
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [questionCounter, setQuestionCounter] = useState(1); // Track question numbers
  const [isEditingQuestion, setIsEditingQuestion] = useState(false); // Track if editing existing question
  const [editingQuestionId, setEditingQuestionId] = useState(null); // ID of question being edited
  
  // Student Dashboard State
  const [examCode, setExamCode] = useState('');
  const [currentExam, setCurrentExam] = useState(null);
  const [studentAnswers, setStudentAnswers] = useState({});
  const [examStarted, setExamStarted] = useState(false);
  const [examTimeRemaining, setExamTimeRemaining] = useState(0);
  const [studentExamResult, setStudentExamResult] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [availableExams, setAvailableExams] = useState([]); // Store real exams from database
  
  // Mock data for other dashboard features
  // eslint-disable-next-line no-unused-vars
  const [examResults, setExamResults] = useState([
    {
      id: 1,
      examTitle: 'JavaScript Fundamentals',
      studentName: 'John Doe',
      studentEmail: 'john@student.com',
      score: 85,
      totalMarks: 100,
      submittedAt: '2025-10-04 10:30 AM',
      status: 'Completed'
    },
    {
      id: 2,
      examTitle: 'React Components',
      studentName: 'Jane Smith',
      studentEmail: 'jane@student.com',
      score: 92,
      totalMarks: 100,
      submittedAt: '2025-10-04 11:15 AM',
      status: 'Completed'
    }
  ]);
  
  // eslint-disable-next-line no-unused-vars
  const [students, setStudents] = useState([
    {
      id: 1,
      name: 'John Doe',
      email: 'john@student.com',
      institution: 'ABC University',
      department: 'Computer Science',
      joinedDate: '2025-09-15',
      examsCompleted: 5,
      status: 'Active'
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@student.com',
      institution: 'XYZ College',
      department: 'Information Technology',
      joinedDate: '2025-09-20',
      examsCompleted: 3,
      status: 'Active'
    }
  ]);
  
  // eslint-disable-next-line no-unused-vars
  const [systemSettings, setSystemSettings] = useState({
    examDuration: '90',
    maxAttempts: '3',
    passingScore: '60',
    allowReview: true,
    randomizeQuestions: false,
    showResults: true,
    emailNotifications: true,
    autoGrading: true
  });
  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    type: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    expectedAnswer: '',
    problemStatement: '',
    language: '',
    sampleIO: '',
    marks: '',
    codeTemplate: '',
    testCases: [],
    // Answer Key (Admin Only - Hidden from Students)
    answerKey: {
      mcqCorrectAnswer: '',
      shortAnswerKey: '',
      codingSolution: '',
      explanationNotes: '',
      gradingRubric: ''
    }
  });

  const handleGetStarted = () => {
    setCurrentPage('roleSelection');
  };

  const handleRoleChange = (event) => {
    setSelectedRole(event.target.value);
  };

  const handleContinue = () => {
    setCurrentPage('registration');
  };

  const handleBackToRoleSelection = () => {
    setCurrentPage('roleSelection');
    setMessage('');
  };

  const handleGoToSignIn = () => {
    setCurrentPage('signin');
    setMessage('');
  };

  const handleBackToRegistration = () => {
    setCurrentPage('registration');
    setMessage('');
  };

  // eslint-disable-next-line no-unused-vars
  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentPage('home');
    setSigninData({ email: '', password: '' });
    setMessage('');
  };

  const handleCreateExam = () => {
    setCurrentPage('createExam');
  };
  
  const handleViewResults = () => {
    setCurrentPage('viewResults');
  };
  
  const handleManageStudents = () => {
    setCurrentPage('manageStudents');
  };
  
  const handleSettings = () => {
    setCurrentPage('settings');
  };

  const handleBackToDashboard = () => {
    setCurrentPage('dashboard');
    setExamData({
      title: '',
      subject: '',
      description: '',
      duration: '',
      totalMarks: '',
      questions: [],
      examCode: ''
    });
    setShowQuestionForm(false);
  };

  const handleExamDataChange = (field, value) => {
    setExamData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateExamCode = () => {
    const code = Math.floor(10000 + Math.random() * 90000).toString(); // 5-digit code
    setExamData(prev => ({
      ...prev,
      examCode: code
    }));
    setMessage(`Exam code generated: ${code}`);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleQuestionTypeSelect = (type) => {
    setCurrentQuestionType(type);
    setShowQuestionForm(true);
    setIsEditingQuestion(false);
    setEditingQuestionId(null);
    
    // Calculate next question number based on existing questions
    const nextQuestionNumber = examData.questions.length + 1;
    
    setCurrentQuestion({
      question: '',
      type: type,
      options: ['', '', '', ''],
      correctAnswer: '',
      expectedAnswer: '',
      problemStatement: '',
      language: '',
      sampleIO: '',
      marks: '',
      codeTemplate: '',
      testCases: [],
      questionNumber: nextQuestionNumber,
      // Answer Key (Admin Only)
      answerKey: {
        mcqCorrectAnswer: '',
        shortAnswerKey: '',
        codingSolution: '',
        explanationNotes: '',
        gradingRubric: ''
      }
    });
  };

  const handleQuestionChange = (field, value, index = null) => {
    setCurrentQuestion(prev => {
      if (field === 'options' && index !== null) {
        const newOptions = [...prev.options];
        newOptions[index] = value;
        return { ...prev, options: newOptions };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleAnswerKeyChange = (field, value) => {
    setCurrentQuestion(prev => ({
      ...prev,
      answerKey: {
        ...prev.answerKey,
        [field]: value
      }
    }));
  };

  const addQuestion = () => {
    if (currentQuestion.type === 'MCQ') {
      if (!currentQuestion.question || !currentQuestion.marks) {
        setMessage('Please fill in the question and marks');
        setTimeout(() => setMessage(''), 3000);
        return;
      }
      if (!currentQuestion.correctAnswer || currentQuestion.options.some(opt => !opt)) {
        setMessage('Please fill in all options and select correct answer');
        setTimeout(() => setMessage(''), 3000);
        return;
      }
      if (!currentQuestion.answerKey.mcqCorrectAnswer) {
        setMessage('Please confirm the correct answer in the Answer Key section');
        setTimeout(() => setMessage(''), 3000);
        return;
      }
    } else if (currentQuestion.type === 'Short Answer') {
      if (!currentQuestion.question || !currentQuestion.marks) {
        setMessage('Please fill in the question and marks');
        setTimeout(() => setMessage(''), 3000);
        return;
      }
      if (!currentQuestion.answerKey.shortAnswerKey) {
        setMessage('Please provide the answer key for grading reference');
        setTimeout(() => setMessage(''), 3000);
        return;
      }
    } else if (currentQuestion.type === 'Coding Challenge') {
      if (!currentQuestion.problemStatement || !currentQuestion.language || !currentQuestion.marks) {
        setMessage('Please fill in the problem statement, select language, and enter marks');
        setTimeout(() => setMessage(''), 3000);
        return;
      }
      if (!currentQuestion.answerKey.codingSolution) {
        setMessage('Please provide the coding solution in the Answer Key section');
        setTimeout(() => setMessage(''), 3000);
        return;
      }
    }

    // Use the current question number from the state
    const questionNumber = isEditingQuestion ? currentQuestion.questionNumber : examData.questions.length + 1;
    
    const newQuestion = {
      ...currentQuestion,
      id: Date.now(),
      questionNumber: questionNumber
    };

    if (isEditingQuestion) {
      // Update existing question
      setExamData(prev => ({
        ...prev,
        questions: prev.questions.map(q => q.id === editingQuestionId ? newQuestion : q)
      }));
      setMessage('Question updated successfully!');
      setShowQuestionForm(false);
      setIsEditingQuestion(false);
      setEditingQuestionId(null);
    } else {
      // Add new question
      setExamData(prev => ({
        ...prev,
        questions: [...prev.questions, newQuestion]
      }));
      setMessage(`Question ${questionNumber} added successfully!`);
      
      // Auto-prepare for next question of any type
      setTimeout(() => {
        setMessage('');
        // Reset form but keep it open for next question
        const nextQuestionNumber = examData.questions.length + 2; // +2 because we just added one
        setCurrentQuestion({
          question: '',
          type: '', // Clear type so user can select new type
          options: ['', '', '', ''],
          correctAnswer: '',
          expectedAnswer: '',
          problemStatement: '',
          language: '',
          sampleIO: '',
          marks: '',
          codeTemplate: '',
          testCases: [],
          questionNumber: nextQuestionNumber,
          answerKey: {
            mcqCorrectAnswer: '',
            shortAnswerKey: '',
            codingSolution: '',
            explanationNotes: '',
            gradingRubric: ''
          }
        });
        setShowQuestionForm(false); // Hide form so user can select new question type
        setCurrentQuestionType('');
      }, 1500);
    }
  };

  const generateCodeTemplate = (language) => {
    const templates = {
      javascript: `function solve() {
    // Your code here
    return "solution";
}

// Test your function
console.log(solve());`,
      python: `def solve():
    # Your code here
    return "solution"

# Test your function
print(solve())`,
      java: `public class Solution {
    public static String solve() {
        // Your code here
        return "solution";
    }
    
    public static void main(String[] args) {
        System.out.println(solve());
    }
}`,
      cpp: `#include <iostream>
#include <string>
using namespace std;

string solve() {
    // Your code here
    return "solution";
}

int main() {
    cout << solve() << endl;
    return 0;
}`,
      c: `#include <stdio.h>
#include <string.h>

char* solve() {
    // Your code here
    return "solution";
}

int main() {
    printf("%s\\n", solve());
    return 0;
}`
    };
    return templates[language] || '';
  };

  // Function to create student version of exam (without answer keys)
  // eslint-disable-next-line no-unused-vars
  const createStudentExamVersion = (examData) => {
    return {
      ...examData,
      questions: examData.questions.map(question => {
        const studentQuestion = { ...question };
        // Remove all answer key information
        delete studentQuestion.answerKey;
        delete studentQuestion.correctAnswer; // Remove for MCQ
        // Keep only what students need to see
        return studentQuestion;
      })
    };
  };

  const handleLanguageChange = (language) => {
    const template = generateCodeTemplate(language);
    setCurrentQuestion(prev => ({
      ...prev,
      language: language,
      codeTemplate: template
    }));
  };

  const editQuestion = (question) => {
    setCurrentQuestion(question);
    setCurrentQuestionType(question.type);
    setShowQuestionForm(true);
    setIsEditingQuestion(true);
    setEditingQuestionId(question.id);
  };

  const removeQuestion = (questionId) => {
    // Remove the question
    const updatedQuestions = examData.questions.filter(q => q.id !== questionId);
    
    // Renumber all remaining questions
    const renumberedQuestions = updatedQuestions.map((q, index) => ({
      ...q,
      questionNumber: index + 1
    }));
    
    setExamData(prev => ({
      ...prev,
      questions: renumberedQuestions
    }));
    
    setMessage('Question removed and remaining questions renumbered!');
    setTimeout(() => setMessage(''), 3000);
  };

  const saveExam = async () => {
    if (!examData.title || !examData.subject || !examData.duration || !examData.totalMarks) {
      setMessage('Please fill in all exam details');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    if (examData.questions.length === 0) {
      setMessage('Please add at least one question');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    
    if (!examData.examCode) {
      setMessage('Please generate an exam code first');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    // Check if user is authenticated
    if (!currentUser) {
      setMessage('Please sign in first to save the exam to the database');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    // Check if user has appropriate role (teacher/admin)
    if (currentUser.role !== 'teacher' && currentUser.role !== 'admin') {
      setMessage('Only teachers and admins can create exams');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      // Generate default values for required fields
      const now = new Date();
      const startDate = new Date(now.getTime() + 5 * 60000); // 5 minutes from now
      const endDate = new Date(startDate.getTime() + parseInt(examData.duration) * 60000); // duration in milliseconds
      const passingMarks = Math.ceil(parseInt(examData.totalMarks) * 0.6); // 60% passing marks
      
      const response = await examAPI.createExam({
        title: examData.title,
        description: `Examination for ${examData.subject} - ${examData.title}`,
        subject: examData.subject,
        duration: parseInt(examData.duration),
        totalMarks: parseInt(examData.totalMarks),
        passingMarks: passingMarks,
        accessCode: examData.examCode,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        questions: examData.questions.map(q => ({
          question: q.question,
          type: q.type,
          options: q.options,
          correctAnswer: q.correctAnswer,
          marks: q.marks
        }))
      });

      if (response.success) {
        setMessage('Exam saved successfully to database!');
        // Refresh available exams for student dashboard
        fetchAvailableExams();
        // Reset exam data
        setExamData({
          title: '',
          subject: '',
          duration: '',
          totalMarks: '',
          examCode: '',
          questions: []
        });
        setCurrentQuestion({
          question: '',
          type: 'multiple-choice',
          options: ['', '', '', ''],
          correctAnswer: '',
          marks: ''
        });
      } else {
        setMessage('Failed to save exam. Please try again.');
      }
    } catch (error) {
      console.error('Save exam error:', error);
      if (error.message.includes('authorization denied') || error.message.includes('Unauthorized')) {
        setMessage('Authentication required. Please sign in to save exams.');
      } else {
        setMessage('Error saving exam. Please try again.');
      }
    }
    
    setTimeout(() => setMessage(''), 3000);
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSigninChange = (field, value) => {
    setSigninData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRegistration = async () => {
    // Validate form
    if (!formData.fullName || !formData.email || !formData.password) {
      setMessage('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      // Map frontend role to backend format
      let backendRole = selectedRole;
      if (selectedRole === 'Admin/Educator') {
        backendRole = 'admin';
      } else if (selectedRole === 'Student') {
        backendRole = 'student';
      } else if (selectedRole === 'Teacher') {
        backendRole = 'teacher';
      }

      console.log('🔄 Registration attempt with data:', {
        name: formData.fullName,
        email: formData.email,
        password: '***hidden***',
        role: backendRole,
        institution: formData.institution,
        department: formData.department,
        selectedRole: selectedRole,
        originalFormData: formData
      });

      // Register user via API
      const response = await authAPI.register({
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: backendRole,
        institution: formData.institution,
        department: formData.department
      });

      if (response.success) {
        setMessage('Account created successfully! You can now sign in.');
        
        // Clear form
        setFormData({
          fullName: '',
          email: '',
          institution: '',
          department: '',
          password: '',
          confirmPassword: ''
        });

        // Auto redirect to sign in after 2 seconds
        setTimeout(() => {
          setCurrentPage('signin');
          setMessage('');
        }, 2000);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setMessage(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    // Validate signin form
    if (!signinData.email || !signinData.password) {
      setMessage('Please enter both email and password');
      return;
    }

    setIsLoading(true);

    try {
      // Login via API
      const response = await authAPI.login({
        email: signinData.email,
        password: signinData.password
      });

      if (response.success) {
        // Store auth token
        setAuthToken(response.data.token);
        
        // Set current user
        setCurrentUser(response.data.user);
        setMessage(`Welcome back, ${response.data.user.name}!`);
        
        // Clear signin form
        setSigninData({ email: '', password: '' });
        
        // Redirect based on user role after 1 second
        setTimeout(() => {
          if (response.data.user.role === 'student') {
            setCurrentPage('studentDashboard');
          } else {
            setCurrentPage('dashboard');
          }
          setMessage('');
        }, 1000);
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessage(error.message || 'Invalid email or password');
      
      // Fallback to local users for development
      const user = users.find(u => 
        u.email.toLowerCase() === signinData.email.toLowerCase() && u.password === signinData.password
      );

      if (user) {
        setCurrentUser(user);
        setMessage(`Welcome back, ${user.fullName}!`);
        
        // Clear signin form
        setSigninData({ email: '', password: '' });
        
        // Redirect based on user role after 1 second
        setTimeout(() => {
          if (user.role === 'Student') {
            setCurrentPage('studentDashboard');
          } else {
            setCurrentPage('dashboard');
          }
          setMessage('');
        }, 1000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Student Dashboard Functions
  const handleExamCodeSubmit = async () => {
    // Validate exam code format (4-8 digits or letters)
    if (!/^[A-Z0-9]{4,8}$/.test(examCode.toUpperCase())) {
      setMessage('Please enter a valid exam code (4-8 characters)');
      return;
    }

    setIsLoading(true);

    try {
      // Get exam by access code from API
      const response = await examAPI.getExamByCode(examCode);
      
      if (response.success) {
        setCurrentExam(response.data.exam);
        setExamTimeRemaining(response.data.exam.duration * 60); // Convert to seconds
        setMessage(`Exam found: ${response.data.exam.title}`);
        
        // Clear message after 2 seconds
        setTimeout(() => setMessage(''), 2000);
      }
    } catch (error) {
      console.error('Exam fetch error:', error);
      
      // First, try to find in locally cached exams
      const foundCachedExam = availableExams.find(exam => 
        exam.accessCode === examCode.toUpperCase()
      );
      
      if (foundCachedExam) {
        setCurrentExam(foundCachedExam);
        setExamTimeRemaining(foundCachedExam.duration * 60);
        setMessage(`Exam found: ${foundCachedExam.title}`);
        setTimeout(() => setMessage(''), 2000);
        setIsLoading(false);
        return;
      }
      
      setMessage('Invalid exam code. Please check and try again.');
      
      // Fallback to mock exam data for development only if no real exams available
      if (availableExams.length === 0) {
        const mockExams = [
        {
          id: 1,
          examCode: '123456',
          title: 'JavaScript Fundamentals Test',
          subject: 'Computer Science',
          duration: 60,
          totalMarks: 100,
          questions: [
            {
              id: 1,
              question: 'What is the correct way to declare a variable in JavaScript?',
              type: 'multiple-choice',
              options: ['var x = 5;', 'variable x = 5;', 'v x = 5;', 'declare x = 5;'],
              correctAnswer: 'var x = 5;',
              marks: 50
            },
            {
              id: 2,
              question: 'Which of the following is NOT a JavaScript data type?',
              type: 'multiple-choice',
              options: ['String', 'Boolean', 'Integer', 'Undefined'],
              correctAnswer: 'Integer',
              marks: 50
            }
          ]
        },
        {
          id: 2,
          examCode: '789012',
          title: 'React Basics Quiz',
          subject: 'Web Development',
          duration: 45,
          totalMarks: 80,
          questions: [
            {
              id: 1,
              question: 'What is JSX?',
              type: 'multiple-choice',
              options: ['JavaScript XML', 'Java Syntax Extension', 'JSON Extension', 'JavaScript Extension'],
              correctAnswer: 'JavaScript XML',
              marks: 80
            }
          ]
        }
      ];

      const foundExam = mockExams.find(exam => exam.examCode === examCode);
      
      if (foundExam) {
        setCurrentExam(foundExam);
        setExamTimeRemaining(foundExam.duration * 60); // Convert to seconds
        setMessage(`Exam found: ${foundExam.title}`);
        
        // Clear message after 2 seconds
        setTimeout(() => setMessage(''), 2000);
      }
    } // End of mock exam fallback
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartExam = () => {
    if (!currentExam) return;
    
    setExamStarted(true);
    setStudentAnswers({});
    setMessage('Exam started! Good luck!');
    
    // Clear message after 3 seconds
    setTimeout(() => setMessage(''), 3000);
    
    // Start countdown timer
    const timer = setInterval(() => {
      setExamTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAnswerChange = (questionId, answer) => {
    setStudentAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmitExam = async () => {
    setExamStarted(false);
    setIsLoading(true);
    
    try {
      // Calculate score locally first
      let totalScore = 0;
      let maxScore = 0;
      const questionResults = [];

      (currentExam.questions || []).forEach(question => {
        const studentAnswer = studentAnswers[question.id];
        const isCorrect = studentAnswer === question.correctAnswer;
        const earnedMarks = isCorrect ? question.marks : 0;

        totalScore += earnedMarks;
        maxScore += question.marks || 0;

        questionResults.push({
          questionId: question.id,
          question: question.question,
          studentAnswer: studentAnswer || 'Not Answered',
          correctAnswer: question.correctAnswer,
          isCorrect: isCorrect,
          earnedMarks: earnedMarks,
          totalMarks: question.marks || 0
        });
      });

      const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
      const timeTaken = ((currentExam?.duration || 0) * 60) - (examTimeRemaining || 0);
      
      const result = {
        totalScore,
        maxScore,
        percentage,
        questionResults,
        examTitle: currentExam.title,
        timeTaken: timeTaken,
        passed: percentage >= 60 // Assuming 60% is passing
      };

      // Try to submit to backend API
      try {
        const submissionData = {
          examId: currentExam.id,
          answers: studentAnswers,
          timeTaken: timeTaken,
          score: totalScore,
          totalMarks: maxScore,
          percentage: percentage
        };

        const response = await submissionAPI.createSubmission(submissionData);
        
        if (response.success) {
          console.log('Submission saved to backend:', response.data);
          result.submissionId = response.data._id;
        }
      } catch (apiError) {
        console.warn('Failed to save submission to backend:', apiError);
        // Continue with local results even if backend submission fails
      }

      setStudentExamResult(result);
      setShowResults(true);
      setMessage(`Exam submitted successfully! You scored ${totalScore}/${maxScore} (${percentage}%)`);
      
      console.log('Submitted answers:', studentAnswers);
      console.log('Exam results:', result);
      
    } catch (error) {
      console.error('Error submitting exam:', error);
      setMessage('Error submitting exam. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // View Results Page
  const renderViewResultsPage = () => (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      padding: '0'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button
            onClick={handleBackToDashboard}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#800020',
              fontSize: '1.5rem',
              cursor: 'pointer'
            }}
          >
            ←
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#660018',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ color: 'white', fontSize: '1.2rem' }}>📊</span>
            </div>
            <h1 style={{
              fontSize: '1.8rem',
              fontWeight: '600',
              color: '#2c3e50',
              margin: '0'
            }}>
              View Results
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{
        padding: '40px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Statistics Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '40px'
        }}>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '15px',
            padding: '25px',
            textAlign: 'center',
            boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{ color: '#007bff', fontSize: '2rem', margin: '0 0 10px 0' }}>{examResults.length}</h3>
            <p style={{ color: '#6c757d', margin: '0' }}>Total Submissions</p>
          </div>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '15px',
            padding: '25px',
            textAlign: 'center',
            boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{ color: '#28a745', fontSize: '2rem', margin: '0 0 10px 0' }}>
              {Math.round(examResults.reduce((acc, result) => acc + result.score, 0) / examResults.length)}%
            </h3>
            <p style={{ color: '#6c757d', margin: '0' }}>Average Score</p>
          </div>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '15px',
            padding: '25px',
            textAlign: 'center',
            boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{ color: '#ffc107', fontSize: '2rem', margin: '0 0 10px 0' }}>
              {Math.max(...examResults.map(r => r.score))}%
            </h3>
            <p style={{ color: '#6c757d', margin: '0' }}>Highest Score</p>
          </div>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '15px',
            padding: '25px',
            textAlign: 'center',
            boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{ color: '#dc3545', fontSize: '2rem', margin: '0 0 10px 0' }}>
              {examResults.filter(r => r.score >= 60).length}
            </h3>
            <p style={{ color: '#6c757d', margin: '0' }}>Students Passed</p>
          </div>
        </div>

        {/* Results Table */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '15px',
          padding: '30px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#2c3e50',
            marginBottom: '25px'
          }}>
            Exam Results
          </h2>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              backgroundColor: 'white',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', color: '#2c3e50' }}>Student</th>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', color: '#2c3e50' }}>Exam</th>
                  <th style={{ padding: '15px', textAlign: 'center', fontWeight: '600', color: '#2c3e50' }}>Score</th>
                  <th style={{ padding: '15px', textAlign: 'center', fontWeight: '600', color: '#2c3e50' }}>Status</th>
                  <th style={{ padding: '15px', textAlign: 'center', fontWeight: '600', color: '#2c3e50' }}>Submitted</th>
                  <th style={{ padding: '15px', textAlign: 'center', fontWeight: '600', color: '#2c3e50' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {examResults.map((result, index) => (
                  <tr key={result.id} style={{ borderBottom: '1px solid #e9ecef' }}>
                    <td style={{ padding: '15px' }}>
                      <div>
                        <strong style={{ color: '#2c3e50' }}>{result.studentName}</strong>
                        <br />
                        <small style={{ color: '#6c757d' }}>{result.studentEmail}</small>
                      </div>
                    </td>
                    <td style={{ padding: '15px', color: '#2c3e50' }}>{result.examTitle}</td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <span style={{
                        backgroundColor: result.score >= 60 ? '#d4edda' : '#f8d7da',
                        color: result.score >= 60 ? '#155724' : '#721c24',
                        padding: '5px 10px',
                        borderRadius: '12px',
                        fontSize: '0.9rem',
                        fontWeight: '600'
                      }}>
                        {result.score}/{result.totalMarks}
                      </span>
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <span style={{
                        backgroundColor: '#d1ecf1',
                        color: '#0c5460',
                        padding: '5px 10px',
                        borderRadius: '12px',
                        fontSize: '0.8rem'
                      }}>
                        {result.status}
                      </span>
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center', color: '#6c757d', fontSize: '0.9rem' }}>
                      {result.submittedAt}
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <button style={{
                        backgroundColor: '#660018',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        marginRight: '5px'
                      }}>
                        View Details
                      </button>
                      <button style={{
                        backgroundColor: '#660018',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}>
                        Export
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  // Manage Students Page
  const renderManageStudentsPage = () => (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      padding: '0'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button
            onClick={handleBackToDashboard}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#800020',
              fontSize: '1.5rem',
              cursor: 'pointer'
            }}
          >
            ←
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#660018',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ color: 'white', fontSize: '1.2rem' }}>👥</span>
            </div>
            <h1 style={{
              fontSize: '1.8rem',
              fontWeight: '600',
              color: '#2c3e50',
              margin: '0'
            }}>
              Manage Students
            </h1>
          </div>
        </div>
        <button style={{
          backgroundColor: '#660018',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '10px 20px',
          fontSize: '0.9rem',
          cursor: 'pointer',
          fontWeight: '500'
        }}>
          Add Student
        </button>
      </div>

      {/* Content */}
      <div style={{
        padding: '40px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Statistics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '40px'
        }}>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '15px',
            padding: '25px',
            textAlign: 'center',
            boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{ color: '#007bff', fontSize: '2rem', margin: '0 0 10px 0' }}>{students.length}</h3>
            <p style={{ color: '#6c757d', margin: '0' }}>Total Students</p>
          </div>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '15px',
            padding: '25px',
            textAlign: 'center',
            boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{ color: '#28a745', fontSize: '2rem', margin: '0 0 10px 0' }}>
              {students.filter(s => s.status === 'Active').length}
            </h3>
            <p style={{ color: '#6c757d', margin: '0' }}>Active Students</p>
          </div>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '15px',
            padding: '25px',
            textAlign: 'center',
            boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{ color: '#ffc107', fontSize: '2rem', margin: '0 0 10px 0' }}>
              {Math.round(students.reduce((acc, s) => acc + s.examsCompleted, 0) / students.length)}
            </h3>
            <p style={{ color: '#6c757d', margin: '0' }}>Avg Exams Completed</p>
          </div>
        </div>

        {/* Students Table */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '15px',
          padding: '30px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#2c3e50',
              margin: '0'
            }}>
              Student List
            </h2>
            <input
              type="text"
              placeholder="Search students..."
              style={{
                padding: '8px 15px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '0.9rem',
                width: '250px'
              }}
            />
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              backgroundColor: 'white',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', color: '#2c3e50' }}>Student</th>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', color: '#2c3e50' }}>Institution</th>
                  <th style={{ padding: '15px', textAlign: 'center', fontWeight: '600', color: '#2c3e50' }}>Exams Completed</th>
                  <th style={{ padding: '15px', textAlign: 'center', fontWeight: '600', color: '#2c3e50' }}>Status</th>
                  <th style={{ padding: '15px', textAlign: 'center', fontWeight: '600', color: '#2c3e50' }}>Joined Date</th>
                  <th style={{ padding: '15px', textAlign: 'center', fontWeight: '600', color: '#2c3e50' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} style={{ borderBottom: '1px solid #e9ecef' }}>
                    <td style={{ padding: '15px' }}>
                      <div>
                        <strong style={{ color: '#2c3e50' }}>{student.name}</strong>
                        <br />
                        <small style={{ color: '#6c757d' }}>{student.email}</small>
                        <br />
                        <small style={{ color: '#6c757d' }}>{student.department}</small>
                      </div>
                    </td>
                    <td style={{ padding: '15px', color: '#2c3e50' }}>{student.institution}</td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <span style={{
                        backgroundColor: '#e3f2fd',
                        color: '#1976d2',
                        padding: '5px 10px',
                        borderRadius: '12px',
                        fontSize: '0.9rem',
                        fontWeight: '600'
                      }}>
                        {student.examsCompleted}
                      </span>
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <span style={{
                        backgroundColor: student.status === 'Active' ? '#d4edda' : '#f8d7da',
                        color: student.status === 'Active' ? '#155724' : '#721c24',
                        padding: '5px 10px',
                        borderRadius: '12px',
                        fontSize: '0.8rem'
                      }}>
                        {student.status}
                      </span>
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center', color: '#6c757d', fontSize: '0.9rem' }}>
                      {student.joinedDate}
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <button style={{
                        backgroundColor: '#660018',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        marginRight: '5px'
                      }}>
                        Edit
                      </button>
                      <button style={{
                        backgroundColor: '#660018',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  // Settings Page
  const renderSettingsPage = () => (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      padding: '0'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button
            onClick={handleBackToDashboard}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#800020',
              fontSize: '1.5rem',
              cursor: 'pointer'
            }}
          >
            ←
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#660018',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ color: 'white', fontSize: '1.2rem' }}>⚙️</span>
            </div>
            <h1 style={{
              fontSize: '1.8rem',
              fontWeight: '600',
              color: '#2c3e50',
              margin: '0'
            }}>
              Settings
            </h1>
          </div>
        </div>
        <button style={{
          backgroundColor: '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '10px 20px',
          fontSize: '0.9rem',
          cursor: 'pointer',
          fontWeight: '500'
        }}>
          Save Changes
        </button>
      </div>

      {/* Content */}
      <div style={{
        padding: '40px',
        maxWidth: '1000px',
        margin: '0 auto'
      }}>
        {/* General Settings */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '15px',
          padding: '30px',
          marginBottom: '30px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#2c3e50',
            marginBottom: '25px'
          }}>
            General Settings
          </h2>
          
          <div style={{ display: 'grid', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#2c3e50' }}>
                Institution Name
              </label>
              <input
                type="text"
                value={systemSettings.institutionName}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#2c3e50' }}>
                Default Exam Duration (minutes)
              </label>
              <input
                type="number"
                value={systemSettings.defaultExamDuration}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#2c3e50' }}>
                Passing Score (%)
              </label>
              <input
                type="number"
                value={systemSettings.passingScore}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
            </div>
          </div>
        </div>

        {/* Exam Settings */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '15px',
          padding: '30px',
          marginBottom: '30px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#2c3e50',
            marginBottom: '25px'
          }}>
            Exam Settings
          </h2>
          
          <div style={{ display: 'grid', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <strong style={{ color: '#2c3e50' }}>Allow Late Submissions</strong>
                <p style={{ color: '#6c757d', margin: '5px 0 0 0', fontSize: '0.9rem' }}>
                  Students can submit exams after the deadline
                </p>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '34px' }}>
                <input type="checkbox" checked={systemSettings.allowLateSubmissions} style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: systemSettings.allowLateSubmissions ? '#4CAF50' : '#ccc',
                  transition: '.4s',
                  borderRadius: '34px'
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '',
                    height: '26px',
                    width: '26px',
                    left: systemSettings.allowLateSubmissions ? '30px' : '4px',
                    bottom: '4px',
                    backgroundColor: 'white',
                    transition: '.4s',
                    borderRadius: '50%'
                  }}></span>
                </span>
              </label>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <strong style={{ color: '#2c3e50' }}>Randomize Questions</strong>
                <p style={{ color: '#6c757d', margin: '5px 0 0 0', fontSize: '0.9rem' }}>
                  Questions appear in random order for each student
                </p>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '34px' }}>
                <input type="checkbox" checked={systemSettings.randomizeQuestions} style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: systemSettings.randomizeQuestions ? '#4CAF50' : '#ccc',
                  transition: '.4s',
                  borderRadius: '34px'
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '',
                    height: '26px',
                    width: '26px',
                    left: systemSettings.randomizeQuestions ? '30px' : '4px',
                    bottom: '4px',
                    backgroundColor: 'white',
                    transition: '.4s',
                    borderRadius: '50%'
                  }}></span>
                </span>
              </label>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <strong style={{ color: '#2c3e50' }}>Show Results Immediately</strong>
                <p style={{ color: '#6c757d', margin: '5px 0 0 0', fontSize: '0.9rem' }}>
                  Students see their score immediately after submission
                </p>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '34px' }}>
                <input type="checkbox" checked={systemSettings.showResultsImmediately} style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: systemSettings.showResultsImmediately ? '#4CAF50' : '#ccc',
                  transition: '.4s',
                  borderRadius: '34px'
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '',
                    height: '26px',
                    width: '26px',
                    left: systemSettings.showResultsImmediately ? '30px' : '4px',
                    bottom: '4px',
                    backgroundColor: 'white',
                    transition: '.4s',
                    borderRadius: '50%'
                  }}></span>
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '15px',
          padding: '30px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#2c3e50',
            marginBottom: '25px'
          }}>
            Security Settings
          </h2>
          
          <div style={{ display: 'grid', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#2c3e50' }}>
                Maximum Login Attempts
              </label>
              <input
                type="number"
                value={systemSettings.maxLoginAttempts}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#2c3e50' }}>
                Session Timeout (minutes)
              </label>
              <input
                type="number"
                value={systemSettings.sessionTimeout}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <strong style={{ color: '#2c3e50' }}>Require Email Verification</strong>
                <p style={{ color: '#6c757d', margin: '5px 0 0 0', fontSize: '0.9rem' }}>
                  New accounts must verify their email address
                </p>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '34px' }}>
                <input type="checkbox" checked={systemSettings.requireEmailVerification} style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: systemSettings.requireEmailVerification ? '#4CAF50' : '#ccc',
                  transition: '.4s',
                  borderRadius: '34px'
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '',
                    height: '26px',
                    width: '26px',
                    left: systemSettings.requireEmailVerification ? '30px' : '4px',
                    bottom: '4px',
                    backgroundColor: 'white',
                    transition: '.4s',
                    borderRadius: '50%'
                  }}></span>
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Create Exam Page
  const renderCreateExamPage = () => (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      padding: '0'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        {/* Back Button and Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button
            onClick={handleBackToDashboard}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#800020',
              fontSize: '1.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            ←
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#660018',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ color: 'white', fontSize: '1.2rem' }}>📝</span>
            </div>
            <h1 style={{
              fontSize: '1.8rem',
              fontWeight: '600',
              color: '#2c3e50',
              margin: '0'
            }}>
              Create Exam
            </h1>
          </div>
        </div>

        {/* User Status Indicator */}
        <div style={{ 
          padding: '10px 15px',
          backgroundColor: currentUser ? '#d4edda' : '#f8d7da',
          color: currentUser ? '#155724' : '#721c24',
          borderRadius: '6px',
          fontSize: '0.85rem',
          fontWeight: '500',
          border: `1px solid ${currentUser ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {currentUser ? (
            <>
              ✓ Signed in as {currentUser.fullName} ({currentUser.role})
            </>
          ) : (
            <>
              ⚠ Not signed in - exams won't be saved to database
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '15px' }}>
          <button
            onClick={generateExamCode}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '0.9rem',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Generate Code
          </button>
          <button
            onClick={saveExam}
            style={{
              backgroundColor: '#660018',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '0.9rem',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Save Exam
          </button>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div style={{
          padding: '15px',
          margin: '20px 40px',
          borderRadius: '8px',
          backgroundColor: message.includes('successfully') || message.includes('generated') ? '#d4edda' : '#f8d7da',
          color: message.includes('successfully') || message.includes('generated') ? '#155724' : '#721c24',
          border: `1px solid ${message.includes('successfully') || message.includes('generated') ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {message}
        </div>
      )}

      {/* Main Content */}
      <div style={{
        padding: '40px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Exam Details Section */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '15px',
          padding: '30px',
          marginBottom: '30px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#2c3e50',
            marginBottom: '25px'
          }}>
            Exam Details
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '25px'
          }}>
            {/* Exam Title */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '600',
                color: '#2c3e50',
                marginBottom: '8px'
              }}>
                Exam Title
              </label>
              <input
                type="text"
                placeholder="Enter exam title"
                value={examData.title}
                onChange={(e) => handleExamDataChange('title', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '1rem',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  outline: 'none'
                }}
              />
            </div>

            {/* Duration */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '600',
                color: '#2c3e50',
                marginBottom: '8px'
              }}>
                Duration (minutes)
              </label>
              <input
                type="number"
                placeholder="90"
                value={examData.duration}
                onChange={(e) => handleExamDataChange('duration', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '1rem',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  outline: 'none'
                }}
              />
            </div>

            {/* Subject */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '600',
                color: '#2c3e50',
                marginBottom: '8px'
              }}>
                Subject
              </label>
              <input
                type="text"
                placeholder="Enter subject"
                value={examData.subject}
                onChange={(e) => handleExamDataChange('subject', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '1rem',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  outline: 'none'
                }}
              />
            </div>

            {/* Total Marks */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '600',
                color: '#2c3e50',
                marginBottom: '8px'
              }}>
                Total Marks
              </label>
              <input
                type="number"
                placeholder="100"
                value={examData.totalMarks}
                onChange={(e) => handleExamDataChange('totalMarks', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '1rem',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Description */}
          <div style={{ marginTop: '25px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: '600',
              color: '#2c3e50',
              marginBottom: '8px'
            }}>
              Description
            </label>
            <textarea
              placeholder="Enter exam description and instructions"
              value={examData.description}
              onChange={(e) => handleExamDataChange('description', e.target.value)}
              rows={4}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '1rem',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                backgroundColor: 'white',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Exam Code Display */}
          {examData.examCode && (
            <div style={{
              marginTop: '25px',
              padding: '15px',
              backgroundColor: '#e8f5e8',
              borderRadius: '8px',
              border: '1px solid #c3e6cb'
            }}>
              <strong style={{ color: '#155724' }}>
                Exam Code: {examData.examCode}
              </strong>
              <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: '#155724' }}>
                Students will use this code to access the exam
              </p>
            </div>
          )}
        </div>

        {/* Questions Section */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '15px',
          padding: '30px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#2c3e50',
            marginBottom: '25px'
          }}>
            Questions
          </h2>

          {/* Question Type Buttons */}
          <div style={{
            display: 'flex',
            gap: '15px',
            marginBottom: '30px',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => handleQuestionTypeSelect('MCQ')}
              style={{
                backgroundColor: '#660018',
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                padding: '10px 25px',
                fontSize: '0.9rem',
                cursor: 'pointer',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              + MCQ
              <span style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                padding: '2px 6px',
                borderRadius: '10px',
                fontSize: '0.8rem'
              }}>
                #{examData.questions.length + 1}
              </span>
            </button>
            <button
              onClick={() => handleQuestionTypeSelect('Short Answer')}
              style={{
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                padding: '10px 25px',
                fontSize: '0.9rem',
                cursor: 'pointer',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              + Short Answer
              <span style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                padding: '2px 6px',
                borderRadius: '10px',
                fontSize: '0.8rem'
              }}>
                #{examData.questions.length + 1}
              </span>
            </button>
            <button
              onClick={() => handleQuestionTypeSelect('Coding Challenge')}
              style={{
                backgroundColor: '#660018',
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                padding: '10px 25px',
                fontSize: '0.9rem',
                cursor: 'pointer',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              + Coding Challenge
              <span style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                padding: '2px 6px',
                borderRadius: '10px',
                fontSize: '0.8rem'
              }}>
                #{examData.questions.length + 1}
              </span>
            </button>
          </div>

          {/* Question Form */}
          {showQuestionForm && (
            <div style={{
              padding: '25px',
              backgroundColor: '#f8f9fa',
              borderRadius: '10px',
              border: '1px solid #e0e0e0'
            }}>
              <h3 style={{
                fontSize: '1.2rem',
                fontWeight: '600',
                color: '#2c3e50',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{
                  backgroundColor: currentQuestionType === 'MCQ' ? '#007bff' : 
                                 currentQuestionType === 'Short Answer' ? '#28a745' : '#6f42c1',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '15px',
                  fontSize: '0.8rem'
                }}>
                  {currentQuestionType}
                </span>
                {isEditingQuestion ? 
                  `Edit Question #${currentQuestion.questionNumber}` : 
                  `Add Question #${examData.questions.length + 1}`
                }
              </h3>

              {currentQuestionType === 'MCQ' && (
                <div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Question</label>
                    <textarea
                      placeholder="Enter your question here..."
                      value={currentQuestion.question}
                      onChange={(e) => handleQuestionChange('question', e.target.value)}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ccc',
                        borderRadius: '6px',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                  {['A', 'B', 'C', 'D'].map((option, index) => (
                    <div key={option} style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Option {option}</label>
                      <input
                        type="text"
                        placeholder={`Enter option ${option}...`}
                        value={currentQuestion.options[index]}
                        onChange={(e) => handleQuestionChange('options', e.target.value, index)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #ccc',
                          borderRadius: '6px',
                          fontSize: '1rem'
                        }}
                      />
                    </div>
                  ))}
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Correct Answer</label>
                    <select 
                      value={currentQuestion.correctAnswer}
                      onChange={(e) => handleQuestionChange('correctAnswer', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ccc',
                        borderRadius: '6px',
                        fontSize: '1rem'
                      }}>
                      <option value="">Select correct answer</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Answer Key Section - MCQ */}
              {currentQuestionType === 'MCQ' && (
                <div style={{
                  marginTop: '20px',
                  padding: '20px',
                  backgroundColor: '#fff3cd',
                  borderRadius: '8px',
                  border: '1px solid #ffeaa7'
                }}>
                  <h4 style={{
                    color: '#856404',
                    marginBottom: '15px',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    🔒 Answer Key (Admin Only - Hidden from Students)
                  </h4>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#856404' }}>
                      Confirm Correct Answer
                    </label>
                    <select 
                      value={currentQuestion.answerKey.mcqCorrectAnswer}
                      onChange={(e) => handleAnswerKeyChange('mcqCorrectAnswer', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '2px solid #ffeaa7',
                        borderRadius: '6px',
                        fontSize: '1rem',
                        backgroundColor: 'white'
                      }}>
                      <option value="">Confirm correct answer</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#856404' }}>
                      Explanation/Notes (for grading reference)
                    </label>
                    <textarea
                      placeholder="Explain why this is the correct answer..."
                      value={currentQuestion.answerKey.explanationNotes}
                      onChange={(e) => handleAnswerKeyChange('explanationNotes', e.target.value)}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '2px solid #ffeaa7',
                        borderRadius: '6px',
                        fontSize: '1rem',
                        backgroundColor: 'white'
                      }}
                    />
                  </div>
                </div>
              )}

              {currentQuestionType === 'Short Answer' && (
                <div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Question</label>
                    <textarea
                      placeholder="Enter your question here..."
                      value={currentQuestion.question}
                      onChange={(e) => handleQuestionChange('question', e.target.value)}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ccc',
                        borderRadius: '6px',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Expected Answer (Optional)</label>
                    <textarea
                      placeholder="Enter expected answer or key points..."
                      value={currentQuestion.expectedAnswer}
                      onChange={(e) => handleQuestionChange('expectedAnswer', e.target.value)}
                      rows={2}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ccc',
                        borderRadius: '6px',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Answer Key Section - Short Answer */}
              {currentQuestionType === 'Short Answer' && (
                <div style={{
                  marginTop: '20px',
                  padding: '20px',
                  backgroundColor: '#d1ecf1',
                  borderRadius: '8px',
                  border: '1px solid #bee5eb'
                }}>
                  <h4 style={{
                    color: '#0c5460',
                    marginBottom: '15px',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    🔒 Answer Key (Admin Only - Hidden from Students)
                  </h4>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#0c5460' }}>
                      Model Answer/Key Points
                    </label>
                    <textarea
                      placeholder="Provide the ideal answer or key points that should be covered..."
                      value={currentQuestion.answerKey.shortAnswerKey}
                      onChange={(e) => handleAnswerKeyChange('shortAnswerKey', e.target.value)}
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '2px solid #bee5eb',
                        borderRadius: '6px',
                        fontSize: '1rem',
                        backgroundColor: 'white'
                      }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#0c5460' }}>
                      Grading Rubric
                    </label>
                    <textarea
                      placeholder="How should this answer be graded? (e.g., 5 marks for concept explanation, 3 marks for examples...)?"
                      value={currentQuestion.answerKey.gradingRubric}
                      onChange={(e) => handleAnswerKeyChange('gradingRubric', e.target.value)}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '2px solid #bee5eb',
                        borderRadius: '6px',
                        fontSize: '1rem',
                        backgroundColor: 'white'
                      }}
                    />
                  </div>
                </div>
              )}

              {currentQuestionType === 'Coding Challenge' && (
                <div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Problem Statement</label>
                    <textarea
                      placeholder="Describe the coding problem..."
                      value={currentQuestion.problemStatement}
                      onChange={(e) => handleQuestionChange('problemStatement', e.target.value)}
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ccc',
                        borderRadius: '6px',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Programming Language</label>
                    <select 
                      value={currentQuestion.language}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ccc',
                        borderRadius: '6px',
                        fontSize: '1rem'
                      }}>
                      <option value="">Select language</option>
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                      <option value="c">C</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Sample Input/Output</label>
                    <textarea
                      placeholder="Provide sample input and expected output..."
                      value={currentQuestion.sampleIO}
                      onChange={(e) => handleQuestionChange('sampleIO', e.target.value)}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ccc',
                        borderRadius: '6px',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                  
                  {/* Functional Code Editor */}
                  {currentQuestion.language && (
                    <div style={{ marginBottom: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label style={{ fontWeight: '600', color: '#2c3e50' }}>Code Template & Editor</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={() => {
                              const template = generateCodeTemplate(currentQuestion.language);
                              setCurrentQuestion(prev => ({ ...prev, codeTemplate: template }));
                            }}
                            style={{
                              backgroundColor: '#660018',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '5px 10px',
                              fontSize: '0.8rem',
                              cursor: 'pointer'
                            }}
                          >
                            Reset Template
                          </button>
                          <button
                            onClick={() => {
                              setCurrentQuestion(prev => ({ ...prev, codeTemplate: '' }));
                            }}
                            style={{
                              backgroundColor: '#660018',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '5px 10px',
                              fontSize: '0.8rem',
                              cursor: 'pointer'
                            }}
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                      
                      {/* Code Editor Container */}
                      <div style={{
                        border: '2px solid #007bff',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        backgroundColor: '#1e1e1e'
                      }}>
                        {/* Editor Header */}
                        <div style={{
                          backgroundColor: '#2d2d30',
                          padding: '8px 15px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          borderBottom: '1px solid #3e3e42'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ display: 'flex', gap: '5px' }}>
                              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ff5f57' }}></div>
                              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ffbd2e' }}></div>
                              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#28ca42' }}></div>
                            </div>
                            <span style={{ color: '#cccccc', fontSize: '0.9rem', fontFamily: 'monospace' }}>
                              main.{currentQuestion.language === 'javascript' ? 'js' : 
                                   currentQuestion.language === 'python' ? 'py' :
                                   currentQuestion.language === 'java' ? 'java' :
                                   currentQuestion.language === 'cpp' ? 'cpp' : 'c'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                              style={{
                                backgroundColor: '#660018',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                fontSize: '0.75rem',
                                cursor: 'pointer'
                              }}
                              onClick={() => {
                                // Simulate code execution
                                alert('Code executed successfully! (This is a preview - actual execution will be implemented in the exam interface)');
                              }}
                            >
                              ▶ Run
                            </button>
                            <button
                              style={{
                                backgroundColor: '#660018',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                fontSize: '0.75rem',
                                cursor: 'pointer'
                              }}
                              onClick={() => {
                                alert('Code submitted! (This is a preview)');
                              }}
                            >
                              Submit
                            </button>
                          </div>
                        </div>
                        
                        {/* Line Numbers */}
                        <div style={{ display: 'flex' }}>
                          <div style={{
                            backgroundColor: '#1e1e1e',
                            padding: '15px 10px',
                            borderRight: '1px solid #3e3e42',
                            fontFamily: 'monospace',
                            fontSize: '0.85rem',
                            color: '#858585',
                            lineHeight: '1.5',
                            userSelect: 'none',
                            minWidth: '40px',
                            textAlign: 'right'
                          }}>
                            {currentQuestion.codeTemplate.split('\n').map((_, index) => (
                              <div key={index}>{index + 1}</div>
                            ))}
                          </div>
                          
                          {/* Code Editor Textarea */}
                          <textarea
                            value={currentQuestion.codeTemplate}
                            onChange={(e) => handleQuestionChange('codeTemplate', e.target.value)}
                            placeholder={`Write your ${currentQuestion.language} code here...`}
                            style={{
                              flex: 1,
                              backgroundColor: '#1e1e1e',
                              color: '#d4d4d4',
                              border: 'none',
                              outline: 'none',
                              padding: '15px',
                              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                              fontSize: '0.9rem',
                              lineHeight: '1.5',
                              resize: 'vertical',
                              minHeight: '200px',
                              whiteSpace: 'pre',
                              overflow: 'auto'
                            }}
                            spellCheck={false}
                            onKeyDown={(e) => {
                              // Handle Tab key for indentation
                              if (e.key === 'Tab') {
                                e.preventDefault();
                                const start = e.target.selectionStart;
                                const end = e.target.selectionEnd;
                                const value = e.target.value;
                                const newValue = value.substring(0, start) + '    ' + value.substring(end);
                                setCurrentQuestion(prev => ({ ...prev, codeTemplate: newValue }));
                                setTimeout(() => {
                                  e.target.selectionStart = e.target.selectionEnd = start + 4;
                                }, 0);
                              }
                            }}
                          />
                        </div>
                        
                        {/* Output Panel */}
                        <div style={{
                          backgroundColor: '#252526',
                          borderTop: '1px solid #3e3e42',
                          padding: '10px 15px',
                          fontFamily: 'monospace',
                          fontSize: '0.85rem',
                          color: '#cccccc'
                        }}>
                          <strong style={{ color: '#4ec9b0' }}>Output:</strong>
                          <div style={{ marginTop: '5px', color: '#d4d4d4' }}>
                            Ready to execute code... (Students will see actual output here)
                          </div>
                        </div>
                      </div>
                      
                      {/* Code Editor Features */}
                      <div style={{
                        marginTop: '10px',
                        padding: '10px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        color: '#6c757d'
                      }}>
                        <strong>Features:</strong> Syntax highlighting, Auto-indentation, Tab support, Line numbers, Run & Submit buttons
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Answer Key Section - Coding Challenge */}
              {currentQuestionType === 'Coding Challenge' && (
                <div style={{
                  marginTop: '20px',
                  padding: '20px',
                  backgroundColor: '#e2e3f3',
                  borderRadius: '8px',
                  border: '1px solid #c5c6d8'
                }}>
                  <h4 style={{
                    color: '#383d41',
                    marginBottom: '15px',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    🔒 Answer Key (Admin Only - Hidden from Students)
                  </h4>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#383d41' }}>
                      Model Solution Code
                    </label>
                    <textarea
                      placeholder={`Provide the complete solution in ${currentQuestion.language || 'the selected language'}...`}
                      value={currentQuestion.answerKey.codingSolution}
                      onChange={(e) => handleAnswerKeyChange('codingSolution', e.target.value)}
                      rows={8}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '2px solid #c5c6d8',
                        borderRadius: '6px',
                        fontSize: '0.9rem',
                        backgroundColor: 'white',
                        fontFamily: 'Monaco, Menlo, monospace'
                      }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#383d41' }}>
                      Solution Explanation
                    </label>
                    <textarea
                      placeholder="Explain the approach, algorithm, time/space complexity..."
                      value={currentQuestion.answerKey.explanationNotes}
                      onChange={(e) => handleAnswerKeyChange('explanationNotes', e.target.value)}
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '2px solid #c5c6d8',
                        borderRadius: '6px',
                        fontSize: '1rem',
                        backgroundColor: 'white'
                      }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#383d41' }}>
                      Grading Criteria
                    </label>
                    <textarea
                      placeholder="How will this be graded? (e.g., 40% for correctness, 30% for efficiency, 20% for code quality, 10% for comments...)"
                      value={currentQuestion.answerKey.gradingRubric}
                      onChange={(e) => handleAnswerKeyChange('gradingRubric', e.target.value)}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '2px solid #c5c6d8',
                        borderRadius: '6px',
                        fontSize: '1rem',
                        backgroundColor: 'white'
                      }}
                    />
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Marks</label>
                <input
                  type="number"
                  placeholder="Enter marks for this question"
                  value={currentQuestion.marks}
                  onChange={(e) => handleQuestionChange('marks', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={addQuestion}
                  style={{
                    backgroundColor: isEditingQuestion ? '#28a745' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '10px 20px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  {isEditingQuestion ? 'Update Question' : 'Add Question'}
                </button>
                
                {!isEditingQuestion && examData.questions.length > 0 && (
                  <button
                    onClick={() => {
                      addQuestion();
                      // Keep form open for next question
                    }}
                    style={{
                      backgroundColor: '#17a2b8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '10px 20px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    Add & Continue
                  </button>
                )}
                
                <button
                  onClick={() => {
                    setShowQuestionForm(false);
                    setIsEditingQuestion(false);
                    setEditingQuestionId(null);
                  }}
                  style={{
                    backgroundColor: '#660018',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '10px 20px',
                    cursor: 'pointer'
                  }}
                >
                  {isEditingQuestion ? 'Cancel Edit' : 'Close Form'}
                </button>
              </div>
            </div>
          )}

          {/* Questions List */}
          {examData.questions.length > 0 && (
            <div style={{ marginTop: '30px' }}>
              <h3 style={{
                fontSize: '1.2rem',
                fontWeight: '600',
                color: '#2c3e50',
                marginBottom: '20px'
              }}>
                Added Questions ({examData.questions.length})
              </h3>
              
              {examData.questions.map((question, index) => (
                <div key={question.id} style={{
                  backgroundColor: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  padding: '20px',
                  marginBottom: '15px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <span style={{
                          backgroundColor: question.type === 'MCQ' ? '#007bff' : question.type === 'Short Answer' ? '#28a745' : '#6f42c1',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: '500'
                        }}>
                          {question.type}
                        </span>
                        <span style={{ fontWeight: '600', color: '#2c3e50' }}>
                          Question {question.questionNumber || index + 1}
                        </span>
                        <span style={{ color: '#6c757d', fontSize: '0.9rem' }}>
                          ({question.marks} marks)
                        </span>
                      </div>
                      
                      <p style={{ color: '#2c3e50', marginBottom: '10px', lineHeight: '1.5' }}>
                        {question.type === 'Coding Challenge' ? question.problemStatement : question.question}
                      </p>
                      
                      {question.type === 'MCQ' && (
                        <div style={{ fontSize: '0.9rem', color: '#6c757d', marginBottom: '8px' }}>
                          <strong>Options:</strong> {question.options.join(', ')}<br/>
                          <span style={{ color: '#28a745', fontWeight: '600' }}>
                            ✓ Answer Key Set {question.answerKey?.mcqCorrectAnswer ? '(Secured)' : '(Missing)'}
                          </span>
                        </div>
                      )}
                      
                      {question.type === 'Short Answer' && (
                        <div style={{ fontSize: '0.9rem', color: '#6c757d', marginBottom: '8px' }}>
                          <span style={{ color: '#28a745', fontWeight: '600' }}>
                            ✓ Answer Key {question.answerKey?.shortAnswerKey ? 'Secured' : 'Missing'}
                          </span>
                          {question.expectedAnswer && (
                            <><br/><strong>Expected Answer:</strong> {question.expectedAnswer}</>
                          )}
                        </div>
                      )}
                      
                      {question.type === 'Coding Challenge' && (
                        <div style={{ fontSize: '0.9rem', color: '#6c757d', marginBottom: '8px' }}>
                          <strong>Language:</strong> {question.language}<br/>
                          {question.sampleIO && (
                            <><strong>Sample I/O:</strong> {question.sampleIO}<br/></>
                          )}
                          <span style={{ color: '#28a745', fontWeight: '600' }}>
                            ✓ Solution {question.answerKey?.codingSolution ? 'Secured' : 'Missing'}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => editQuestion(question)}
                        style={{
                          backgroundColor: '#17a2b8',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => removeQuestion(question.id)}
                        style={{
                          backgroundColor: '#660018',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {examData.questions.length === 0 && !showQuestionForm && (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#6c757d',
              fontSize: '1.1rem'
            }}>
              No questions added yet. Click on a question type button to start adding questions.
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      padding: '0'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button
            onClick={() => setCurrentPage('home')}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#800020',
              fontSize: '1.5rem',
              cursor: 'pointer'
            }}
          >
            ←
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#660018',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ color: 'white', fontSize: '1.2rem' }}>🎓</span>
            </div>
            <h1 style={{
              fontSize: '1.8rem',
              fontWeight: '600',
              color: '#2c3e50',
              margin: '0'
            }}>
              Admin Dashboard
            </h1>
          </div>
        </div>
        <button
          onClick={() => setCurrentPage('home')}
          style={{
            backgroundColor: '#660018',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '0.9rem',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          Logout
        </button>
      </div>

      {/* Dashboard Cards */}
      <div style={{
        padding: '40px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '30px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Create Exam Card */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '15px',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        onClick={handleCreateExam}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-5px)';
          e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.15)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
        }}
        >
          {/* Icon */}
          <div style={{
            fontSize: '3rem',
            marginBottom: '20px'
          }}>
            📝
          </div>
          
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#2c3e50',
            marginBottom: '15px'
          }}>
            Create Exam
          </h3>
          
          <p style={{
            fontSize: '1rem',
            color: '#7f8c8d',
            lineHeight: '1.5'
          }}>
            Create new exams with multiple question types and customizable settings
          </p>
        </div>

        {/* View Results Card */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '15px',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        onClick={handleViewResults}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-5px)';
          e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.15)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
        }}
        >
          {/* Icon */}
          <div style={{
            fontSize: '3rem',
            marginBottom: '20px'
          }}>
            📊
          </div>
          
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#2c3e50',
            marginBottom: '15px'
          }}>
            View Results
          </h3>
          
          <p style={{
            fontSize: '1rem',
            color: '#7f8c8d',
            lineHeight: '1.5'
          }}>
            View and analyze exam results and student performance
          </p>
        </div>

        {/* Manage Students Card */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '15px',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        onClick={handleManageStudents}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-5px)';
          e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.15)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
        }}
        >
          {/* Icon */}
          <div style={{
            fontSize: '3rem',
            marginBottom: '20px'
          }}>
            👥
          </div>
          
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#2c3e50',
            marginBottom: '15px'
          }}>
            Manage Students
          </h3>
          
          <p style={{
            fontSize: '1rem',
            color: '#7f8c8d',
            lineHeight: '1.5'
          }}>
            Manage student accounts and permissions
          </p>
        </div>

        {/* Settings Card */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '15px',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        onClick={handleSettings}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-5px)';
          e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.15)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
        }}
        >
          {/* Icon */}
          <div style={{
            fontSize: '3rem',
            marginBottom: '20px'
          }}>
            ⚙️
          </div>
          
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#2c3e50',
            marginBottom: '15px'
          }}>
            Settings
          </h3>
          
          <p style={{
            fontSize: '1rem',
            color: '#7f8c8d',
            lineHeight: '1.5'
          }}>
            Configure system settings and preferences
          </p>
        </div>
      </div>
    </div>
  );

  // Sign In Page
  const renderSignInPage = () => (
    <div style={{
      textAlign: 'center',
      maxWidth: '450px',
      padding: '40px 20px'
    }}>
      {/* Back Button */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px'
      }}>
        <button
          onClick={handleBackToRegistration}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: '#800020',
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          ← Back to Registration
        </button>
      </div>

      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '15px',
        padding: '40px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)'
      }}>
        {/* Icon */}
        <div style={{
          width: '80px',
          height: '80px',
          backgroundColor: '#660018',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px auto'
        }}>
          <span style={{
            fontSize: '35px',
            color: 'white'
          }}>
            🔐
          </span>
        </div>

        {/* Title */}
        <h2 style={{
          fontSize: '2rem',
          fontWeight: '700',
          color: '#800020',
          marginBottom: '10px'
        }}>
          Sign In
        </h2>

        {/* Subtitle */}
        <p style={{
          fontSize: '1rem',
          color: '#7f8c8d',
          marginBottom: '30px'
        }}>
          Welcome back! Please sign in to your account
        </p>

        {/* Message Display */}
        {message && (
          <div style={{
            padding: '12px',
            marginBottom: '20px',
            borderRadius: '8px',
            backgroundColor: message.includes('Welcome') || message.includes('successfully') 
              ? '#d4edda' : '#f8d7da',
            color: message.includes('Welcome') || message.includes('successfully') 
              ? '#155724' : '#721c24',
            border: `1px solid ${message.includes('Welcome') || message.includes('successfully') 
              ? '#c3e6cb' : '#f5c6cb'}`,
            fontSize: '0.9rem'
          }}>
            {message}
          </div>
        )}

        {/* Sign In Form */}
        <form style={{ textAlign: 'left' }}>
          {/* Email Address */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: '600',
              color: '#2c3e50',
              marginBottom: '8px'
            }}>
              Email Address
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={signinData.email}
              onChange={(e) => handleSigninChange('email', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '1rem',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                backgroundColor: 'white',
                color: '#2c3e50',
                outline: 'none',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#800020'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '30px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: '600',
              color: '#2c3e50',
              marginBottom: '8px'
            }}>
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={signinData.password}
              onChange={(e) => handleSigninChange('password', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '1rem',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                backgroundColor: 'white',
                color: '#2c3e50',
                outline: 'none',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#800020'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>

          {/* Sign In Button */}
          <button
            type="button"
            onClick={handleSignIn}
            disabled={false}
            style={{
              width: '100%',
              backgroundColor: '#660018',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '15px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(128, 0, 32, 0.3)'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#800020';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#660018';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            {currentUser ? 'Switch User' : 'Sign In'}
          </button>
        </form>

        {/* Register Link */}
        <p style={{
          fontSize: '0.9rem',
          color: '#7f8c8d',
          marginTop: '20px',
          textAlign: 'center'
        }}>
          Don't have an account? 
          <span 
            onClick={handleBackToRegistration}
            style={{
              color: '#800020',
              cursor: 'pointer',
              marginLeft: '5px',
              textDecoration: 'underline'
            }}
          >
            Create Account
          </span>
        </p>

        {/* Current User Display */}
        {currentUser && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#e8f5e8',
            borderRadius: '8px',
            border: '1px solid #c3e6cb'
          }}>
            <p style={{
              margin: '0',
              fontSize: '0.9rem',
              color: '#155724'
            }}>
              <strong>Logged in as:</strong> {currentUser.fullName}<br/>
              <strong>Role:</strong> {currentUser.role}<br/>
              <strong>Email:</strong> {currentUser.email}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // Registration Page
  const renderRegistrationPage = () => (
    <div style={{
      textAlign: 'center',
      maxWidth: '500px',
      padding: '40px 20px'
    }}>
      {/* Back Button */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px'
      }}>
        <button
          onClick={handleBackToRoleSelection}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: '#800020',
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          ← Back to Role Selection
        </button>
      </div>

      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '15px',
        padding: '40px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)'
      }}>
        {/* Icon */}
        <div style={{
          width: '80px',
          height: '80px',
          backgroundColor: '#660018',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px auto'
        }}>
          <span style={{
            fontSize: '35px',
            color: 'white'
          }}>
            👥
          </span>
        </div>

        {/* Title */}
        <h2 style={{
          fontSize: '2rem',
          fontWeight: '700',
          color: '#800020',
          marginBottom: '10px'
        }}>
          {selectedRole === 'Admin/Educator' ? 'Exam Creator' : 
           selectedRole === 'Student' ? 'Student Registration' : 'Proctor Registration'}
        </h2>

        {/* Subtitle */}
        <p style={{
          fontSize: '1rem',
          color: '#7f8c8d',
          marginBottom: '30px'
        }}>
          Create your {selectedRole.toLowerCase()} account
        </p>

        {/* Message Display */}
        {message && (
          <div style={{
            padding: '12px',
            marginBottom: '20px',
            borderRadius: '8px',
            backgroundColor: message.includes('successfully') ? '#d4edda' : '#f8d7da',
            color: message.includes('successfully') ? '#155724' : '#721c24',
            border: `1px solid ${message.includes('successfully') ? '#c3e6cb' : '#f5c6cb'}`,
            fontSize: '0.9rem'
          }}>
            {message}
          </div>
        )}

        {/* Registration Form */}
        <form style={{ textAlign: 'left' }}>
          {/* Full Name */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: '600',
              color: '#2c3e50',
              marginBottom: '8px'
            }}>
              Full Name
            </label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={(e) => handleFormChange('fullName', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '1rem',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                backgroundColor: 'white',
                color: '#2c3e50',
                outline: 'none',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#800020'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>

          {/* Email Address */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: '600',
              color: '#2c3e50',
              marginBottom: '8px'
            }}>
              Email Address
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => handleFormChange('email', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '1rem',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                backgroundColor: 'white',
                color: '#2c3e50',
                outline: 'none',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#800020'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>

          {/* Institution/Organization */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: '600',
              color: '#2c3e50',
              marginBottom: '8px'
            }}>
              Institution/Organization
            </label>
            <input
              type="text"
              placeholder="Enter your institution"
              value={formData.institution}
              onChange={(e) => handleFormChange('institution', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '1rem',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                backgroundColor: 'white',
                color: '#2c3e50',
                outline: 'none',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#800020'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>

          {/* Department/Subject */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: '600',
              color: '#2c3e50',
              marginBottom: '8px'
            }}>
              Department/Subject
            </label>
            <input
              type="text"
              placeholder="Enter your department"
              value={formData.department}
              onChange={(e) => handleFormChange('department', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '1rem',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                backgroundColor: 'white',
                color: '#2c3e50',
                outline: 'none',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#800020'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: '600',
              color: '#2c3e50',
              marginBottom: '8px'
            }}>
              Password
            </label>
            <input
              type="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={(e) => handleFormChange('password', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '1rem',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                backgroundColor: 'white',
                color: '#2c3e50',
                outline: 'none',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#800020'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: '30px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: '600',
              color: '#2c3e50',
              marginBottom: '8px'
            }}>
              Confirm Password
            </label>
            <input
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => handleFormChange('confirmPassword', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '1rem',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                backgroundColor: 'white',
                color: '#2c3e50',
                outline: 'none',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#800020'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>

          {/* Register Button */}
          <button
            type="button"
            onClick={handleRegistration}
            style={{
              width: '100%',
              backgroundColor: '#660018',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '15px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(128, 0, 32, 0.3)'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#660018';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#800020';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            Create Account
          </button>
        </form>

        {/* Login Link */}
        <p style={{
          fontSize: '0.9rem',
          color: '#7f8c8d',
          marginTop: '20px',
          textAlign: 'center'
        }}>
          Already have an account? 
          <span 
            onClick={handleGoToSignIn}
            style={{
              color: '#800020',
              cursor: 'pointer',
              marginLeft: '5px',
              textDecoration: 'underline'
            }}
          >
            Sign In
          </span>
        </p>
      </div>
    </div>
  );

  // Role Selection Page
  const renderRoleSelection = () => (
    <div style={{
      textAlign: 'center',
      maxWidth: '600px',
      padding: '40px 20px'
    }}>
      <h1 style={{
        fontSize: '3rem',
        fontWeight: '700',
        marginBottom: '20px',
        color: '#800020'
      }}>
        Select Your Role
      </h1>
      
      <p style={{
        fontSize: '1.2rem',
        color: '#7f8c8d',
        marginBottom: '40px'
      }}>
        Choose your role to access the appropriate features and dashboard
      </p>

      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '15px',
        padding: '40px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)'
      }}>
        <div style={{
          marginBottom: '30px'
        }}>
          <label style={{
            display: 'block',
            fontSize: '1.1rem',
            fontWeight: '600',
            color: '#2c3e50',
            marginBottom: '15px',
            textAlign: 'left'
          }}>
            I am a:
          </label>
          
          <select 
            value={selectedRole}
            onChange={handleRoleChange}
            style={{
              width: '100%',
              padding: '15px',
              fontSize: '1rem',
              border: '2px solid #ddd',
              borderRadius: '8px',
              backgroundColor: 'white',
              color: '#2c3e50',
              cursor: 'pointer'
            }}
          >
            <option value="Admin/Educator">Admin/Educator</option>
            <option value="Student">Student</option>
            <option value="Proctor">Proctor</option>
          </select>
        </div>

        {/* Features Section */}
        <div style={{
          backgroundColor: '#e8f4f8',
          borderRadius: '10px',
          padding: '25px',
          marginBottom: '30px',
          textAlign: 'left'
        }}>
          <h3 style={{
            color: '#2c3e50',
            marginBottom: '15px',
            fontSize: '1.3rem'
          }}>
            {selectedRole} Features:
          </h3>
          
          <ul style={{
            listStyle: 'none',
            padding: '0',
            margin: '0'
          }}>
            {selectedRole === 'Admin/Educator' && (
              <>
                <li style={{ color: '#5a9fd4', marginBottom: '8px' }}>• Create and manage examinations</li>
                <li style={{ color: '#5a9fd4', marginBottom: '8px' }}>• Monitor student progress and performance</li>
                <li style={{ color: '#5a9fd4', marginBottom: '8px' }}>• Access advanced analytics and reports</li>
                <li style={{ color: '#5a9fd4', marginBottom: '8px' }}>• Configure proctoring settings</li>
                <li style={{ color: '#5a9fd4', marginBottom: '8px' }}>• Manage user accounts and permissions</li>
              </>
            )}
            {selectedRole === 'Student' && (
              <>
                <li style={{ color: '#5a9fd4', marginBottom: '8px' }}>• Take assigned examinations</li>
                <li style={{ color: '#5a9fd4', marginBottom: '8px' }}>• View exam schedules and results</li>
                <li style={{ color: '#5a9fd4', marginBottom: '8px' }}>• Access practice tests</li>
                <li style={{ color: '#5a9fd4', marginBottom: '8px' }}>• Submit assignments and projects</li>
                <li style={{ color: '#5a9fd4', marginBottom: '8px' }}>• Track academic progress</li>
              </>
            )}
            {selectedRole === 'Proctor' && (
              <>
                <li style={{ color: '#5a9fd4', marginBottom: '8px' }}>• Monitor live examinations</li>
                <li style={{ color: '#5a9fd4', marginBottom: '8px' }}>• Review student behavior analytics</li>
                <li style={{ color: '#5a9fd4', marginBottom: '8px' }}>• Generate proctoring reports</li>
                <li style={{ color: '#5a9fd4', marginBottom: '8px' }}>• Handle exam violations</li>
                <li style={{ color: '#5a9fd4', marginBottom: '8px' }}>• Communicate with exam administrators</li>
              </>
            )}
          </ul>
        </div>

        {/* Continue Button */}
        <button 
          onClick={handleContinue}
          style={{
            backgroundColor: '#660018',
            color: 'white',
            border: 'none',
            borderRadius: '50px',
            padding: '15px 40px',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 6px 20px rgba(128, 0, 32, 0.3)',
            width: '100%'
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = '#660018';
            e.target.style.transform = 'translateY(-2px)';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = '#800020';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          Continue
        </button>
      </div>

      <p style={{
        fontSize: '0.9rem',
        color: '#95a5a6',
        marginTop: '20px'
      }}>
        Need help? Contact support at support@examportal.com
      </p>
    </div>
  );

  // Home Page
  const renderHomePage = () => (
    <div className="App" style={{
      backgroundImage: `url(${backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '800px',
        padding: '40px 20px'
      }}>
        {/* Graduation Cap Icon */}
        <div style={{
          width: '120px',
          height: '120px',
          backgroundColor: 'rgba(128, 128, 128, 0.3)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 40px auto',
          boxShadow: '0 8px 25px rgba(128, 128, 128, 0.2)',
          position: 'relative'
        }}>
          <span style={{
            fontSize: '55px',
            color: '#2c3e50',
            lineHeight: '1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            margin: '0',
            padding: '0'
          }}>
            🎓
          </span>
        </div>

        {/* Main Title */}
        <h1 style={{
          fontSize: '4rem',
          fontWeight: '700',
          marginBottom: '20px',
          lineHeight: '1.2'
        }}>
          <span style={{ color: '#800020' }}>Examination</span>
          <br />
          <span style={{ color: '#2c3e50' }}>Portal</span>
        </h1>

        {/* Description */}
        <p style={{
          fontSize: '1.3rem',
          color: '#7f8c8d',
          marginBottom: '50px',
          lineHeight: '1.6',
          maxWidth: '700px',
          margin: '0 auto 50px auto'
        }}>
          "Empowering secure, seamless, and insightful online assessments with real-time monitoring and advanced analytics."
        </p>

        {/* Get Started Button */}
        <button 
          onClick={handleGetStarted}
          style={{
            backgroundColor: '#660018',
            color: 'white',
            border: 'none',
            borderRadius: '50px',
            padding: '18px 40px',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 6px 20px rgba(128, 0, 32, 0.3)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px'
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = '#660018';
            e.target.style.transform = 'translateY(-3px)';
            e.target.style.boxShadow = '0 8px 25px rgba(128, 0, 32, 0.4)';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = '#800020';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 6px 20px rgba(128, 0, 32, 0.3)';
          }}
        >
          Get Started
          <span style={{ fontSize: '1.2rem' }}>→</span>
        </button>
      </div>
    </div>
  );

  // Student Dashboard
  const renderStudentDashboard = () => {
    if (examStarted && currentExam) {
      // Exam Interface
      return (
        <div style={{
          width: '100%',
          maxWidth: '900px',
          margin: '20px auto',
          padding: '20px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '15px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          {/* Exam Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '30px',
            padding: '20px',
            backgroundColor: '#660018',
            borderRadius: '10px',
            color: 'white'
          }}>
            <div>
              <h2 style={{ margin: '0', fontSize: '1.5rem' }}>{currentExam.title}</h2>
              <p style={{ margin: '5px 0 0 0', opacity: '0.9' }}>{currentExam.subject}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
                {formatTime(examTimeRemaining)}
              </div>
              <p style={{ margin: '0', fontSize: '0.9rem', opacity: '0.9' }}>Time Remaining</p>
            </div>
          </div>

          {/* Questions */}
          <div style={{ marginBottom: '30px' }}>
            {(currentExam.questions || []).map((question, index) => (
              <div key={question.id} style={{
                marginBottom: '30px',
                padding: '25px',
                backgroundColor: '#f8f9fa',
                borderRadius: '10px',
                border: '1px solid #e9ecef'
              }}>
                <h3 style={{
                  color: '#2c3e50',
                  marginBottom: '15px',
                  fontSize: '1.2rem'
                }}>
                  Question {index + 1} ({question.marks} marks)
                </h3>
                <p style={{
                  fontSize: '1.1rem',
                  color: '#2c3e50',
                  marginBottom: '20px',
                  lineHeight: '1.6'
                }}>
                  {question.question}
                </p>

                {question.type === 'multiple-choice' && (
                  <div>
                    {(question.options || []).map((option, optionIndex) => (
                      <div key={optionIndex} style={{ marginBottom: '10px' }}>
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                          padding: '10px',
                          borderRadius: '6px',
                          backgroundColor: studentAnswers[question.id] === option ? '#e3f2fd' : 'white',
                          border: `2px solid ${studentAnswers[question.id] === option ? '#660018' : '#ddd'}`,
                          transition: 'all 0.3s ease'
                        }}>
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            value={option}
                            checked={studentAnswers[question.id] === option}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                            style={{ marginRight: '10px' }}
                          />
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Submit Button */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handleSubmitExam}
              style={{
                backgroundColor: '#660018',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '15px 40px',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(128, 0, 32, 0.3)'
              }}
            >
              Submit Exam
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={{
        width: '100%',
        maxWidth: '800px',
        margin: '20px auto',
        padding: '20px'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            color: '#800020',
            marginBottom: '10px'
          }}>
            Student Dashboard
          </h1>
          <p style={{
            fontSize: '1.2rem',
            color: '#7f8c8d',
            marginBottom: '20px'
          }}>
            Welcome back, {currentUser?.fullName}!
          </p>
        </div>

        {/* Message Display */}
        {message && (
          <div style={{
            padding: '15px',
            marginBottom: '30px',
            borderRadius: '8px',
            backgroundColor: message.includes('successfully') || message.includes('found') || message.includes('started')
              ? '#d4edda' : '#f8d7da',
            color: message.includes('successfully') || message.includes('found') || message.includes('started')
              ? '#155724' : '#721c24',
            border: `1px solid ${message.includes('successfully') || message.includes('found') || message.includes('started')
              ? '#c3e6cb' : '#f5c6cb'}`,
            fontSize: '1rem',
            textAlign: 'center'
          }}>
            {message}
          </div>
        )}

        {showResults ? (
          // Exam Results Display
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '15px',
            padding: '40px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <div style={{
                width: '80px',
                height: '80px',
                backgroundColor: studentExamResult?.passed ? '#28a745' : '#dc3545',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 25px auto'
              }}>
                <span style={{ fontSize: '35px', color: 'white' }}>
                  {studentExamResult?.passed ? '🎉' : '📝'}
                </span>
              </div>

              <h2 style={{
                fontSize: '2rem',
                fontWeight: '600',
                color: studentExamResult?.passed ? '#28a745' : '#dc3545',
                marginBottom: '10px'
              }}>
                {studentExamResult?.passed ? 'Congratulations!' : 'Keep Trying!'}
              </h2>

              <p style={{
                fontSize: '1.2rem',
                color: '#7f8c8d',
                marginBottom: '30px'
              }}>
                You have completed the {studentExamResult?.examTitle}
              </p>
            </div>

            {/* Score Summary */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              <div style={{
                textAlign: 'center',
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '10px'
              }}>
                <h3 style={{ color: '#660018', fontSize: '2rem', margin: '0' }}>
                  {studentExamResult?.totalScore}/{studentExamResult?.maxScore}
                </h3>
                <p style={{ color: '#7f8c8d', margin: '5px 0 0 0' }}>Your Score</p>
              </div>
              <div style={{
                textAlign: 'center',
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '10px'
              }}>
                <h3 style={{ color: '#660018', fontSize: '2rem', margin: '0' }}>
                  {studentExamResult?.percentage}%
                </h3>
                <p style={{ color: '#7f8c8d', margin: '5px 0 0 0' }}>Percentage</p>
              </div>
              <div style={{
                textAlign: 'center',
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '10px'
              }}>
                <h3 style={{ color: '#660018', fontSize: '2rem', margin: '0' }}>
                  {Math.floor((studentExamResult?.timeTaken || 0) / 60)}:{((studentExamResult?.timeTaken || 0) % 60).toString().padStart(2, '0')}
                </h3>
                <p style={{ color: '#7f8c8d', margin: '5px 0 0 0' }}>Time Taken</p>
              </div>
            </div>

            {/* Question Results */}
            <div style={{
              backgroundColor: '#f8f9fa',
              borderRadius: '10px',
              padding: '25px',
              marginBottom: '30px'
            }}>
              <h3 style={{ color: '#2c3e50', marginBottom: '20px' }}>Question-wise Results</h3>
              {studentExamResult?.questionResults.map((result, index) => (
                <div key={result.questionId} style={{
                  padding: '15px',
                  marginBottom: '15px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  borderLeft: `4px solid ${result.isCorrect ? '#28a745' : '#dc3545'}`
                }}>
                  <p style={{ fontWeight: 'bold', color: '#2c3e50', marginBottom: '10px' }}>
                    Question {index + 1}: {result.question}
                  </p>
                  <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                    <p style={{ margin: '5px 0' }}>
                      <strong>Your Answer:</strong> <span style={{ color: result.isCorrect ? '#28a745' : '#dc3545' }}>
                        {result.studentAnswer}
                      </span>
                    </p>
                    <p style={{ margin: '5px 0' }}>
                      <strong>Correct Answer:</strong> <span style={{ color: '#28a745' }}>
                        {result.correctAnswer}
                      </span>
                    </p>
                    <p style={{ margin: '5px 0' }}>
                      <strong>Score:</strong> {result.earnedMarks}/{result.totalMarks} marks
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div style={{ textAlign: 'center', display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  setShowResults(false);
                  setCurrentExam(null);
                  setStudentExamResult(null);
                  setExamCode('');
                  setStudentAnswers({});
                  setMessage('');
                }}
                style={{
                  backgroundColor: '#660018',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 25px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Take Another Exam
              </button>
              <button
                onClick={() => {
                  setCurrentUser(null);
                  setCurrentPage('home');
                  setCurrentExam(null);
                  setExamCode('');
                  setExamStarted(false);
                  setStudentAnswers({});
                  setShowResults(false);
                  setStudentExamResult(null);
                  setMessage('');
                }}
                style={{
                  backgroundColor: 'transparent',
                  color: '#660018',
                  border: '2px solid #660018',
                  borderRadius: '8px',
                  padding: '12px 25px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Logout
              </button>
            </div>
          </div>
        ) : !currentExam ? (
          // Exam Selection with Dropdown
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '15px',
            padding: '40px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(10px)',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              backgroundColor: '#660018',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 25px auto'
            }}>
              <span style={{ fontSize: '35px', color: 'white' }}>📝</span>
            </div>

            <h2 style={{
              fontSize: '1.8rem',
              fontWeight: '600',
              color: '#2c3e50',
              marginBottom: '15px',
              textAlign: 'center'
            }}>
              Select Your Exam
            </h2>

            <p style={{
              fontSize: '1rem',
              color: '#7f8c8d',
              marginBottom: '30px',
              lineHeight: '1.6',
              textAlign: 'center'
            }}>
              Choose an exam from the dropdown menu to get started.
            </p>

            {/* Exam Dropdown Selector */}
            <div style={{ marginBottom: '30px' }}>
              <label style={{
                display: 'block',
                fontSize: '1rem',
                fontWeight: '600',
                color: '#2c3e50',
                marginBottom: '10px',
                textAlign: 'left'
              }}>
                Available Exams:
              </label>
              <select
                value={examCode}
                onChange={(e) => {
                  const selectedExamId = e.target.value;
                  if (selectedExamId) {
                    const selectedExam = availableExams.find(exam => exam._id === selectedExamId);
                    if (selectedExam) {
                      setCurrentExam(selectedExam);
                      setExamTimeRemaining(selectedExam.duration * 60);
                      setExamCode(selectedExam.accessCode || selectedExamId);
                    }
                  } else {
                    setExamCode('');
                  }
                }}
                style={{
                  width: '100%',
                  padding: '15px',
                  fontSize: '1.1rem',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  color: '#2c3e50',
                  outline: 'none',
                  cursor: 'pointer'
                }}
                onFocus={(e) => e.target.style.borderColor = '#660018'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              >
                <option value="">-- Select an Exam --</option>
                {availableExams.length > 0 ? (
                  availableExams.map((exam) => {
                    const now = new Date();
                    const startDate = new Date(exam.startDate);
                    const endDate = new Date(exam.endDate);
                    const isActive = now >= startDate && now <= endDate;
                    const status = isActive ? '🟢 Active' : (now < startDate ? '🟡 Upcoming' : '⚫ Ended');
                    
                    return (
                      <option 
                        key={exam._id} 
                        value={exam._id}
                        disabled={!isActive}
                      >
                        {status} | {exam.title} - {exam.subject} ({exam.duration} mins, {exam.totalMarks} marks)
                      </option>
                    );
                  })
                ) : (
                  <option value="" disabled>No exams available</option>
                )}
              </select>
            </div>

            {/* Available Exams List */}
            {availableExams.length > 0 && (
              <div style={{
                marginTop: '30px',
                padding: '25px',
                backgroundColor: '#f8f9fa',
                borderRadius: '10px',
                textAlign: 'left'
              }}>
                <h4 style={{ 
                  color: '#2c3e50', 
                  marginBottom: '20px',
                  fontSize: '1.2rem',
                  fontWeight: '600'
                }}>
                  📋 All Available Exams ({availableExams.length})
                </h4>
                <div style={{ 
                  display: 'grid', 
                  gap: '15px',
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  {availableExams.map((exam) => {
                    const now = new Date();
                    const startDate = new Date(exam.startDate);
                    const endDate = new Date(exam.endDate);
                    const isActive = now >= startDate && now <= endDate;
                    const statusColor = isActive ? '#28a745' : (now < startDate ? '#ffc107' : '#6c757d');
                    const statusText = isActive ? 'Active' : (now < startDate ? 'Upcoming' : 'Ended');
                    
                    return (
                      <div key={exam._id} style={{
                        padding: '15px',
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        border: `2px solid ${isActive ? '#28a745' : '#e0e0e0'}`,
                        boxShadow: isActive ? '0 2px 8px rgba(40, 167, 69, 0.1)' : 'none'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'start',
                          marginBottom: '10px'
                        }}>
                          <div style={{ flex: 1 }}>
                            <h5 style={{ 
                              color: '#2c3e50', 
                              margin: '0 0 5px 0',
                              fontSize: '1.1rem',
                              fontWeight: '600'
                            }}>
                              {exam.title}
                            </h5>
                            <p style={{ 
                              color: '#7f8c8d', 
                              margin: '0',
                              fontSize: '0.9rem'
                            }}>
                              {exam.subject} • {exam.createdBy?.name || 'Teacher'}
                            </p>
                          </div>
                          <span style={{
                            padding: '4px 12px',
                            backgroundColor: statusColor,
                            color: 'white',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: '600'
                          }}>
                            {statusText}
                          </span>
                        </div>
                        <div style={{
                          display: 'flex',
                          gap: '15px',
                          fontSize: '0.85rem',
                          color: '#6c757d',
                          marginTop: '10px'
                        }}>
                          <span>⏱️ {exam.duration} mins</span>
                          <span>📊 {exam.totalMarks} marks</span>
                          <span>📅 {new Date(exam.startDate).toLocaleDateString()}</span>
                        </div>
                        {isActive && (
                          <button
                            onClick={() => {
                              setCurrentExam(exam);
                              setExamTimeRemaining(exam.duration * 60);
                              setExamCode(exam.accessCode || exam._id);
                            }}
                            style={{
                              marginTop: '12px',
                              width: '100%',
                              padding: '10px',
                              backgroundColor: '#660018',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '0.95rem',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            Start This Exam →
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {availableExams.length === 0 && (
              <div style={{
                padding: '30px',
                textAlign: 'center',
                backgroundColor: '#fff3cd',
                borderRadius: '8px',
                marginTop: '20px'
              }}>
                <p style={{ 
                  color: '#856404',
                  fontSize: '1.1rem',
                  margin: '0'
                }}>
                  📚 No exams are currently available. Please check back later or contact your instructor.
                </p>
              </div>
            )}
          </div>
        ) : (
          // Exam Preview
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '15px',
            padding: '40px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h2 style={{
                fontSize: '2rem',
                fontWeight: '600',
                color: '#660018',
                marginBottom: '10px'
              }}>
                {currentExam.title}
              </h2>
              <p style={{
                fontSize: '1.2rem',
                color: '#7f8c8d',
                marginBottom: '25px'
              }}>
                {currentExam.subject}
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              <div style={{
                textAlign: 'center',
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '10px'
              }}>
                <h3 style={{ color: '#660018', fontSize: '1.5rem', margin: '0' }}>
                  {currentExam.duration}
                </h3>
                <p style={{ color: '#7f8c8d', margin: '5px 0 0 0' }}>Minutes</p>
              </div>
              <div style={{
                textAlign: 'center',
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '10px'
              }}>
                <h3 style={{ color: '#660018', fontSize: '1.5rem', margin: '0' }}>
                  {currentExam.questions?.length || 0}
                </h3>
                <p style={{ color: '#7f8c8d', margin: '5px 0 0 0' }}>Questions</p>
              </div>
              <div style={{
                textAlign: 'center',
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '10px'
              }}>
                <h3 style={{ color: '#660018', fontSize: '1.5rem', margin: '0' }}>
                  {currentExam.totalMarks}
                </h3>
                <p style={{ color: '#7f8c8d', margin: '5px 0 0 0' }}>Total Marks</p>
              </div>
            </div>

            <div style={{
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '30px'
            }}>
              <h4 style={{ color: '#856404', marginBottom: '10px' }}>Important Instructions:</h4>
              <ul style={{ color: '#856404', margin: '0', paddingLeft: '20px' }}>
                <li>You have {currentExam.duration} minutes to complete this exam</li>
                <li>Once started, the timer cannot be paused</li>
                <li>Make sure you have a stable internet connection</li>
                <li>You can change your answers before submitting</li>
                <li>The exam will auto-submit when time runs out</li>
              </ul>
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                onClick={handleStartExam}
                style={{
                  backgroundColor: '#660018',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '15px 40px',
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(128, 0, 32, 0.3)'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#800020';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = '#660018';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                Start Exam
              </button>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <button
            onClick={() => {
              setCurrentUser(null);
              setCurrentPage('home');
              setCurrentExam(null);
              setExamCode('');
              setExamStarted(false);
              setStudentAnswers({});
              setMessage('');
            }}
            style={{
              backgroundColor: 'transparent',
              color: '#800020',
              border: '2px solid #800020',
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#800020';
              e.target.style.color = 'white';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#800020';
            }}
          >
            Logout
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="App" style={{
      backgroundImage: `url(${backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      minHeight: '100vh',
      display: 'flex',
      alignItems: currentPage === 'dashboard' ? 'flex-start' : 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      position: 'relative'
    }}>
      {currentPage === 'home' && renderHomePage()}
      {currentPage === 'roleSelection' && renderRoleSelection()}
      {currentPage === 'registration' && renderRegistrationPage()}
      {currentPage === 'signin' && renderSignInPage()}
      {currentPage === 'dashboard' && renderDashboard()}
      {currentPage === 'studentDashboard' && renderStudentDashboard()}
      {currentPage === 'createExam' && renderCreateExamPage()}
      {currentPage === 'viewResults' && renderViewResultsPage()}
      {currentPage === 'manageStudents' && renderManageStudentsPage()}
      {currentPage === 'settings' && renderSettingsPage()}
    </div>
  );
}

export default App;