const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Exam title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Exam description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  duration: {
    type: Number,
    required: [true, 'Exam duration is required'],
    min: [1, 'Duration must be at least 1 minute'],
    max: [600, 'Duration cannot exceed 600 minutes']
  },
  totalMarks: {
    type: Number,
    required: true,
    min: [1, 'Total marks must be at least 1']
  },
  passingMarks: {
    type: Number,
    required: true,
    validate: {
      validator: function(value) {
        return value <= this.totalMarks;
      },
      message: 'Passing marks cannot exceed total marks'
    }
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
    validate: {
      validator: function(value) {
        return value > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  settings: {
    randomizeQuestions: {
      type: Boolean,
      default: false
    },
    randomizeOptions: {
      type: Boolean,
      default: false
    },
    showResults: {
      type: Boolean,
      default: true
    },
    allowReview: {
      type: Boolean,
      default: true
    },
    showCorrectAnswers: {
      type: Boolean,
      default: false
    },
    maxAttempts: {
      type: Number,
      default: 1,
      min: [1, 'At least 1 attempt must be allowed']
    },
    proctoring: {
      enabled: {
        type: Boolean,
        default: false
      },
      webcam: {
        type: Boolean,
        default: false
      },
      microphone: {
        type: Boolean,
        default: false
      },
      screenShare: {
        type: Boolean,
        default: false
      },
      tabSwitchLimit: {
        type: Number,
        default: 3
      },
      windowBlurLimit: {
        type: Number,
        default: 5
      }
    },
    autoSubmit: {
      type: Boolean,
      default: true
    },
    showTimer: {
      type: Boolean,
      default: true
    },
    warningTime: {
      type: Number,
      default: 5 // minutes before auto-submit
    }
  },
  enrolledStudents: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    enrolledAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['enrolled', 'started', 'completed', 'disqualified'],
      default: 'enrolled'
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  accessCode: {
    type: String,
    unique: true,
    sparse: true
  },
  instructions: {
    type: String,
    default: 'Please read all questions carefully before answering.'
  },
  category: {
    type: String,
    enum: ['academic', 'certification', 'assessment', 'quiz'],
    default: 'academic'
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  tags: [String],
  submissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Submission'
  }],
  analytics: {
    totalAttempts: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    passRate: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
examSchema.index({ createdBy: 1 });
examSchema.index({ subject: 1 });
examSchema.index({ startDate: 1, endDate: 1 });
examSchema.index({ isActive: 1, isPublished: 1 });
examSchema.index({ accessCode: 1 });
examSchema.index({ 'enrolledStudents.student': 1 });

// Virtual for exam status
examSchema.virtual('status').get(function() {
  const now = new Date();
  if (now < this.startDate) return 'upcoming';
  if (now > this.endDate) return 'completed';
  return 'active';
});

// Virtual for question count
examSchema.virtual('questionCount').get(function() {
  return this.questions.length;
});

// Virtual for enrolled student count
examSchema.virtual('enrolledCount').get(function() {
  return this.enrolledStudents.length;
});

// Method to check if exam is available
examSchema.methods.isAvailable = function() {
  const now = new Date();
  return this.isActive && this.isPublished && now >= this.startDate && now <= this.endDate;
};

// Method to check if user can access exam
examSchema.methods.canAccess = function(userId) {
  if (!this.isAvailable()) return false;
  
  // Check if user is enrolled
  const enrollment = this.enrolledStudents.find(
    student => student.student.toString() === userId.toString()
  );
  
  return !!enrollment;
};

// Method to generate access code
examSchema.methods.generateAccessCode = function() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  this.accessCode = result;
  return result;
};

// Static method to find active exams
examSchema.statics.findActiveExams = function() {
  const now = new Date();
  return this.find({
    isActive: true,
    isPublished: true,
    startDate: { $lte: now },
    endDate: { $gte: now }
  });
};

module.exports = mongoose.model('Exam', examSchema);