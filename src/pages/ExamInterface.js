import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Clock, 
  Camera, 
  Mic, 
  Monitor, 
  AlertTriangle, 
  FileText,
  Save,
  Send,
  Maximize,
  Minimize
} from 'lucide-react';

const ExamInterface = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [exam, setExam] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [warnings, setWarnings] = useState([]);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [screenRecording, setScreenRecording] = useState(false);

  useEffect(() => {
    fetchExamData();
    initializeProctoring();
    
    // Disable right-click and keyboard shortcuts
    const handleContextMenu = (e) => e.preventDefault();
    const handleKeyDown = (e) => {
      if (e.key === 'F12' || (e.ctrlKey && (e.key === 'u' || e.key === 'U'))) {
        e.preventDefault();
        addWarning('Attempted to open developer tools');
      }
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        addWarning('Attempted to switch applications');
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    // Detect tab switching
    const handleVisibilityChange = () => {
      if (document.hidden) {
        addWarning('Tab switched or window minimized');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (exam && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            submitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [exam, timeRemaining]);

  const fetchExamData = async () => {
    // Mock exam data - replace with actual API call
    const mockExam = {
      id: examId,
      title: 'Mathematics Final Exam',
      duration: 7200, // 2 hours in seconds
      questions: [
        {
          id: 1,
          type: 'multiple-choice',
          question: 'What is the derivative of x²?',
          options: ['2x', 'x²', '2', 'x'],
          correctAnswer: 0
        },
        {
          id: 2,
          type: 'multiple-choice',
          question: 'What is the integral of 2x?',
          options: ['x²', 'x² + C', '2x²', '2x + C'],
          correctAnswer: 1
        },
        {
          id: 3,
          type: 'text',
          question: 'Explain the fundamental theorem of calculus.',
          correctAnswer: null
        },
        {
          id: 4,
          type: 'code',
          question: 'Write a function to calculate factorial of a number.',
          language: 'javascript',
          starterCode: 'function factorial(n) {\n  // Your code here\n}',
          correctAnswer: null
        }
      ]
    };

    setExam(mockExam);
    setTimeRemaining(mockExam.duration);
  };

  const initializeProctoring = async () => {
    try {
      // Request camera and microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setCameraEnabled(true);
      setMicEnabled(true);

      // Request screen recording
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      
      setScreenRecording(true);
      
    } catch (error) {
      console.error('Proctoring initialization failed:', error);
      addWarning('Failed to initialize proctoring systems');
    }
  };

  const addWarning = (message) => {
    const warning = {
      id: Date.now(),
      message,
      timestamp: new Date().toISOString()
    };
    setWarnings(prev => [...prev, warning]);
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const nextQuestion = () => {
    if (currentQuestion < exam.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const saveProgress = async () => {
    // Save current progress to backend
    console.log('Saving progress...', answers);
  };

  const submitExam = async () => {
    const confirmation = window.confirm('Are you sure you want to submit your exam?');
    if (confirmation) {
      // Submit exam to backend
      console.log('Submitting exam...', { answers, warnings });
      navigate('/student/results');
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (!exam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const question = exam.questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gray-100 exam-interface">
      {/* Header */}
      <div className="bg-white shadow-md px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{exam.title}</h1>
            <p className="text-sm text-gray-600">
              Question {currentQuestion + 1} of {exam.questions.length}
            </p>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Proctoring Status */}
            <div className="flex items-center space-x-4">
              <div className={`flex items-center ${cameraEnabled ? 'text-green-600' : 'text-red-600'}`}>
                <Camera className="h-4 w-4 mr-1" />
                <span className="text-xs">Camera</span>
              </div>
              <div className={`flex items-center ${micEnabled ? 'text-green-600' : 'text-red-600'}`}>
                <Mic className="h-4 w-4 mr-1" />
                <span className="text-xs">Mic</span>
              </div>
              <div className={`flex items-center ${screenRecording ? 'text-green-600' : 'text-red-600'}`}>
                <Monitor className="h-4 w-4 mr-1" />
                <span className="text-xs">Screen</span>
              </div>
            </div>

            {/* Timer */}
            <div className="flex items-center text-red-600">
              <Clock className="h-5 w-5 mr-2" />
              <span className="text-lg font-mono font-bold">
                {formatTime(timeRemaining)}
              </span>
            </div>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            {/* Question */}
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <FileText className="h-5 w-5 text-blue-500 mr-2" />
                <span className="text-sm font-medium text-blue-600 uppercase">
                  {question.type.replace('-', ' ')}
                </span>
              </div>
              <h2 className="text-xl font-medium text-gray-900 mb-4">
                {question.question}
              </h2>
            </div>

            {/* Answer Area */}
            <div className="mb-8">
              {question.type === 'multiple-choice' && (
                <div className="space-y-3">
                  {question.options.map((option, index) => (
                    <label key={index} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={index}
                        checked={answers[question.id] === index}
                        onChange={() => handleAnswerChange(question.id, index)}
                        className="mr-3"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {question.type === 'text' && (
                <textarea
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Type your answer here..."
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                />
              )}

              {question.type === 'code' && (
                <div>
                  <div className="bg-gray-900 rounded-t-lg p-3">
                    <span className="text-gray-300 text-sm">{question.language}</span>
                  </div>
                  <textarea
                    className="w-full h-64 p-3 font-mono text-sm bg-gray-800 text-green-400 border-none rounded-b-lg focus:ring-2 focus:ring-blue-500"
                    value={answers[question.id] || question.starterCode}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={previousQuestion}
                disabled={currentQuestion === 0}
                className="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
              >
                Previous
              </button>

              <div className="flex space-x-3">
                <button
                  onClick={saveProgress}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center hover:bg-blue-600"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </button>

                {currentQuestion === exam.questions.length - 1 ? (
                  <button
                    onClick={submitExam}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg flex items-center hover:bg-green-600"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Submit Exam
                  </button>
                ) : (
                  <button
                    onClick={nextQuestion}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-white shadow-md p-6">
          {/* Video Feed */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Live Feed</h3>
            <div className="bg-gray-900 rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                muted
                className="w-full h-32 object-cover"
              />
            </div>
          </div>

          {/* Question Navigator */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Questions</h3>
            <div className="grid grid-cols-5 gap-2">
              {exam.questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestion(index)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium ${
                    index === currentQuestion
                      ? 'bg-blue-500 text-white'
                      : answers[exam.questions[index].id] !== undefined
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-red-900 mb-3 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Warnings ({warnings.length})
              </h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {warnings.slice(-3).map((warning) => (
                  <div key={warning.id} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                    {warning.message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamInterface;