# 📚 Online Examination System

A comprehensive full-stack web application for conducting online examinations with role-based access control, real-time features, and secure authentication.

## 🌟 Features

### 👩‍🏫 **For Teachers/Admins**
- Create and manage examinations
- Add multiple-choice questions with configurable options
- Generate unique exam access codes
- Set exam duration, passing marks, and schedule
- Monitor student submissions and results
- Role-based dashboard with exam analytics

### 👨‍🎓 **For Students**
- Secure exam access using unique codes
- Real-time countdown timer during exams
- Clean, distraction-free exam interface
- Automatic submission on time completion
- View available exams and results

### 🔐 **Security & Authentication**
- JWT-based authentication system
- Role-based access control (Student, Teacher, Admin)
- Secure password hashing with bcrypt
- Protected API endpoints
- Session management

### 🎨 **User Interface**
- Modern, responsive design
- Intuitive navigation
- Real-time feedback and validation
- Cross-platform compatibility
- Mobile-friendly interface

## 🏗️ Project Structure

```
Examination/
├── 📁 backend/                    # Node.js Backend Server
│   ├── 📁 middleware/            # Authentication & Authorization
│   │   ├── auth.js              # JWT authentication middleware
│   │   └── authorize.js         # Role-based authorization
│   ├── 📁 models/               # MongoDB Data Models
│   │   ├── User.js              # User schema (students, teachers, admins)
│   │   ├── Exam.js              # Examination schema
│   │   ├── Question.js          # Question schema
│   │   └── Submission.js        # Student submission schema
│   ├── 📁 routes/               # API Endpoints
│   │   ├── auth.js              # Authentication routes (/register, /login)
│   │   ├── exams.js             # Exam management routes
│   │   ├── questions.js         # Question management routes
│   │   ├── submissions.js       # Submission handling routes
│   │   └── users.js             # User management routes
│   ├── 📄 server.js             # Express server entry point
│   ├── 📄 package.json          # Backend dependencies
│   └── 📄 .env                  # Environment variables
│
├── 📁 frontend/                  # React Frontend Application
│   ├── 📁 public/               # Static assets
│   │   ├── index.html           # Main HTML template
│   │   └── background.png       # Background image
│   ├── 📁 src/                  # React source code
│   │   ├── 📁 components/       # Reusable React components
│   │   │   ├── Navbar.js        # Navigation component
│   │   │   └── ProtectedRoute.js # Route protection
│   │   ├── 📁 context/          # React Context
│   │   │   └── AuthContext.js   # Authentication context
│   │   ├── 📁 pages/            # Page components
│   │   │   ├── HomePage.js      # Landing page
│   │   │   ├── Login.js         # Login page
│   │   │   ├── Register.js      # Registration page
│   │   │   ├── StudentDashboard.js    # Student interface
│   │   │   ├── TeacherDashboard.js    # Teacher interface
│   │   │   ├── AdminDashboard.js      # Admin interface
│   │   │   ├── CreateExam.js    # Exam creation page
│   │   │   └── ExamInterface.js # Exam taking interface
│   │   ├── 📁 services/         # API services
│   │   │   └── api.js           # API communication layer
│   │   ├── 📁 assets/           # Images and static files
│   │   │   └── images/
│   │   │       └── background.png
│   │   ├── 📄 App.js            # Main React application
│   │   ├── 📄 App.css           # Global styles
│   │   └── 📄 index.js          # React entry point
│   ├── 📄 package.json          # Frontend dependencies
│   └── 📄 package-lock.json     # Dependency lock file
│
├── 📄 README.md                 # Project documentation (this file)
└── 📄 .gitignore               # Git ignore rules
```

## 🚀 Technology Stack

### **Backend**
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB Atlas (Cloud)
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcryptjs for password hashing
- **Validation**: express-validator
- **CORS**: cors middleware
- **Environment**: dotenv

### **Frontend**
- **Library**: React 18
- **Styling**: CSS3 with custom styles
- **HTTP Client**: Fetch API
- **State Management**: React useState/useEffect
- **Routing**: React Router (planned)
- **Build Tool**: Create React App

### **Database Schema**

#### **Users Collection**
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (student|teacher|admin),
  institution: String,
  department: String,
  studentId: String (for students),
  isActive: Boolean,
  createdAt: Date
}
```

#### **Exams Collection**
```javascript
{
  title: String,
  description: String,
  subject: String,
  createdBy: ObjectId (User),
  duration: Number (minutes),
  totalMarks: Number,
  passingMarks: Number,
  accessCode: String (unique),
  startDate: Date,
  endDate: Date,
  questions: [ObjectId (Question)],
  isActive: Boolean,
  isPublished: Boolean
}
```

#### **Questions Collection**
```javascript
{
  examId: ObjectId (Exam),
  question: String,
  type: String (multiple-choice|true-false|short-answer),
  options: [String],
  correctAnswer: String,
  marks: Number,
  createdBy: ObjectId (User)
}
```

#### **Submissions Collection**
```javascript
{
  examId: ObjectId (Exam),
  studentId: ObjectId (User),
  answers: Object,
  score: Number,
  submittedAt: Date,
  timeSpent: Number (seconds),
  isCompleted: Boolean
}
```

## ⚙️ Installation & Setup

### **Prerequisites**
- Node.js (v14 or higher)
- npm or yarn package manager
- MongoDB Atlas account (or local MongoDB)
- Git

### **1. Clone the Repository**
```bash
git clone <repository-url>
cd Examination
```

### **2. Backend Setup**
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure environment variables in .env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/examination_db
JWT_SECRET=your_super_secret_jwt_key_here
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

# Start the backend server
npm start
# or for development with auto-restart
npm run dev
```

### **3. Frontend Setup**
```bash
# Navigate to frontend directory (in a new terminal)
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

### **4. Access the Application**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Database**: MongoDB Atlas (cloud)

## 🔧 Environment Configuration

### **Backend (.env)**
```env
# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/examination_db

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d

# Server Configuration
NODE_ENV=development
PORT=5000

# Client Configuration
CLIENT_URL=http://localhost:3000
```

## 📖 API Documentation

### **Authentication Endpoints**
```
POST /api/auth/register    # User registration
POST /api/auth/login       # User login
GET  /api/auth/me          # Get current user profile
POST /api/auth/logout      # User logout
```

### **Exam Management Endpoints**
```
GET    /api/exams              # Get all exams (role-filtered)
POST   /api/exams              # Create new exam (teacher/admin)
GET    /api/exams/:id          # Get exam by ID
PUT    /api/exams/:id          # Update exam (teacher/admin)
DELETE /api/exams/:id          # Delete exam (teacher/admin)
GET    /api/exams/code/:code   # Get exam by access code
PATCH  /api/exams/:id/publish  # Publish/unpublish exam
```

### **Question Management Endpoints**
```
GET    /api/questions/exam/:examId    # Get questions for exam
POST   /api/questions                # Create new question
PUT    /api/questions/:id            # Update question
DELETE /api/questions/:id            # Delete question
```

### **Submission Endpoints**
```
POST /api/submissions       # Submit exam answers
GET  /api/submissions/my    # Get user's submissions
GET  /api/submissions/:id   # Get submission details
```

## 👥 User Roles & Permissions

### **Student**
- ✅ Register and login
- ✅ Access exams using codes
- ✅ Take exams within time limits
- ✅ View submission results
- ❌ Cannot create or modify exams

### **Teacher**
- ✅ All student permissions
- ✅ Create and manage exams
- ✅ Add/edit/delete questions
- ✅ View student submissions
- ✅ Generate exam access codes
- ❌ Cannot manage other users

### **Admin**
- ✅ All teacher permissions
- ✅ Manage all users
- ✅ Access system analytics
- ✅ Manage system settings
- ✅ Full system control

## 🎮 Usage Guide

### **For Teachers: Creating an Exam**
1. **Register/Login** as a teacher
2. **Navigate** to "Create Exam" page
3. **Fill in** exam details (title, subject, duration, marks)
4. **Generate** unique access code
5. **Add questions** with multiple choice options
6. **Save** the exam to database
7. **Share** access code with students

### **For Students: Taking an Exam**
1. **Register/Login** as a student
2. **Enter** the exam access code provided by teacher
3. **Review** exam details and time limit
4. **Start** the exam when ready
5. **Answer** questions within time limit
6. **Submit** before time expires
7. **View** results (if enabled)

### **For Admins: System Management**
1. **Login** with admin credentials
2. **Monitor** system usage and statistics
3. **Manage** user accounts and permissions
4. **Configure** system settings
5. **Export** reports and analytics

## 🔒 Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Role-Based Access**: Granular permission system
- **API Protection**: All sensitive endpoints protected
- **Input Validation**: Server-side validation for all inputs
- **CORS Configuration**: Controlled cross-origin requests
- **Environment Variables**: Sensitive data in .env files

## 🧪 Testing

### **Manual Testing Checklist**
- [ ] User registration and login
- [ ] Exam creation and management
- [ ] Question addition and editing
- [ ] Student exam access
- [ ] Timer functionality
- [ ] Submission handling
- [ ] Role-based access control

### **Test User Accounts**
```javascript
// Student Account
Email: student@test.com
Password: test123

// Teacher Account  
Email: teacher@test.com
Password: test123

// Admin Account
Email: admin@test.com
Password: admin123
```

## 🚀 Deployment

### **Backend Deployment (Heroku/Railway)**
1. Set environment variables in hosting platform
2. Configure MongoDB Atlas connection
3. Deploy backend code
4. Test API endpoints

### **Frontend Deployment (Netlify/Vercel)**
1. Build production version: `npm run build`
2. Configure API base URL for production
3. Deploy build folder
4. Test frontend functionality

## 🤝 Contributing

1. **Fork** the repository
2. **Create** feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Submit** pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 🐛 Troubleshooting

### **Common Issues**

#### **Backend Issues**
```bash
# Port already in use
Error: listen EADDRINUSE :::5000
Solution: Kill existing Node processes or change PORT in .env

# MongoDB connection failed
Solution: Check MONGODB_URI in .env file, ensure network access
```

#### **Frontend Issues**
```bash
# Module not found errors
Solution: Delete node_modules and package-lock.json, run npm install

# API connection refused
Solution: Ensure backend is running on http://localhost:5000
```

#### **Authentication Issues**
```bash
# JWT token invalid
Solution: Check JWT_SECRET consistency between requests

# Role access denied
Solution: Verify user role in database matches expected permissions
```

## 📞 Support

For support and questions:
- **Email**: support@examination-system.com
- **Documentation**: [Project Wiki](wiki-url)
- **Issues**: [GitHub Issues](issues-url)

## 🎯 Roadmap

### **Planned Features**
- [ ] Real-time exam monitoring
- [ ] Advanced question types (essay, file upload)
- [ ] Exam analytics and reporting
- [ ] Email notifications
- [ ] Mobile application
- [ ] Plagiarism detection
- [ ] Video proctoring
- [ ] Bulk user import
- [ ] Advanced scheduling
- [ ] Multi-language support

---