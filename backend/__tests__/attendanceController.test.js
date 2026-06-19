import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mockBulkWrite = jest.fn();
const mockAttendanceFind = jest.fn();

jest.unstable_mockModule('../src/models/Attendance.js', () => ({
  default: {
    bulkWrite: mockBulkWrite,
    find: mockAttendanceFind,
    aggregate: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

const mockUserFindById = jest.fn();
const mockUserFind = jest.fn();
const mockUserCountDocuments = jest.fn();

jest.unstable_mockModule('../src/models/User.js', () => ({
  default: {
    findById: mockUserFindById,
    find: mockUserFind,
    countDocuments: mockUserCountDocuments,
  },
}));

const mockAuditLogCreate = jest.fn();
jest.unstable_mockModule('../src/models/AuditLog.js', () => ({
  default: { create: mockAuditLogCreate },
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

jest.unstable_mockModule('date-fns', () => ({
  startOfDay: jest.fn((d) => d),
  subDays: jest.fn((d, n) => new Date(d.getTime() - n * 86400000)),
}));

jest.unstable_mockModule('pdfkit', () => ({
  default: jest.fn(),
}));

const { addAttendance, getAllAttendance, getMyAttendance } =
  await import('../src/controllers/attendanceController.js');

describe('attendanceController', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      user: { id: 'teacher1', role: 'teacher' },
      body: {},
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('addAttendance', () => {
    it('should return 400 if date is missing', async () => {
      req.body = { students: [{ student_id: 's1', status: 'Present' }] };

      await addAttendance(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Date and student list are required.' });
    });

    it('should return 400 if students is missing', async () => {
      req.body = { date: '2025-01-15' };

      await addAttendance(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if students is not an array', async () => {
      req.body = { date: '2025-01-15', students: 'not-array' };

      await addAttendance(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should successfully record attendance via bulkWrite', async () => {
      req.body = {
        date: '2025-01-15',
        class_name: 'Grade 10-A',
        students: [
          { student_id: 's1', status: 'Present' },
          { student_id: 's2', status: 'Absent' },
        ],
      };
      mockBulkWrite.mockResolvedValue({});
      mockAuditLogCreate.mockResolvedValue();

      await addAttendance(req, res);

      expect(mockBulkWrite).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Attendance for Grade 10-A recorded successfully.',
      });
    });

    it('should create audit log with correct details', async () => {
      req.body = {
        date: '2025-01-15',
        class_name: 'Grade 10-A',
        students: [{ student_id: 's1', status: 'Present' }],
      };
      mockBulkWrite.mockResolvedValue({});
      mockAuditLogCreate.mockResolvedValue();

      await addAttendance(req, res);

      expect(mockAuditLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          actionType: 'ATTENDANCE_MARKED',
          performedBy: 'teacher1',
          details: expect.objectContaining({
            class_name: 'Grade 10-A',
            studentCount: 1,
          }),
        })
      );
    });

    it('should handle server errors', async () => {
      req.body = {
        date: '2025-01-15',
        students: [{ student_id: 's1', status: 'Present' }],
      };
      mockBulkWrite.mockRejectedValue(new Error('DB Error'));

      await addAttendance(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getAllAttendance', () => {
    it('should return all attendance records for admin', async () => {
      req.user = { id: 'admin1', role: 'admin' };
      const data = [{ student_id: 's1', status: 'Present' }];
      mockAttendanceFind.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue(data),
          }),
        }),
      });

      await getAllAttendance(req, res);

      expect(res.json).toHaveBeenCalledWith(data);
    });

    it('should filter by date when provided', async () => {
      req.user = { id: 'admin1', role: 'admin' };
      req.query = { date: '2025-01-15' };
      const data = [];
      mockAttendanceFind.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue(data),
          }),
        }),
      });

      await getAllAttendance(req, res);

      expect(res.json).toHaveBeenCalledWith(data);
    });

    it('should filter by class for teacher', async () => {
      req.user = { id: 'teacher1', role: 'teacher' };
      mockUserFindById.mockResolvedValue({ assigned_class: 'Grade 10-A' });
      const data = [];
      mockAttendanceFind.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue(data),
          }),
        }),
      });

      await getAllAttendance(req, res);

      expect(res.json).toHaveBeenCalledWith(data);
    });

    it('should return empty array if teacher has no assigned class', async () => {
      req.user = { id: 'teacher1', role: 'teacher' };
      mockUserFindById.mockResolvedValue({});

      await getAllAttendance(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should handle server errors', async () => {
      req.user = { id: 'admin1', role: 'admin' };
      mockAttendanceFind.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockRejectedValue(new Error('DB Error')),
          }),
        }),
      });

      await getAllAttendance(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getMyAttendance', () => {
    it('should return attendance records for authenticated student', async () => {
      req.user = { id: 'student1' };
      const records = [{ status: 'Present', date: '2025-01-15' }];
      mockAttendanceFind.mockReturnValue({
        sort: jest.fn().mockResolvedValue(records),
      });

      await getMyAttendance(req, res);

      expect(res.json).toHaveBeenCalledWith(records);
    });

    it('should filter by date range when provided', async () => {
      req.user = { id: 'student1' };
      req.query = { startDate: '2025-01-01', endDate: '2025-01-31' };
      const records = [];
      mockAttendanceFind.mockReturnValue({
        sort: jest.fn().mockResolvedValue(records),
      });

      await getMyAttendance(req, res);

      expect(res.json).toHaveBeenCalledWith(records);
    });

    it('should handle server errors', async () => {
      req.user = { id: 'student1' };
      mockAttendanceFind.mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error('DB Error')),
      });

      await getMyAttendance(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
