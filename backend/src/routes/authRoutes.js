import express from 'express';
import { login, changePassword, forgotPassword, resetPassword } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   POST /api/auth/login
// @desc    Login user
router.post('/login', login);

// @route   PUT /api/auth/change-password
// @desc    Allows any authenticated user to update their own password
router.put('/change-password', protect, changePassword);

// @route   POST /api/auth/forgot-password
// @desc    Public endpoint to request a reset token
router.post('/forgot-password', forgotPassword);

// @route   POST /api/auth/reset-password
// @desc    Public endpoint to submit new password with token
router.post('/reset-password', resetPassword);

export default router;