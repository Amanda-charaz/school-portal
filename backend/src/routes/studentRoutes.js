import express from 'express';
import {
  getStudentProfile,
  getStudentDashboard,
  getMyAttendance,
  getStudentTeachers,
  getMyResults,
  getAllClasses
} from '../controllers/studentController.js';
import { protect, studentOnly, teacherOrAdmin } from '../middleware/authMiddleware.js';
import { getMyStudents } from '../controllers/teacherController.js';

const router = express.Router();

// @route   GET /api/student/profile
router.get('/profile', protect, studentOnly, getStudentProfile);

// @route   GET /api/student/dashboard
router.get('/dashboard', protect, studentOnly, getStudentDashboard);

// @route   GET /api/student/my-teachers
router.get('/my-teachers', protect, studentOnly, getStudentTeachers);

// @route   GET /api/student/my-attendance
router.get('/my-attendance', protect, studentOnly, getMyAttendance);

// @route   GET /api/student/results
router.get('/results', protect, studentOnly, getMyResults);

// @route   GET /api/student/teacher/students
// @desc    (Teacher) Get students for the logged-in teacher's class(es). Alias for /api/teacher/my-students
router.get('/teacher/students', protect, teacherOrAdmin, getMyStudents);

// @route   GET /api/student/classes
// @desc    Get all distinct classes (accessible to teachers and admins)
router.get('/classes', protect, teacherOrAdmin, getAllClasses);

export default router;