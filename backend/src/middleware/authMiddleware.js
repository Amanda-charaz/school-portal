import jwt from 'jsonwebtoken';

export const protect = async (req, res, next) => {
    let token = req.headers.authorization?.split(" ")[1];

    if (!token) return res.status(401).json({ message: "Not authorized, no token" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Token expired, please log in again" });
        }
        res.status(401).json({ message: "Invalid token" });
    }
};

// Flexible authorization helper that handles both role and role_id
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const userRole = String(req.user.role || req.user.role_id || "").toLowerCase();

    if (allowedRoles.includes(userRole)) {
      next();
    } else {
      console.log(`❌ Access Denied. User Role: ${userRole} | Required: ${allowedRoles}`);
      return res.status(403).json({
        message: `Access denied. Role '${userRole}' is not authorized.`
      });
    }
  };
};

// Role-specific middleware for common access patterns
export const studentOnly = authorize('student');
export const teacherOnly = authorize('teacher');
export const adminOnly = authorize('admin');
export const teacherOrAdmin = authorize('teacher', 'admin');
export const staffOnly = authorize('teacher', 'admin', 'general staff', 'receptionist', 'principal');