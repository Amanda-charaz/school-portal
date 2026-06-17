import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  full_name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: {
    type: String,
    required: true,
    enum: ['student', 'teacher', 'admin']
  },
  school_id: { type: String, unique: true }, // Auto-generated (e.g., S1, T1)
    assigned_class: { type: String },          // For students and form teachers
  assigned_subjects: [{ type: String }],     // For teachers
    raw_password_view: { type: String },        // Temporary password view for admin
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, {
  timestamps: true // Auto-generates createdAt and updatedAt fields
});

// 🔒 Pre-save hook to automatically hash passwords before database storage
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Clean ESM Default Export
export default mongoose.model('User', userSchema);