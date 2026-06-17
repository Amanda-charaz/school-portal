import express from 'express';
const router = express.Router();
import * as feeController from '../controllers/feeController.js';
import { protect, adminOnly, studentOnly } from '../middleware/authMiddleware.js';

// Example fee routes
router.post('/add', protect, adminOnly, feeController.addFee);
router.get('/all', protect, adminOnly, feeController.getAllFees);
router.get('/student/:studentId', protect, adminOnly, feeController.getStudentFees);
router.post('/invoice', protect, adminOnly, feeController.generateInvoice);

// Student self-service route
router.get('/my-fees', protect, studentOnly, feeController.getMyFees);

// Invoice generation route
router.get('/invoice/:id', protect, feeController.generateInvoicePDF);

export default router;