import express from 'express';
import { serveSecureFile } from '../controllers/fileController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect the endpoint so only logged-in users can access school documents
router.get('/view-document', protect, serveSecureFile);

export default router;