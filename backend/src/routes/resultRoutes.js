import express from 'express';
const router = express.Router();

import {
    addResult,
    getAllResults,
    getMyResults,
    getLeaderboard
} from '../controllers/resultsController.js';

import { protect, teacherOrAdmin, studentOnly } from '../middleware/authMiddleware.js';

// Teachers and admins can add results
router.post('/add', protect, teacherOrAdmin, addResult);

// Only admins can view all results across the system
router.get('/all', protect, teacherOrAdmin, getAllResults);

// Students and authenticated users can view their own results
router.get('/my-results', protect, getMyResults);

// All authenticated users can view leaderboard
router.get('/leaderboard', protect, getLeaderboard);

export default router;