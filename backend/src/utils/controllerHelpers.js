import mongoose from 'mongoose';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

/**
 * Extracts the normalized lowercase role string from the request user object.
 */
export const getUserRole = (req) => {
  return String(req.user.role || req.user.role_id || '').toLowerCase();
};

/**
 * Converts a value to a Mongoose ObjectId if valid, otherwise returns as-is.
 */
export const toObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id)
    ? new mongoose.Types.ObjectId(id)
    : id;
};

/**
 * Normalizes a date string to midnight UTC (YYYY-MM-DD boundary).
 */
export const normalizeDateUTC = (dateInput) => {
  const d = new Date(dateInput);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

/**
 * Builds a Mongoose date range filter object from optional start/end strings.
 * Returns null if neither bound is provided.
 */
export const buildDateRangeFilter = (startDate, endDate) => {
  if (!startDate && !endDate) return null;
  const filter = {};
  if (startDate) {
    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);
    filter.$gte = start;
  }
  if (endDate) {
    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);
    filter.$lte = end;
  }
  return filter;
};

/**
 * Calculates the ZIMSEC O-Level grade letter from a numeric score.
 */
export const calculateGrade = (score) => {
  const num = Number(score);
  if (num >= 80) return 'A';
  if (num >= 70) return 'B';
  if (num >= 60) return 'C';
  if (num >= 50) return 'D';
  if (num >= 40) return 'E';
  return 'U';
};

/**
 * Parses an assigned_subjects value (string or array) into a normalized array.
 */
export const parseSubjectsList = (subjects) => {
  if (Array.isArray(subjects)) return subjects;
  if (typeof subjects === 'string') {
    return subjects.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
};

/**
 * Parses a comma-separated class string into an array of trimmed class names.
 */
export const parseClassList = (classString) => {
  if (!classString) return [];
  return classString.split(',').map(c => c.trim()).filter(Boolean);
};

/**
 * Checks whether a teacher is assigned to a given subject (case-insensitive).
 */
export const isTeacherAssignedToSubject = (teacherSubjects, subject) => {
  const list = parseSubjectsList(teacherSubjects);
  const normalized = (subject || '').trim().toLowerCase();
  return list.some(s => s.trim().toLowerCase() === normalized);
};

/**
 * Finds a student User document by school_id.
 */
export const findStudentBySchoolId = async (schoolId) => {
  return User.findOne({ school_id: schoolId, role: 'student' });
};

/**
 * Creates an audit log entry.
 */
export const createAuditLog = async ({ actionType, performedBy, targetUser, details }) => {
  return AuditLog.create({
    actionType,
    performedBy,
    targetUser,
    details,
    timestamp: new Date(),
  });
};

/**
 * Sends a standardized JSON error response.
 */
export const sendError = (res, statusCode, message, error) => {
  const payload = { message };
  if (error) payload.error = typeof error === 'string' ? error : error.message;
  return res.status(statusCode).json(payload);
};

/**
 * Retrieves the list of student ObjectIds visible to a teacher or admin.
 * Admins see all students; teachers see students in their assigned classes.
 */
export const getVisibleStudentIds = async (req) => {
  const role = getUserRole(req);

  if (role === 'admin') {
    const students = await User.find({ role: 'student' }).select('_id');
    return students.map(s => s._id);
  }

  const teacher = await User.findById(req.user.id);
  if (!teacher || !teacher.assigned_class) return [];

  const classList = parseClassList(teacher.assigned_class);
  const students = await User.find({
    role: 'student',
    assigned_class: { $in: classList },
  }).select('_id');
  return students.map(s => s._id);
};

/**
 * Validates that a numeric score is between 0 and 100.
 * Returns an error message string or null if valid.
 */
export const validateScore = (score) => {
  const num = Number(score);
  if (isNaN(num) || num < 0 || num > 100) {
    return 'Invalid score. Must be between 0 and 100.';
  }
  return null;
};
