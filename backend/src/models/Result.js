import mongoose from 'mongoose';

const resultSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // References the User model for students
    required: true,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  score: {
    type: Number,
    required: true,
    min: [0, 'Score cannot be less than 0%'],
    max: [100, 'Score cannot exceed 100%'],
  },
  grade: {
    type: String,
    required: true,
    enum: ['A', 'B', 'C', 'D', 'E', 'U'], // ZIMSEC O-Level grades
  },
  term: {
    type: String,
    required: true,
    enum: {
      values: ['1', '2', '3'],
      message: '{VALUE} is not a valid academic term (Expected 1, 2, or 3)'
    },
  },
  year: {
    type: Number,
    required: true,
    default: () => new Date().getFullYear(), // Default to current year
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // References the User model for teachers/admins
    required: true,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
});

// 🚀 Optimization: Speeds up academic history retrieval and strictly prevents duplicate entries
resultSchema.index({ student: 1, year: -1, term: -1, subject: 1 }, { unique: true });

const Result = mongoose.model('Result', resultSchema);

export default Result;