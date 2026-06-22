import express from 'express';
import * as accountsController from '../controllers/accountsController.js';
import { protect, adminOnly, studentOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// 🔒 All routes require authentication
router.use(protect);

// Student self-service routes
router.get('/my-transactions', studentOnly, accountsController.getMyTransactions);

// Receipt route accessible to both admin and the owning student (controller handles auth check)
router.get('/receipt/:id', accountsController.generateReceiptPDF);

// Admin-only financial management routes
router.get('/summary', adminOnly, accountsController.getAccountsSummary);
router.post('/transaction', adminOnly, accountsController.addTransaction);
router.get('/outstanding-balance', adminOnly, accountsController.getOutstandingBalance);
router.delete('/transaction/:id', adminOnly, accountsController.deleteTransaction);

export default router;