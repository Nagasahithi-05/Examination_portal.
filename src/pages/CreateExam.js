
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Share, Save, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CreateExam = () => {
  // Require user to fill startDate and endDate
  const [examData, setExamData] = useState({
    title: '',
    subject: '',
    description: '',
    duration: 90,
    totalMarks: 100,
    passingMarks: 0,
    startDate: '',
    endDate: ''
  });
  const [questions, setQuestions] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  const questionTypes = [
    { type: 'mcq', label: 'MCQ', color: 'bg-blue-500 hover:bg-blue-600', description: 'Multiple Choice Questions' },
    { type: 'short', label: 'Short Answer', color: 'bg-green-500 hover:bg-green-600', description: 'Short Answer Questions' },
    { type: 'coding', label: 'Coding Challenge', color: 'bg-purple-500 hover:bg-purple-600', description: 'Programming Questions' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setExamData(prev => ({ ...prev, [name]: value }));
  };

  const addQuestion = (type) => {
    const newQuestion = {
      id: Date.now(),
      type,
      question: '',
      marks: 1
    };
    if (type === 'mcq') {
      newQuestion.options = ['', '', '', ''];
      newQuestion.correctAnswer = 0;
    } else if (type === 'short') {
      newQuestion.expectedAnswer = '';
    } else if (type === 'coding') {
      newQuestion.language = 'javascript';
      newQuestion.starterCode = '';
      newQuestion.testCases = [];
    }
    setQuestions(prev => [...prev, newQuestion]);
  };

  const handleSaveExam = async () => {
    try {
      // Frontend validation for backend requirements
      if (!examData.title || examData.title.trim().length < 3) {
        alert('Exam title must be at least 3 characters.');
        return;
      }
      if (!examData.description || examData.description.trim().length < 10) {
        alert('Description must be at least 10 characters.');
        return;
      }
      if (!examData.subject || examData.subject.trim().length < 2) {
        alert('Subject must be at least 2 characters.');
        return;
      }
      if (!examData.duration || isNaN(examData.duration) || examData.duration < 1 || examData.duration > 600) {
        alert('Duration must be between 1 and 600 minutes.');
        return;
      }
      if (!examData.totalMarks || isNaN(examData.totalMarks) || examData.totalMarks < 1) {
        alert('Total marks must be at least 1.');
        return;
      }
      if (examData.passingMarks === '' || isNaN(examData.passingMarks) || examData.passingMarks < 0) {
        alert('Passing marks must be a positive number.');
        return;
      }
      if (Number(examData.passingMarks) > Number(examData.totalMarks)) {
        alert('Passing marks cannot exceed total marks.');
        return;
      }
      if (!examData.startDate || !examData.endDate) {
        alert('Please select both start and end date.');
        return;
      }
      if (new Date(examData.endDate) <= new Date(examData.startDate)) {
        alert('End date must be after start date.');
        return;
      }
      if (questions.length === 0) {
        alert('Please add at least one question.');
        return;
      }
      // Validate each question before sending to backend
      for (const [i, q] of questions.entries()) {
        if (!q.question || q.question.trim().length < 10) {
          alert(`Question ${i + 1} text must be at least 10 characters.`);
          return;
        }
        if (!q.marks || isNaN(q.marks) || q.marks < 1) {
          alert(`Question ${i + 1} must have at least 1 mark.`);
          return;
        }
        if (q.type === 'mcq') {
          if (!q.options || q.options.length < 2 || q.options.some(opt => !opt || opt.trim().length === 0)) {
            alert(`Question ${i + 1} (MCQ) must have at least 2 non-empty options.`);
            return;
          }
        }
      }
      // Step 1: Create questions in backend, get their ObjectIds
      const createdQuestionIds = [];
      for (const q of questions) {
        let options = q.options || [];
        if (q.type === 'mcq') {
          // Convert options to objects with text and isCorrect
          options = options.map((opt, idx) => ({
            text: opt,
            isCorrect: idx === Number(q.correctAnswer)
          }));
        }
        const questionPayload = {
          text: q.question,
          type: q.type === 'short' ? 'short-answer' : q.type,
          subject: examData.subject,
          marks: q.marks,
          options,
        };
        const res = await fetch('/api/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(questionPayload)
        });
        const data = await res.json();
        if (res.ok && data.success && data.data && data.data.question) {
          createdQuestionIds.push(data.data.question._id);
        } else {
          alert('Failed to create question: ' + (data.message || 'Unknown error'));
          return;
        }
      }
      // Step 2: Create exam with question ObjectIds and all required fields
      const examPayload = {
        title: examData.title,
        subject: examData.subject,
        description: examData.description,
        duration: Number(examData.duration),
        totalMarks: Number(examData.totalMarks),
        passingMarks: Number(examData.passingMarks),
        startDate: examData.startDate,
        endDate: examData.endDate,
        questions: createdQuestionIds
      };
      const examRes = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(examPayload)
      });
      const examDataRes = await examRes.json();
      if (examRes.ok && examDataRes.success) {
        alert('Exam saved successfully!');
        navigate('/teacher/dashboard');
      } else {
        alert('Error saving exam: ' + (examDataRes.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving exam:', error);
      alert('Error saving exam. Please try again.');
    }
  };

  const handleShareWhatsApp = () => {
    const message = `🎓 New Exam Created: ${examData.title}\n\n📚 Subject: ${examData.subject}\n⏰ Duration: ${examData.duration} minutes\n📝 Total Marks: ${examData.totalMarks}\n\nJoin the exam using the link below:`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button onClick={() => navigate('/teacher/dashboard')} className="mr-4 p-2 text-gray-600 hover:text-gray-800">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center">
                <div className="bg-red-500 rounded-lg p-2 mr-3">
                  <div className="w-4 h-4 bg-white rounded-sm"></div>
                </div>
                <h1 className="text-xl font-semibold text-gray-900">Create Exam</h1>
              </div>
            </div>
            <div className="flex space-x-3">
              <button onClick={handleSaveExam} className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center hover:bg-red-600 transition-colors">
                <Save className="h-4 w-4 mr-2" />
                Save Exam
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Exam Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Exam Title</label>
                <input type="text" name="title" placeholder="Enter exam title" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" value={examData.title} onChange={handleInputChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                <input type="number" name="duration" placeholder="90" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" value={examData.duration} onChange={handleInputChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <input type="text" name="subject" placeholder="Enter subject" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" value={examData.subject} onChange={handleInputChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Marks</label>
                <input type="number" name="totalMarks" placeholder="100" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" value={examData.totalMarks} onChange={handleInputChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Passing Marks</label>
                <input type="number" name="passingMarks" placeholder="0" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" value={examData.passingMarks} onChange={handleInputChange} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-bold text-yellow-700 mb-2">Start Date</label>
                <input
                  type="datetime-local"
                  name="startDate"
                  className="w-full p-3 border-2 border-yellow-500 bg-yellow-50 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-600"
                  value={examData.startDate}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-bold text-yellow-700 mb-2">End Date</label>
                <input
                  type="datetime-local"
                  name="endDate"
                  className="w-full p-3 border-2 border-yellow-500 bg-yellow-50 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-600"
                  value={examData.endDate}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea name="description" rows={4} placeholder="Enter exam description and instructions" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" value={examData.description} onChange={handleInputChange} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Questions</h2>
              <div className="text-sm text-gray-500">{questions.length} question{questions.length !== 1 ? 's' : ''} added</div>
            </div>
            <div className="flex flex-wrap gap-3 mb-8">
              {questionTypes.map((type) => (
                <button key={type.type} onClick={() => addQuestion(type.type)} className={`${type.color} text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center`}>
                  <Plus className="h-4 w-4 mr-2" />
                  {type.label}
                </button>
              ))}
            </div>
            {questions.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <div className="text-gray-400 mb-2"><Plus className="h-12 w-12 mx-auto" /></div>
                <p className="text-gray-500 mb-4">No questions added yet</p>
                <p className="text-sm text-gray-400">Click on the buttons above to add different types of questions</p>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Question {index + 1} ({question.type.toUpperCase()})</span>
                      <div className="flex items-center space-x-2">
                        <input type="number" placeholder="Marks" className="w-16 p-1 text-xs border border-gray-300 rounded" value={question.marks} onChange={(e) => { const newQuestions = [...questions]; newQuestions[index].marks = parseInt(e.target.value) || 1; setQuestions(newQuestions); }} />
                        <span className="text-xs text-gray-500">marks</span>
                      </div>
                    </div>
                    <textarea placeholder={`Enter your ${question.type} question here...`} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" rows={3} value={question.question} onChange={(e) => { const newQuestions = [...questions]; newQuestions[index].question = e.target.value; setQuestions(newQuestions); }} />
                    {/* MCQ Options UI */}
                    {question.type === 'mcq' && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
                        {question.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center mb-2">
                            <input
                              type="radio"
                              name={`correctOption-${index}`}
                              checked={question.correctAnswer === optIdx}
                              onChange={() => {
                                const newQuestions = [...questions];
                                newQuestions[index].correctAnswer = optIdx;
                                setQuestions(newQuestions);
                              }}
                              className="mr-2"
                            />
                            <input
                              type="text"
                              placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                              className="w-full p-2 border border-gray-300 rounded"
                              value={opt}
                              onChange={e => {
                                const newQuestions = [...questions];
                                newQuestions[index].options[optIdx] = e.target.value;
                                setQuestions(newQuestions);
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateExam;


 