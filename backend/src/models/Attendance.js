import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  student_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  date: { 
    type: Date, 
    required: [true, 'Attendance date is required'] 
  },
  status: { 
    type: String, 
    enum: ['Present', 'Absent', 'Late'], 
    default: 'Present' 
  },
  marked_by: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  class_name: { 
    type: String, 
    trim: true 
  }
}, { timestamps: true });

// 🚀 Optimization: Speeds up history lookups and ensures a student only has one record per date
attendanceSchema.index({ student_id: 1, date: -1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;