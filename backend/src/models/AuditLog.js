import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  actionType: {
    type: String,
    required: true,
    enum: [
      'CLASS_PROMOTION', 'USER_CREATED', 'USER_UPDATED', 'USER_DELETED',
      'PASSWORD_RESET', 'CLASS_CREATED', 'CLASS_UPDATED', 'CLASS_DELETED',
      'CLASS_ASSIGNMENT_UPDATED',
      'ATTENDANCE_MARKED',
      'RESULT_CREATED', 'RESULT_UPDATED', 'RESULT_DELETED'
    ]
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetUser: { // Optional: if the action targets a specific user (e.g., password reset)
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  details: { // Flexible object to store action-specific data
    type: Object
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;