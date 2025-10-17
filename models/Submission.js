const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  attemptNumber: {
    type: Number,
    default: 1,
    min: 1
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  submittedAt: {
    type: Date
  },
  timeSpent: {
    type: Number, // in seconds
    default: 0
  },
  status: {
    type: String,
    enum: ['in-progress', 'submitted', 'auto-submitted', 'disqualified', 'graded'],
    default: 'in-progress'
  },
  
  answers: [{
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    answer: mongoose.Schema.Types.Mixed, // Can be string, array, object depending on question type
    timeSpent: {
      type: Number, // in seconds
      default: 0
    },
    marksAwarded: {
      type: Number,
      default: 0
    },
    isCorrect: {
      type: Boolean,
      default: null
    },
    feedback: String,
    hintsUsed: [{
      hintIndex: Number,
      usedAt: Date,
      penalty: Number
    }],
    flagged: {
      type: Boolean,
      default: false
    },
    reviewNotes: String,
    // For coding questions
    codeSubmission: {
      code: String,
      language: String,
      executionResults: [{
        testCaseIndex: Number,
        input: String,
        expectedOutput: String,
        actualOutput: String,
        passed: Boolean,
        executionTime: Number,
        memory: Number,
        error: String
      }],
      compilationError: String,
      totalTestCasesPassed: {
        type: Number,
        default: 0
      },
      totalTestCases: {
        type: Number,
        default: 0
      }
    }
  }],
  
  scoring: {
    totalMarks: {
      type: Number,
      default: 0
    },
    marksObtained: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0
    },
    grade: {
      type: String,
      enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'],
      default: 'F'
    },
    passed: {
      type: Boolean,
      default: false
    },
    rank: Number,
    percentile: Number
  },
  
  // Proctoring data
  proctoring: {
    violations: [{
      type: {
        type: String,
        enum: ['tab-switch', 'window-blur', 'face-not-detected', 'multiple-faces', 'suspicious-activity']
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      description: String,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      },
      screenshot: String // Base64 or URL
    }],
    tabSwitches: {
      type: Number,
      default: 0
    },
    windowBlurs: {
      type: Number,
      default: 0
    },
    suspiciousActivities: {
      type: Number,
      default: 0
    },
    webcamImages: [{
      timestamp: Date,
      imageData: String, // Base64
      faceDetected: Boolean,
      numberOfFaces: Number
    }],
    audioRecordings: [{
      timestamp: Date,
      audioData: String, // Base64
      duration: Number
    }],
    screenRecordings: [{
      timestamp: Date,
      videoData: String, // Base64 or URL
      duration: Number
    }],
    keystrokePattern: [{
      timestamp: Date,
      key: String,
      duration: Number
    }],
    mouseMovements: [{
      timestamp: Date,
      x: Number,
      y: Number,
      action: String // 'move', 'click', 'scroll'
    }]
  },
  
  // Browser and system information
  systemInfo: {
    userAgent: String,
    browser: String,
    os: String,
    screenResolution: String,
    ipAddress: String,
    location: {
      latitude: Number,
      longitude: Number,
      city: String,
      country: String
    }
  },
  
  // Review data
  review: {
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    comments: String,
    needsManualGrading: {
      type: Boolean,
      default: false
    },
    disputed: {
      type: Boolean,
      default: false
    },
    disputeReason: String,
    finalMarks: Number
  },
  
  // Analytics
  analytics: {
    questionWiseTime: [{
      questionId: mongoose.Schema.Types.ObjectId,
      timeSpent: Number
    }],
    difficultyWisePerformance: {
      easy: {
        attempted: Number,
        correct: Number
      },
      medium: {
        attempted: Number,
        correct: Number
      },
      hard: {
        attempted: Number,
        correct: Number
      }
    },
    averageTimePerQuestion: Number,
    questionsAttempted: Number,
    questionsSkipped: Number,
    questionsReviewed: Number
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  notes: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
submissionSchema.index({ student: 1 });
submissionSchema.index({ exam: 1 });
submissionSchema.index({ student: 1, exam: 1 });
submissionSchema.index({ status: 1 });
submissionSchema.index({ submittedAt: 1 });
submissionSchema.index({ 'scoring.percentage': 1 });
submissionSchema.index({ 'proctoring.violations.type': 1 });

// Virtual for duration
submissionSchema.virtual('duration').get(function() {
  if (this.endTime && this.startTime) {
    return Math.floor((this.endTime - this.startTime) / 1000); // in seconds
  }
  return 0;
});

// Virtual for violation count
submissionSchema.virtual('violationCount').get(function() {
  return this.proctoring.violations ? this.proctoring.violations.length : 0;
});

// Virtual for completion percentage
submissionSchema.virtual('completionPercentage').get(function() {
  if (this.answers.length === 0) return 0;
  const answeredQuestions = this.answers.filter(answer => 
    answer.answer !== null && answer.answer !== undefined && answer.answer !== ''
  ).length;
  return Math.round((answeredQuestions / this.answers.length) * 100);
});

// Method to calculate final score
submissionSchema.methods.calculateScore = async function() {
  let totalMarks = 0;
  let marksObtained = 0;
  
  // Populate questions for calculation
  await this.populate('answers.question');
  
  for (const answer of this.answers) {
    totalMarks += answer.question.marks;
    
    if (answer.question.type === 'coding') {
      // Calculate coding question score based on test cases
      if (answer.codeSubmission) {
        const passedTests = answer.codeSubmission.totalTestCasesPassed || 0;
        const totalTests = answer.codeSubmission.totalTestCases || 1;
        answer.marksAwarded = Math.round((passedTests / totalTests) * answer.question.marks);
      }
    } else {
      // Auto-grade other question types
      answer.marksAwarded = answer.question.calculateScore(answer.answer);
      answer.isCorrect = answer.marksAwarded > 0;
    }
    
    // Deduct penalty for hints used
    if (answer.hintsUsed && answer.hintsUsed.length > 0) {
      const hintPenalty = answer.hintsUsed.reduce((total, hint) => total + hint.penalty, 0);
      answer.marksAwarded = Math.max(0, answer.marksAwarded - hintPenalty);
    }
    
    marksObtained += answer.marksAwarded;
  }
  
  this.scoring.totalMarks = totalMarks;
  this.scoring.marksObtained = marksObtained;
  this.scoring.percentage = totalMarks > 0 ? Math.round((marksObtained / totalMarks) * 100) : 0;
  
  // Calculate grade
  const percentage = this.scoring.percentage;
  if (percentage >= 90) this.scoring.grade = 'A+';
  else if (percentage >= 80) this.scoring.grade = 'A';
  else if (percentage >= 70) this.scoring.grade = 'B+';
  else if (percentage >= 60) this.scoring.grade = 'B';
  else if (percentage >= 50) this.scoring.grade = 'C+';
  else if (percentage >= 40) this.scoring.grade = 'C';
  else if (percentage >= 30) this.scoring.grade = 'D';
  else this.scoring.grade = 'F';
  
  // Check if passed (this should be compared with exam's passing marks)
  await this.populate('exam');
  this.scoring.passed = marksObtained >= this.exam.passingMarks;
  
  return this.scoring;
};

// Method to add violation
submissionSchema.methods.addViolation = function(type, description, severity = 'medium', screenshot = null) {
  this.proctoring.violations.push({
    type,
    description,
    severity,
    screenshot,
    timestamp: new Date()
  });
  
  // Update counters
  if (type === 'tab-switch') this.proctoring.tabSwitches++;
  if (type === 'window-blur') this.proctoring.windowBlurs++;
  if (['face-not-detected', 'multiple-faces', 'suspicious-activity'].includes(type)) {
    this.proctoring.suspiciousActivities++;
  }
};

// Method to check if submission should be auto-disqualified
submissionSchema.methods.shouldDisqualify = function(examSettings) {
  if (!examSettings.proctoring.enabled) return false;
  
  const tabSwitchLimit = examSettings.proctoring.tabSwitchLimit || 3;
  const windowBlurLimit = examSettings.proctoring.windowBlurLimit || 5;
  
  return this.proctoring.tabSwitches > tabSwitchLimit || 
         this.proctoring.windowBlurs > windowBlurLimit ||
         this.proctoring.suspiciousActivities > 10;
};

// Static method to find submissions by exam
submissionSchema.statics.findByExam = function(examId) {
  return this.find({ exam: examId }).populate('student', 'name email studentId');
};

// Static method to find submissions by student
submissionSchema.statics.findByStudent = function(studentId) {
  return this.find({ student: studentId }).populate('exam', 'title subject duration');
};

module.exports = mongoose.model('Submission', submissionSchema);