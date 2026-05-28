import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  // 🔗 Establish a strict foreign-key style pointer to the User document
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // One-to-one mapping between account and student profile
  },
  school_id: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  current_class: {
    type: String,
    required: [true, 'Assigned class grade is required'],
    trim: true, // e.g., "Grade 10-A"
  },
  guardian_name: {
    type: String,
    trim: true,
  },
  guardian_contact: {
    type: String,
    trim: true,
  },
  academic_records: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Result' // Links dynamically to their grades collection records
  }]
}, { timestamps: true });

const Student = mongoose.model('Student', studentSchema);
export default Student;
