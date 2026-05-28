import express from "express";
const router = express.Router();
import * as authController from "../controllers/authController.js";
import { protect, adminOnly } from '../middleware/authMiddleware.js';

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.get('/users', protect, adminOnly, authController.getUsers);
router.delete('/users/:id', protect, adminOnly, authController.deleteUser);

export default router;