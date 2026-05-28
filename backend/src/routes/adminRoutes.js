import express from "express";
const router = express.Router();
import * as adminController from "../controllers/adminController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

// All admin routes require authentication and admin role
router.use(protect, adminOnly);

// Audit logs
router.get("/logs", adminController.getAuditLogs);
router.get("/system-logs", adminController.getSystemLogs);

// User management - CRUD operations
router.get("/users", adminController.getAllUsers);
router.get("/users/role/:role", adminController.getUsersByRole);
router.get("/users/:id", adminController.getUserById);
router.post("/users", adminController.createUser);
router.put("/users/:id", adminController.updateUser);
router.delete("/users/:id", adminController.deleteUser);

// User operations
router.post("/users/:id/reset-password", adminController.resetUserPassword);
router.post("/users/:id/deactivate", adminController.deactivateUser);

// Class management
router.get("/classes", adminController.getAllClasses);
router.post("/classes", adminController.createClass);
router.put("/classes/:id", adminController.updateClass);
router.delete("/classes/:id", adminController.deleteClass);
router.get("/classes/:name/members", adminController.getClassMembers);
router.post("/classes/assign", adminController.assignUsersToClass);
router.post("/classes/promote", adminController.promoteClass);

export default router;