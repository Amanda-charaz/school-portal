import express from 'express';
import {
  getStudentProfile,
  getStudentDashboard,
  getMyAttendance,
  getStudentTeachers,
} from '../controllers/studentController.js';
import { protect, studentOnly, teacherOrAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET /api/student/profile
router.get('/profile', protect, studentOnly, getStudentProfile);

// @route   GET /api/student/dashboard
router.get('/dashboard', protect, studentOnly, getStudentDashboard);

// @route   GET /api/student/my-teachers
router.get('/my-teachers', protect, studentOnly, getStudentTeachers);

// @route   GET /api/student/my-attendance
router.get('/my-attendance', protect, studentOnly, getMyAttendance);

export default router;