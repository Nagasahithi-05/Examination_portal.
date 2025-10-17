const express = require('express');
const cors = require('cors');

const app = express();

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Backend server is working!',
    status: 'success'
  });
});

// Test register route
app.post('/api/auth/register', (req, res) => {
  console.log('Registration request received:', req.body);
  res.json({
    success: true,
    message: 'Registration successful',
    user: {
      id: 1,
      name: req.body.name,
      email: req.body.email,
      role: req.body.role
    },
    token: 'test-token-123'
  });
});

// Test login route
app.post('/api/auth/login', (req, res) => {
  console.log('Login request received:', req.body);
  res.json({
    success: true,
    message: 'Login successful',
    user: {
      id: 1,
      name: 'Test User',
      email: req.body.email,
      role: 'student'
    },
    token: 'test-token-123'
  });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, '0.0.0.0', (err) => {
  if (err) {
    console.error('❌ Server failed to start:', err);
    return;
  }
  console.log(`🚀 Test Server running on port ${PORT}`);
  console.log(`🌐 API URL: http://localhost:${PORT}`);
  console.log(`🔗 Binding to: 0.0.0.0:${PORT}`);
}).on('error', (err) => {
  console.error('❌ Server error:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  }
});