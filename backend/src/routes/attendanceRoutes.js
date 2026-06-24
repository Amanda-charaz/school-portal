import express from 'express';
import {
  addAttendance,
  getAllAttendance,
  exportAttendancePDF,
  getTeacherAttendanceTrends,
  getClassSummary,
  exportAttendanceCSV,
  getMyAttendance
} from '../controllers/attendanceController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route /api/attendance
 */

router.post('/add', protect, authorize('teacher', 'admin'), addAttendance);
router.post('/bulk', protect, authorize('teacher', 'admin'), addAttendance); // Alias for README compatibility
router.get('/all', protect, authorize('admin', 'teacher'), getAllAttendance);
router.get('/daily-report', protect, authorize('admin'), getAllAttendance); // Alias for README compatibility
router.get('/my-attendance', protect, authorize('student'), getMyAttendance);
router.get('/export-report', protect, authorize('student'), exportAttendancePDF);
router.get('/export-csv', protect, authorize('admin'), exportAttendanceCSV);
router.get('/teacher-trends', protect, authorize('teacher', 'admin'), getTeacherAttendanceTrends);
router.get('/class-summary', protect, authorize('teacher', 'admin'), getClassSummary);

export default router;