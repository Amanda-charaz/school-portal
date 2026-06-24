import express from 'express';
import { getMyStudents } from '../controllers/teacherController.js';
import { protect, teacherOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET /api/teacher/my-students
// @desc    Get all students assigned to the logged-in teacher
router.get('/my-students', protect, teacherOnly, getMyStudents);

export default router;