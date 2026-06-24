import jwt from 'jsonwebtoken';
import Result from '../models/Result.js';
import User from '../models/User.js';
import { isTeacherAssignedToSubject } from '../utils/permissions.js';

/**
 * Middleware to protect routes by verifying JWT token.
 */
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token and attach to request object
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

/**
 * Generic role-based authorization middleware.
 * @param  {...string} roles - List of allowed roles.
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    const userRole = String(req.user?.role || '').toLowerCase();
    const allowedRoles = roles.map(r => String(r).toLowerCase());

    if (!req.user || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: `Access Denied. User Role: '${req.user?.role || 'None'}' | Required: ${roles.join(' or ')}`,
      });
    }
    next();
  };
};

// Role-specific middleware helpers
export const adminOnly = authorize('admin');
export const teacherOnly = authorize('teacher');
export const studentOnly = authorize('student');
export const teacherOrAdmin = authorize('teacher', 'admin');

/**
 * Middleware to protect routes that modify a result.
 * It allows admins to proceed, and checks if teachers are assigned to the result's subject.
 */
export const checkResultPermission = async (req, res, next) => {
  try {
    const userRole = String(req.user.role || req.user.role_id || "").toLowerCase();

    // Admins have full access
    if (userRole === 'admin') {
      return next();
    }

    // Only teachers and admins can modify results
    if (userRole !== 'teacher') {
      return res.status(403).json({ message: "Access denied. You are not authorized to perform this action." });
    }

    // For teachers, check subject assignment
    const teacher = await User.findById(req.user.id);
    let subject;

    if (req.params.id) {
      // For update/delete, get subject from the existing result
      const result = await Result.findById(req.params.id);
      if (!result) return res.status(404).json({ message: "Result not found" });
      subject = result.subject;
    } else {
      // For add, get subject from the request body
      subject = req.body.subject;
    }

    if (!isTeacherAssignedToSubject(teacher, subject)) {
      return res.status(403).json({ message: `Access denied. You are not assigned to teach ${subject || 'this subject'}.` });
    }

    next();
  } catch (err) {
    res.status(500).json({ message: "Permission check failed", error: err.message });
  }
};