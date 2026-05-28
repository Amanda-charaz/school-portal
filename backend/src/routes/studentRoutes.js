import express from 'express';
import { getStudentProfile, getStudentDashboard, getMyResults, getStudentsByTeacher } from '../controllers/studentController.js';
import { protect, studentOnly, teacherOrAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Student specific routes
router.get('/profile', protect, studentOnly, getStudentProfile);
router.get('/dashboard', protect, studentOnly, getStudentDashboard);
router.get('/results', protect, studentOnly, getMyResults);

// Shared/Staff routes
router.get('/teacher/students', protect, teacherOrAdmin, getStudentsByTeacher);

export default router;