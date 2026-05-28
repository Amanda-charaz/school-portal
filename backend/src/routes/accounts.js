import express from 'express';
import * as accountsController from '../controllers/accountsController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// 🔒 Secure the entire router - only authenticated Admins should access finances
router.use(protect);
router.use(adminOnly);

// @route   GET /accounts/summary
// @desc    Get all transactions for the financial overview
router.get('/summary', accountsController.getAccountsSummary);

// @route   POST /accounts/transaction
// @desc    Log a new income (tuition) or school expense
router.post('/transaction', accountsController.addTransaction);

// @route   GET /accounts/outstanding-balance
// @desc    Calculate the total outstanding tuition balance for all students
router.get('/outstanding-balance', accountsController.getOutstandingBalance);

// @route   GET /accounts/receipt/:id
// @desc    Generate PDF receipt for a transaction
router.get('/receipt/:id', accountsController.generateReceiptPDF);

export default router;