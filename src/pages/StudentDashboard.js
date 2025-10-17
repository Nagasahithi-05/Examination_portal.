import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { examAPI } from '../services/api';
import { 
  BookOpen, 
  Clock, 
  Award, 
  BarChart3, 
  Calendar,
  PlayCircle,
  CheckCircle,
  AlertCircle,
  Trophy,
  TrendingUp,
  FileText,
  RefreshCw
} from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalExams: 0,
    completedExams: 0,
    averageScore: 0,
    upcomingExams: 0
  });
  const [availableExams, setAvailableExams] = useState([]);
  const [recentResults, setRecentResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedExam, setSelectedExam] = useState('');

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch available exams for students (published and active)
      const examsResponse = await examAPI.getExams({ 
        page: 1, 
        limit: 50 
      });
      
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

      let exams = [];
      if (examsResponse && examsResponse.success) {
        exams = examsResponse.data.exams || [];
      }

      // Use demo exams if none returned or on failure to fetch
      if (!exams || exams.length === 0) {
        exams = makeDemoExams();
      }

      setAvailableExams(exams);

      // Calculate stats
      setStats({
        totalExams: exams.length,
        completedExams: 0, // TODO: Fetch from submissions
        averageScore: 0, // TODO: Calculate from submissions
        upcomingExams: exams.filter(exam => new Date(exam.startDate) > new Date()).length
      });

      // Mock recent results - replace with actual API call when available
      setRecentResults([
        {
          id: 1,
          examTitle: 'Algebra Test',
          subject: 'Mathematics',
          score: 88,
          maxScore: 100,
          date: '2024-01-15',
          grade: 'A',
          status: 'passed'
        }
      ]);
      
    } catch (err) {
      console.error('Error fetching student data:', err);
      setError('Failed to load exam data from server. Showing demo exams.');
      // show demo exams on error
      try {
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

        setAvailableExams(makeDemoExams());
      } catch (e) {
        // ignore
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = (examId) => {
    navigate(`/exam/${examId}`);
  };

  const handleExamSelection = (e) => {
    const examId = e.target.value;
    setSelectedExam(examId);
    if (examId) {
      handleStartExam(examId);
    }
  };

  const getExamStatus = (exam) => {
    const now = new Date();
    const startDate = new Date(exam.startDate);
    const endDate = new Date(exam.endDate);

    if (now < startDate) {
      return { status: 'upcoming', label: 'Upcoming', color: 'bg-yellow-100 text-yellow-800' };
    } else if (now > endDate) {
      return { status: 'completed', label: 'Completed', color: 'bg-gray-100 text-gray-800' };
    } else {
      return { status: 'active', label: 'Active', color: 'bg-green-100 text-green-800' };
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const StatCard = ({ icon: Icon, title, value, color, suffix = '' }) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}{suffix}</p>
        </div>
      </div>
    </div>
  );

  const getGradeColor = (grade) => {
    if (grade.includes('A')) return 'text-green-600';
    if (grade.includes('B')) return 'text-blue-600';
    if (grade.includes('C')) return 'text-yellow-600';
    if (grade.includes('D')) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading exam data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name}</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            icon={BookOpen} 
            title="Total Exams" 
            value={stats.totalExams} 
            color="bg-blue-500" 
          />
          <StatCard 
            icon={CheckCircle} 
            title="Completed" 
            value={stats.completedExams} 
            color="bg-green-500" 
          />
          <StatCard 
            icon={Award} 
            title="Average Score" 
            value={stats.averageScore} 
            suffix="%" 
            color="bg-purple-500" 
          />
          <StatCard 
            icon={Clock} 
            title="Upcoming" 
            value={stats.upcomingExams} 
            color="bg-orange-500" 
          />
        </div>

        {/* Quick Exam Selector */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Start Exam</h2>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label htmlFor="examSelect" className="block text-sm font-medium text-gray-700 mb-2">
                Select an exam to start:
              </label>
              <select
                id="examSelect"
                value={selectedExam}
                onChange={handleExamSelection}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">-- Choose an exam --</option>
                {availableExams
                  .filter(exam => {
                    const status = getExamStatus(exam);
                    return status.status === 'active';
                  })
                  .map((exam) => (
                    <option key={exam._id} value={exam._id}>
                      {exam.title} - {exam.subject} ({exam.duration} mins)
                    </option>
                  ))}
              </select>
            </div>
            <button
              onClick={() => selectedExam && handleStartExam(selectedExam)}
              disabled={!selectedExam}
              className={`px-6 py-3 rounded-lg flex items-center whitespace-nowrap ${
                selectedExam 
                  ? 'bg-blue-500 text-white hover:bg-blue-600' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <PlayCircle className="h-5 w-5 mr-2" />
              Start Exam
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Available Exams */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Available Exams</h2>
              <button 
                onClick={fetchStudentData}
                className="text-blue-500 hover:text-blue-700"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>

            {availableExams.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No exams available at the moment</p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableExams.map((exam) => {
                  const examStatus = getExamStatus(exam);
                  return (
                    <div key={exam._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-medium text-gray-900">{exam.title}</h3>
                          <p className="text-sm text-gray-600">
                            {exam.createdBy?.name || 'Teacher'}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${examStatus.color}`}>
                          {examStatus.label}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatDate(exam.startDate)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          {formatTime(exam.startDate)}
                        </div>
                        <div className="flex items-center">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          {exam.duration} minutes
                        </div>
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-2" />
                          {exam.totalMarks} marks
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-blue-600">{exam.subject}</span>
                        <button 
                          onClick={() => handleStartExam(exam._id)}
                          disabled={examStatus.status !== 'active'}
                          className={`px-4 py-2 rounded-lg flex items-center text-sm ${
                            examStatus.status === 'active'
                              ? 'bg-blue-500 text-white hover:bg-blue-600'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          <PlayCircle className="h-4 w-4 mr-2" />
                          {examStatus.status === 'active' ? 'Start Exam' : examStatus.label}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Results & Performance */}
          <div className="space-y-6">
            {/* Recent Results */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Recent Results</h2>
                <Trophy className="h-5 w-5 text-gray-400" />
              </div>

              <div className="space-y-4">
                {recentResults.map((result) => (
                  <div key={result.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{result.examTitle}</p>
                        <p className="text-xs text-gray-600">{result.subject}</p>
                        <p className="text-xs text-gray-500">{result.date}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-lg font-bold ${getGradeColor(result.grade)}`}>
                          {result.grade}
                        </span>
                        <p className="text-sm text-gray-600">
                          {result.score}/{result.maxScore}
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${(result.score / result.maxScore) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium">
                View All Results
              </button>
            </div>

            {/* Performance Chart */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Performance</h2>
                <TrendingUp className="h-5 w-5 text-gray-400" />
              </div>

              <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Performance chart would go here</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <BarChart3 className="h-6 w-6 text-blue-500 mr-3" />
              <span className="font-medium text-gray-900">View Analytics</span>
            </button>
            <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <FileText className="h-6 w-6 text-green-500 mr-3" />
              <span className="font-medium text-gray-900">Download Certificates</span>
            </button>
            <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Clock className="h-6 w-6 text-purple-500 mr-3" />
              <span className="font-medium text-gray-900">Exam History</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;