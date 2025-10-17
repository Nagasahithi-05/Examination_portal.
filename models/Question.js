const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Question type is required'],
    enum: ['mcq', 'short-answer', 'coding', 'essay', 'true-false', 'fill-blank'],
    default: 'mcq'
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  marks: {
    type: Number,
    required: [true, 'Marks are required'],
    min: [1, 'Marks must be at least 1']
  },
  timeLimit: {
    type: Number, // in seconds
    default: null
  },
  
  // For MCQ questions
  options: [{
    text: {
      type: String,
      required: function() {
        return this.parent().type === 'mcq' || this.parent().type === 'true-false';
      }
    },
    isCorrect: {
      type: Boolean,
      default: false
    },
    explanation: String
  }],
  
  // For coding questions
  codingDetails: {
    language: {
      type: String,
      enum: ['javascript', 'python', 'java', 'cpp', 'c', 'csharp', 'php', 'ruby', 'go'],
      required: function() {
        return this.type === 'coding';
      }
    },
    starterCode: String,
    testCases: [{
      input: String,
      expectedOutput: String,
      isHidden: {
        type: Boolean,
        default: false
      },
      points: {
        type: Number,
        default: 1
      }
    }],
    constraints: String,
    examples: [{
      input: String,
      output: String,
      explanation: String
    }]
  },
  
  // For short answer and essay questions
  answerDetails: {
    maxLength: {
      type: Number,
      required: function() {
        return this.type === 'short-answer' || this.type === 'essay';
      },
      default: function() {
        return this.type === 'essay' ? 1000 : 200;
      }
    },
    keywords: [String], // For auto-grading
    sampleAnswer: String
  },
  
  // For fill in the blanks
  fillBlanks: {
    textWithBlanks: {
      type: String,
      required: function() {
        return this.type === 'fill-blank';
      }
    },
    answers: [{
      blankId: Number,
      correctAnswers: [String], // Multiple correct answers possible
      caseSensitive: {
        type: Boolean,
        default: false
      }
    }]
  },
  
  explanation: {
    type: String,
    trim: true
  },
  
  hints: [{
    text: String,
    penalty: {
      type: Number,
      default: 0 // Marks deducted for using hint
    }
  }],
  
  media: {
    images: [{
      url: String,
      caption: String,
      position: {
        type: String,
        enum: ['before', 'after', 'inline'],
        default: 'before'
      }
    }],
    videos: [{
      url: String,
      title: String,
      duration: Number
    }],
    audio: [{
      url: String,
      title: String,
      duration: Number
    }]
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  tags: [String],
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  usageCount: {
    type: Number,
    default: 0
  },
  
  averageScore: {
    type: Number,
    default: 0
  },
  
  averageTime: {
    type: Number, // in seconds
    default: 0
  },
  
  category: {
    type: String,
    default: 'general'
  },
  
  version: {
    type: Number,
    default: 1
  },
  
  parentQuestion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
questionSchema.index({ createdBy: 1 });
questionSchema.index({ type: 1 });
questionSchema.index({ subject: 1 });
questionSchema.index({ difficulty: 1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ isActive: 1 });
questionSchema.index({ 'codingDetails.language': 1 });

// Validation for MCQ questions
questionSchema.pre('save', function(next) {
  if (this.type === 'mcq') {
    if (!this.options || this.options.length < 2) {
      return next(new Error('MCQ questions must have at least 2 options'));
    }
    
    const correctOptions = this.options.filter(option => option.isCorrect);
    if (correctOptions.length === 0) {
      return next(new Error('MCQ questions must have at least one correct option'));
    }
  }
  
  if (this.type === 'true-false') {
    if (!this.options || this.options.length !== 2) {
      return next(new Error('True/False questions must have exactly 2 options'));
    }
  }
  
  if (this.type === 'coding') {
    if (!this.codingDetails || !this.codingDetails.language) {
      return next(new Error('Coding questions must specify a programming language'));
    }
  }
  
  next();
});

// Virtual for correct answer (for MCQ)
questionSchema.virtual('correctAnswer').get(function() {
  if (this.type === 'mcq' || this.type === 'true-false') {
    return this.options.filter(option => option.isCorrect);
  }
  return null;
});

// Method to check if answer is correct
questionSchema.methods.checkAnswer = function(userAnswer) {
  switch (this.type) {
    case 'mcq':
    case 'true-false':
      const correctOptions = this.options.filter(option => option.isCorrect);
      const correctIds = correctOptions.map(option => option._id.toString());
      const userIds = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
      return JSON.stringify(correctIds.sort()) === JSON.stringify(userIds.sort());
      
    case 'short-answer':
      if (this.answerDetails && this.answerDetails.keywords) {
        const answer = userAnswer.toLowerCase();
        return this.answerDetails.keywords.some(keyword => 
          answer.includes(keyword.toLowerCase())
        );
      }
      return false;
      
    case 'fill-blank':
      if (this.fillBlanks && this.fillBlanks.answers) {
        return this.fillBlanks.answers.every(blank => {
          const userBlankAnswer = userAnswer[blank.blankId];
          if (!userBlankAnswer) return false;
          
          const checkAnswer = blank.caseSensitive ? 
            userBlankAnswer : userBlankAnswer.toLowerCase();
          
          return blank.correctAnswers.some(correct => {
            const correctAnswer = blank.caseSensitive ? correct : correct.toLowerCase();
            return checkAnswer === correctAnswer;
          });
        });
      }
      return false;
      
    default:
      return false; // Manual grading required
  }
};

// Method to calculate score
questionSchema.methods.calculateScore = function(userAnswer, timeSpent = 0) {
  if (this.type === 'coding') {
    // Coding questions need special handling
    return 0; // Placeholder - requires code execution
  }
  
  const isCorrect = this.checkAnswer(userAnswer);
  return isCorrect ? this.marks : 0;
};

// Static method to find by subject
questionSchema.statics.findBySubject = function(subject) {
  return this.find({ subject, isActive: true });
};

// Static method to find by difficulty
questionSchema.statics.findByDifficulty = function(difficulty) {
  return this.find({ difficulty, isActive: true });
};

module.exports = mongoose.model('Question', questionSchema);