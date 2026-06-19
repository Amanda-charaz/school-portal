import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock jsonwebtoken before importing the module under test
const mockVerify = jest.fn();
jest.unstable_mockModule('jsonwebtoken', () => ({
  default: { verify: mockVerify },
}));

const { protect, authorize, studentOnly, teacherOnly, adminOnly, teacherOrAdmin, staffOnly } = await import('../src/middleware/authMiddleware.js');

describe('authMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  describe('protect', () => {
    it('should return 401 if no authorization header', async () => {
      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized, no token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if authorization header has no token', async () => {
      req.headers.authorization = 'Bearer ';
      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should set req.user and call next on valid token', async () => {
      const decoded = { id: 'user123', role: 'admin' };
      mockVerify.mockReturnValue(decoded);
      req.headers.authorization = 'Bearer valid-token';

      await protect(req, res, next);

      expect(mockVerify).toHaveBeenCalledWith('valid-token', 'test-secret');
      expect(req.user).toEqual(decoded);
      expect(next).toHaveBeenCalled();
    });

    it('should return 401 on invalid/expired token', async () => {
      mockVerify.mockImplementation(() => { throw new Error('jwt expired'); });
      req.headers.authorization = 'Bearer bad-token';

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Token failed' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('authorize', () => {
    it('should return 401 if req.user is not set', () => {
      const middleware = authorize('admin');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Not authenticated' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next if user role matches allowed roles', () => {
      req.user = { role: 'admin' };
      const middleware = authorize('admin', 'teacher');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 403 if user role does not match', () => {
      req.user = { role: 'student' };
      const middleware = authorize('admin', 'teacher');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle role_id fallback when role is missing', () => {
      req.user = { role_id: 'teacher' };
      const middleware = authorize('teacher');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should be case-insensitive for role matching', () => {
      req.user = { role: 'Admin' };
      const middleware = authorize('admin');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should handle empty role gracefully', () => {
      req.user = {};
      const middleware = authorize('admin');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('role-specific middleware', () => {
    it('studentOnly allows student role', () => {
      req.user = { role: 'student' };
      studentOnly(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('studentOnly blocks non-student role', () => {
      req.user = { role: 'teacher' };
      studentOnly(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('teacherOnly allows teacher role', () => {
      req.user = { role: 'teacher' };
      teacherOnly(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('adminOnly allows admin role', () => {
      req.user = { role: 'admin' };
      adminOnly(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('teacherOrAdmin allows both teacher and admin', () => {
      req.user = { role: 'teacher' };
      teacherOrAdmin(req, res, next);
      expect(next).toHaveBeenCalled();

      jest.clearAllMocks();
      req.user = { role: 'admin' };
      teacherOrAdmin(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('staffOnly allows all staff roles', () => {
      const staffRoles = ['teacher', 'admin', 'general staff', 'receptionist', 'principal'];
      for (const role of staffRoles) {
        jest.clearAllMocks();
        req.user = { role };
        staffOnly(req, res, next);
        expect(next).toHaveBeenCalled();
      }
    });

    it('staffOnly blocks student role', () => {
      req.user = { role: 'student' };
      staffOnly(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
