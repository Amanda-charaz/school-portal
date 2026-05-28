import mongoose from 'mongoose';

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Class name is required (e.g., Grade 10-A)'],
    unique: true,
    trim: true
  },
  description: { type: String, trim: true },
  formTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // A class might not always have a form teacher assigned
  }
}, { timestamps: true });

// 🛡️ Integrity: Ensure a teacher can only be assigned to ONE class as a form teacher
classSchema.index({ formTeacher: 1 }, { unique: true, sparse: true });

const Class = mongoose.model('Class', classSchema);
export default Class;