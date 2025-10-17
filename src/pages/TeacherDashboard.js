import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { examAPI, submissionAPI } from '../services/api';
import { 
  BookOpen, 
  Users, 
  FileText, 
  BarChart3, 
  Plus, 
  Search,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Clock,
  Award,
  Download
} from 'lucide-react';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalExams: 0,
    totalStudents: 0,
    totalResults: 0,
    averageScore: 0
  });
  const [exams, setExams] = useState([]);
  const [recentResults, setRecentResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [resultsLoading, setResultsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resultsError, setResultsError] = useState(null);

  useEffect(() => {
    fetchTeacherData();
    fetchTeacherStats();
    fetchRecentResults();
  }, []);

  const fetchTeacherData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch exams created by the teacher
      const response = await examAPI.getExams();
      
      if (response.success) {
        setExams(response.data.exams || []);
      }
    } catch (error) {
      console.error('Error fetching teacher data:', error);
      setError(error.message || 'Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeacherStats = async () => {
    try {
      setStatsLoading(true);
      const response = await submissionAPI.getTeacherStats();
      
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching teacher stats:', error);
      // Keep default stats on error
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchRecentResults = async () => {
    try {
      setResultsLoading(true);
      setResultsError(null);
      
      const response = await submissionAPI.getTeacherRecentSubmissions(10);
      
      if (response.success) {
        setRecentResults(response.data.submissions || []);
      }
    } catch (error) {
      console.error('Error fetching recent results:', error);
      setResultsError(error.message || 'Failed to load recent results');
      setRecentResults([]);
    } finally {
      setResultsLoading(false);
    }
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredExams = exams.filter(exam =>
    exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (exam.subject && exam.subject.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDeleteExam = async (examId) => {
    if (window.confirm('Are you sure you want to delete this exam?')) {
      try {
        await examAPI.deleteExam(examId);
        fetchTeacherData();
        fetchTeacherStats();
      } catch (error) {
        console.error('Error deleting exam:', error);
        alert('Failed to delete exam');
      }
    }
  };

  const handleExportExam = (examId) => {
    // TODO: Implement export functionality
    alert('Export functionality coming soon!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            icon={BookOpen} 
            title="Total Exams" 
            value={stats.totalExams} 
            color="bg-blue-500" 
          />
          <StatCard 
            icon={Users} 
            title="Total Students" 
            value={stats.totalStudents} 
            color="bg-green-500" 
          />
          <StatCard 
            icon={FileText} 
            title="Total Results" 
            value={stats.totalResults} 
            color="bg-purple-500" 
          />
          <StatCard 
            icon={Award} 
            title="Average Score" 
            value={stats.averageScore} 
            suffix="%" 
            color="bg-orange-500" 
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Exams Management */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">My Exams</h2>
              <Link 
                to="/create-exam"
                className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Exam
              </Link>
            </div>

            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search exams..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Exams List */}
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="text-gray-600 mt-2">Loading exams...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-600 mb-2">{error}</p>
                  <button 
                    onClick={fetchTeacherData}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Try Again
                  </button>
                </div>
              ) : filteredExams.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">
                    {searchTerm ? 'No exams found matching your search' : 'No exams created yet'}
                  </p>
                  {!searchTerm && (
                    <Link 
                      to="/create-exam"
                      className="inline-block mt-4 text-blue-600 hover:text-blue-800"
                    >
                      Create your first exam
                    </Link>
                  )}
                </div>
              ) : (
                filteredExams.map((exam) => (
                  <div key={exam._id || exam.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-900">{exam.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(exam.status)}`}>
                            {exam.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            {exam.startDate ? new Date(exam.startDate).toLocaleDateString() : exam.date || 'Not set'}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2" />
                            {exam.startTime || exam.time || 'Not set'}
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2" />
                            {exam.enrolledStudents?.length || exam.students || 0} students
                          </div>
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2" />
                            {exam.questions?.length || exam.questions || 0} questions
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button 
                          onClick={() => window.location.href = `/exam/${exam._id || exam.id}`}
                          className="text-blue-600 hover:text-blue-800 p-2"
                          title="View Exam"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => window.location.href = `/edit-exam/${exam._id || exam.id}`}
                          className="text-green-600 hover:text-green-800 p-2"
                          title="Edit Exam"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleExportExam(exam._id || exam.id)}
                          className="text-gray-600 hover:text-gray-800 p-2"
                          title="Export Results"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteExam(exam._id || exam.id)}
                          className="text-red-600 hover:text-red-800 p-2"
                          title="Delete Exam"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Results */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recent Results</h2>
              <button 
                onClick={fetchRecentResults}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Refresh
              </button>
            </div>

            <div className="space-y-4">
              {resultsLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="text-gray-600 mt-2">Loading results...</p>
                </div>
              ) : resultsError ? (
                <div className="text-center py-8">
                  <p className="text-red-600 mb-2">{resultsError}</p>
                  <button 
                    onClick={fetchRecentResults}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Try Again
                  </button>
                </div>
              ) : recentResults.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No results yet</p>
                  <p className="text-gray-500 text-sm">Results will appear here when students complete exams</p>
                </div>
              ) : (
                recentResults.map((result) => (
                  <div key={result.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{result.studentName}</p>
                        <p className="text-xs text-gray-600">{result.examTitle}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(result.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`text-lg font-bold ${
                          result.score >= 80 ? 'text-green-600' :
                          result.score >= 60 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {result.score}%
                        </span>
                        <p className="text-xs text-gray-500">
                          {result.marksObtained}/{result.totalMarks}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick Actions */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                  <BarChart3 className="h-4 w-4 inline mr-2" />
                  View Analytics
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                  <Download className="h-4 w-4 inline mr-2" />
                  Export Results
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                  <Users className="h-4 w-4 inline mr-2" />
                  Manage Students
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;