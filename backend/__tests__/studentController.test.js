import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mockUserFindById = jest.fn();
const mockUserFind = jest.fn();

jest.unstable_mockModule('../src/models/User.js', () => ({
  default: {
    findById: mockUserFindById,
    find: mockUserFind,
  },
}));

const mockResultFind = jest.fn();
jest.unstable_mockModule('../src/models/Result.js', () => ({
  default: { find: mockResultFind },
}));

jest.unstable_mockModule('../src/models/Attendance.js', () => ({
  default: { aggregate: jest.fn().mockResolvedValue([]) },
}));

const mockFeeFind = jest.fn();
jest.unstable_mockModule('../src/models/Fee.js', () => ({
  default: { find: mockFeeFind },
}));

jest.unstable_mockModule('mongoose', () => {
  function ObjectIdMock(id) { return id; }
  ObjectIdMock.isValid = jest.fn().mockReturnValue(true);
  return {
    default: {
      Types: { ObjectId: ObjectIdMock },
    },
  };
});

const { getStudentProfile, getStudentDashboard, getMyResults, getStudentsByTeacher } =
  await import('../src/controllers/studentController.js');

describe('studentController', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      user: { id: 'student1', role: 'student' },
      body: {},
      params: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('getStudentProfile', () => {
    it('should return profile for authenticated student', async () => {
      const student = {
        _id: 'student1',
        full_name: 'John Doe',
        email: 's1@s.com',
        school_id: 'S1',
        role: 'student',
        assigned_class: 'Grade 10-A',
        assigned_subjects: [],
      };
      mockUserFindById.mockReturnValue({ select: jest.fn().mockResolvedValue(student) });

      await getStudentProfile(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          full_name: 'John Doe',
          email: 's1@s.com',
          school_id: 'S1',
          role: 'student',
        })
      );
    });

    it('should return 404 if student not found', async () => {
      mockUserFindById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

      await getStudentProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User profile not found' });
    });

    it('should handle server errors', async () => {
      mockUserFindById.mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('DB Error')),
      });

      await getStudentProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getStudentDashboard', () => {
    it('should return 404 if student not found', async () => {
      mockUserFindById.mockResolvedValue(null);

      await getStudentDashboard(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 404 if user is not a student', async () => {
      mockUserFindById.mockResolvedValue({ _id: 'user1', role: 'teacher' });

      await getStudentDashboard(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return dashboard data for valid student', async () => {
      const student = {
        _id: 'student1',
        full_name: 'John Doe',
        school_id: 'S1',
        email: 's1@s.com',
        role: 'student',
        assigned_class: 'Grade 10-A',
      };
      mockUserFindById.mockResolvedValue(student);
      mockResultFind.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
      });
      mockFeeFind.mockResolvedValue([]);

      await getStudentDashboard(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          profile: expect.objectContaining({ full_name: 'John Doe' }),
          academic_summary: [],
          attendance_stats: expect.any(Object),
          financial_status: expect.objectContaining({ total_balance: 0, status: 'Clear' }),
        })
      );
    });

    it('should calculate correct financial status with outstanding balance', async () => {
      const student = {
        _id: 'student1',
        full_name: 'Jane',
        school_id: 'S2',
        email: 's2@s.com',
        role: 'student',
        assigned_class: 'Grade 10-A',
      };
      mockUserFindById.mockResolvedValue(student);
      mockResultFind.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
      });
      mockFeeFind.mockResolvedValue([
        { balance: 300 },
        { balance: 200 },
      ]);

      await getStudentDashboard(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.financial_status.total_balance).toBe(500);
      expect(response.financial_status.status).toBe('Outstanding');
      expect(response.financial_status.invoice_count).toBe(2);
    });
  });

  describe('getMyResults', () => {
    it('should return formatted results for student', async () => {
      const results = [
        {
          _id: 'r1',
          student: { full_name: 'John', school_id: 'S1' },
          subject: 'Math',
          score: 85,
          grade: 'A',
          term: '1',
          year: 2025,
          createdAt: new Date(),
        },
      ];
      mockResultFind.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(results),
        }),
      });

      await getMyResults(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response[0].grade_letter).toBe('A');
      expect(response[0].is_pass).toBe(true);
    });

    it('should return 404 if no results found', async () => {
      mockResultFind.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([]),
        }),
      });

      await getMyResults(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getStudentsByTeacher', () => {
    it('should return all students for admin', async () => {
      req.user = { id: 'admin1', role: 'admin' };
      const students = [{ full_name: 'John', role: 'student' }];
      mockUserFind.mockReturnValue({ select: jest.fn().mockResolvedValue(students) });

      await getStudentsByTeacher(req, res);

      expect(res.json).toHaveBeenCalledWith(students);
    });

    it('should return all students for teacher', async () => {
      req.user = { id: 'teacher1', role: 'teacher' };
      const students = [{ full_name: 'John', role: 'student' }];
      mockUserFind.mockReturnValue({ select: jest.fn().mockResolvedValue(students) });

      await getStudentsByTeacher(req, res);

      expect(res.json).toHaveBeenCalledWith(students);
    });

    it('should return 403 for non-admin/non-teacher', async () => {
      req.user = { id: 'student1', role: 'student' };

      await getStudentsByTeacher(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
