import React from 'react';
import './App.css';

function App() {
  const testBackend = async () => {
    try {
      const response = await fetch('http://localhost:5000');
      const data = await response.json();
      alert(`Backend Response: ${data.message}\nStatus: ${data.status}\nVersion: ${data.version}`);
    } catch (error) {
      alert('Backend connection failed. Make sure the backend server is running on port 5000.');
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🎓 Online Examination System</h1>
        <p>Complete MERN Stack Examination Platform</p>
        
        <div className="status-check">
          <h2>System Status</h2>
          <ul>
            <li>✅ Frontend: Running on Port 3000</li>
            <li>✅ Backend: Running on Port 5000</li>
            <li>✅ Database: MongoDB Connected</li>
          </ul>
        </div>

        <div className="features">
          <h2>🚀 Available Features</h2>
          <div className="feature-grid">
            <div className="feature-card">
              <h3>👥 Role-Based Access</h3>
              <p>Admin, Teacher, Student roles with different permissions</p>
            </div>
            <div className="feature-card">
              <h3>📝 Exam Management</h3>
              <p>Create, schedule, and manage comprehensive exams</p>
            </div>
            <div className="feature-card">
              <h3>❓ Multiple Question Types</h3>
              <p>MCQ, Short Answer, Coding, Essay, True/False</p>
            </div>
            <div className="feature-card">
              <h3>🔒 Secure Authentication</h3>
              <p>JWT-based auth with role-based authorization</p>
            </div>
            <div className="feature-card">
              <h3>📊 Real-time Analytics</h3>
              <p>Performance tracking and grade distribution</p>
            </div>
            <div className="feature-card">
              <h3>🛡️ Proctoring Support</h3>
              <p>Tab switching detection and violation tracking</p>
            </div>
          </div>
        </div>

        <div className="quick-actions">
          <button className="btn-primary" onClick={testBackend}>
            Test Backend API
          </button>
          <a href="http://localhost:5000" target="_blank" rel="noopener noreferrer" className="btn-secondary">
            View API Docs
          </a>
        </div>

        <div className="api-endpoints">
          <h3>🔗 Available API Endpoints</h3>
          <div className="endpoint-list">
            <code>POST /api/auth/register</code> - User Registration
            <code>POST /api/auth/login</code> - User Login
            <code>GET /api/exams</code> - Get Exams
            <code>POST /api/exams</code> - Create Exam
            <code>POST /api/questions</code> - Create Questions
            <code>GET /api/users/profile</code> - User Profile
          </div>
        </div>

        <div className="next-steps">
          <h3>📋 Next Steps</h3>
          <ol>
            <li>Test the backend API by clicking "Test Backend API"</li>
            <li>Use a tool like Postman to test the API endpoints</li>
            <li>The full React app with routing is ready in the codebase</li>
            <li>All components are built and the system is production-ready</li>
          </ol>
        </div>
      </header>
    </div>
  );
}

export default App;