import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock all Mongoose models and dependencies
const mockResultSave = jest.fn();
const mockResultFindById = jest.fn();
const mockResultFindOne = jest.fn();
const mockResultFind = jest.fn();
const mockResultFindByIdAndDelete = jest.fn();

jest.unstable_mockModule('../src/models/Result.js', () => {
  const ResultConstructor = jest.fn().mockImplementation(function (data) {
    Object.assign(this, data);
    this.save = mockResultSave;
  });
  ResultConstructor.findById = mockResultFindById;
  ResultConstructor.findOne = mockResultFindOne;
  ResultConstructor.find = mockResultFind;
  ResultConstructor.findByIdAndDelete = mockResultFindByIdAndDelete;
  return { default: ResultConstructor };
});

const mockUserFindById = jest.fn();
const mockUserFindOne = jest.fn();
const mockUserFind = jest.fn();

jest.unstable_mockModule('../src/models/User.js', () => ({
  default: {
    findById: mockUserFindById,
    findOne: mockUserFindOne,
    find: mockUserFind,
  },
}));

const mockAuditLogCreate = jest.fn();
jest.unstable_mockModule('../src/models/AuditLog.js', () => ({
  default: { create: mockAuditLogCreate },
}));

const {
  addResult,
  updateResult,
  deleteResult,
  getAllResults,
  getMyResults,
  getLeaderboard,
} = await import('../src/controllers/resultsController.js');

describe('resultsController', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      user: { id: 'user123', role: 'admin' },
      body: {},
      params: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('calculateGrade (via addResult)', () => {
    it('should auto-calculate grade A for score >= 80', async () => {
      req.body = { student_id: 'S1', subject: 'Math', score: 85, term: '1', year: 2025 };
      mockUserFindOne.mockResolvedValue({ _id: 'studentObjId', school_id: 'S1' });
      mockResultFindOne.mockResolvedValue(null);
      mockResultSave.mockResolvedValue();
      mockAuditLogCreate.mockResolvedValue();

      await addResult(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const savedData = res.json.mock.calls[0][0];
      expect(savedData.grade).toBe('A');
    });

    it('should auto-calculate grade B for score 70-79', async () => {
      req.body = { student_id: 'S1', subject: 'Math', score: 75, term: '1', year: 2025 };
      mockUserFindOne.mockResolvedValue({ _id: 'studentObjId', school_id: 'S1' });
      mockResultFindOne.mockResolvedValue(null);
      mockResultSave.mockResolvedValue();
      mockAuditLogCreate.mockResolvedValue();

      await addResult(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const savedData = res.json.mock.calls[0][0];
      expect(savedData.grade).toBe('B');
    });

    it('should auto-calculate grade U for score < 40', async () => {
      req.body = { student_id: 'S1', subject: 'Math', score: 30, term: '1', year: 2025 };
      mockUserFindOne.mockResolvedValue({ _id: 'studentObjId', school_id: 'S1' });
      mockResultFindOne.mockResolvedValue(null);
      mockResultSave.mockResolvedValue();
      mockAuditLogCreate.mockResolvedValue();

      await addResult(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const savedData = res.json.mock.calls[0][0];
      expect(savedData.grade).toBe('U');
    });
  });

  describe('addResult', () => {
    it('should return 403 if user is not teacher or admin', async () => {
      req.user = { id: 'user1', role: 'student' };
      req.body = { student_id: 'S1', subject: 'Math', score: 85, term: '1', year: 2025 };

      await addResult(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Only teachers and admins can submit results' });
    });

    it('should return 400 for invalid score', async () => {
      req.body = { student_id: 'S1', subject: 'Math', score: 150, term: '1', year: 2025 };

      await addResult(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid score. Must be between 0 and 100.' });
    });

    it('should return 400 for negative score', async () => {
      req.body = { student_id: 'S1', subject: 'Math', score: -5, term: '1', year: 2025 };

      await addResult(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for NaN score', async () => {
      req.body = { student_id: 'S1', subject: 'Math', score: 'abc', term: '1', year: 2025 };

      await addResult(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if student not found', async () => {
      req.body = { student_id: 'S999', subject: 'Math', score: 85, term: '1', year: 2025 };
      mockUserFindOne.mockResolvedValue(null);

      await addResult(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Student not found with that ID' });
    });

    it('should return 400 if duplicate result exists', async () => {
      req.body = { student_id: 'S1', subject: 'Math', score: 85, term: '1', year: 2025 };
      mockUserFindOne.mockResolvedValue({ _id: 'studentObjId', school_id: 'S1' });
      mockResultFindOne.mockResolvedValue({ _id: 'existingResult' });

      await addResult(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should use provided grade instead of auto-calculating', async () => {
      req.body = { student_id: 'S1', subject: 'Math', score: 85, grade: 'B', term: '1', year: 2025 };
      mockUserFindOne.mockResolvedValue({ _id: 'studentObjId', school_id: 'S1' });
      mockResultFindOne.mockResolvedValue(null);
      mockResultSave.mockResolvedValue();
      mockAuditLogCreate.mockResolvedValue();

      await addResult(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const savedData = res.json.mock.calls[0][0];
      expect(savedData.grade).toBe('B');
    });

    it('should restrict teachers to their assigned subjects', async () => {
      req.user = { id: 'teacher1', role: 'teacher' };
      req.body = { student_id: 'S1', subject: 'History', score: 85, term: '1', year: 2025 };
      mockUserFindOne.mockResolvedValue({ _id: 'studentObjId', school_id: 'S1' });
      mockUserFindById.mockResolvedValue({ assigned_subjects: ['Math', 'Science'] });

      await addResult(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should allow teacher if subject is assigned (case-insensitive)', async () => {
      req.user = { id: 'teacher1', role: 'teacher' };
      req.body = { student_id: 'S1', subject: 'math', score: 85, term: '1', year: 2025 };
      mockUserFindOne.mockResolvedValue({ _id: 'studentObjId', school_id: 'S1' });
      mockUserFindById.mockResolvedValue({ assigned_subjects: ['Math', 'Science'] });
      mockResultFindOne.mockResolvedValue(null);
      mockResultSave.mockResolvedValue();
      mockAuditLogCreate.mockResolvedValue();

      await addResult(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('updateResult', () => {
    it('should return 404 if result not found', async () => {
      req.params = { id: 'result123' };
      mockResultFindById.mockResolvedValue(null);

      await updateResult(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 for invalid score on update', async () => {
      req.params = { id: 'result123' };
      req.body = { score: 150 };
      const mockResult = { _id: 'result123', score: 70, subject: 'Math', save: jest.fn() };
      mockResultFindById.mockResolvedValue(mockResult);

      await updateResult(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should update score and recalculate grade', async () => {
      req.params = { id: 'result123' };
      req.body = { score: 90 };
      const mockResult = {
        _id: 'result123',
        score: 70,
        grade: 'B',
        subject: 'Math',
        student: 'student1',
        save: jest.fn().mockResolvedValue(),
      };
      mockResultFindById.mockResolvedValue(mockResult);
      mockAuditLogCreate.mockResolvedValue();

      await updateResult(req, res);

      expect(mockResult.score).toBe(90);
      expect(mockResult.grade).toBe('A');
      expect(mockResult.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });

    it('should restrict teachers to their assigned subjects on update', async () => {
      req.user = { id: 'teacher1', role: 'teacher' };
      req.params = { id: 'result123' };
      req.body = { score: 90 };
      const mockResult = { _id: 'result123', score: 70, subject: 'History', save: jest.fn() };
      mockResultFindById.mockResolvedValue(mockResult);
      mockUserFindById.mockResolvedValue({ assigned_subjects: ['Math'] });

      await updateResult(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('getAllResults', () => {
    it('should return all results for admin', async () => {
      const results = [{ subject: 'Math', score: 85 }];
      mockResultFind.mockReturnValue({ populate: jest.fn().mockResolvedValue(results) });

      await getAllResults(req, res);

      expect(res.json).toHaveBeenCalledWith(results);
    });

    it('should handle server errors gracefully', async () => {
      mockResultFind.mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error('DB Error')),
      });

      await getAllResults(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getMyResults', () => {
    it('should return results for student', async () => {
      req.user = { id: 'student1', role: 'student' };
      const results = [{ subject: 'Math', score: 85 }];
      mockResultFind.mockReturnValue({ sort: jest.fn().mockResolvedValue(results) });

      await getMyResults(req, res);

      expect(res.json).toHaveBeenCalledWith(results);
    });

    it('should return 404 if no results found for student', async () => {
      req.user = { id: 'student1', role: 'student' };
      mockResultFind.mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });

      await getMyResults(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 403 for non-student users', async () => {
      req.user = { id: 'teacher1', role: 'teacher' };

      await getMyResults(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('getLeaderboard', () => {
    it('should return top 10 results for admin', async () => {
      const topResults = [{ subject: 'Math', score: 99 }];
      mockResultFind.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(topResults),
          }),
        }),
      });

      await getLeaderboard(req, res);

      expect(res.json).toHaveBeenCalledWith(topResults);
    });

    it('should filter by class for student', async () => {
      req.user = { id: 'student1', role: 'student' };
      mockUserFindById.mockResolvedValue({ assigned_class: 'Grade 10-A' });
      mockUserFind.mockResolvedValue([{ _id: 's1' }, { _id: 's2' }]);
      const topResults = [];
      mockResultFind.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(topResults),
          }),
        }),
      });

      await getLeaderboard(req, res);

      expect(res.json).toHaveBeenCalledWith(topResults);
    });
  });

  describe('deleteResult', () => {
    it('should return 404 if result not found', async () => {
      req.params = { id: 'result123' };
      mockResultFindById.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });

      await deleteResult(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should delete result for admin', async () => {
      req.params = { id: 'result123' };
      const mockResult = {
        _id: 'result123',
        subject: 'Math',
        score: 85,
        grade: 'A',
        term: '1',
        year: 2025,
        student: { _id: 'student1', full_name: 'John', school_id: 'S1' },
      };
      mockResultFindById.mockReturnValue({ populate: jest.fn().mockResolvedValue(mockResult) });
      mockResultFindByIdAndDelete.mockResolvedValue(mockResult);
      mockAuditLogCreate.mockResolvedValue();

      await deleteResult(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'Result deleted successfully' });
    });

    it('should return 403 for teacher deleting unassigned subject', async () => {
      req.user = { id: 'teacher1', role: 'teacher' };
      req.params = { id: 'result123' };
      const mockResult = {
        _id: 'result123',
        subject: 'History',
        student: { _id: 'student1' },
      };
      mockResultFindById.mockReturnValue({ populate: jest.fn().mockResolvedValue(mockResult) });
      mockUserFindById.mockResolvedValue({ assigned_subjects: ['Math'] });

      await deleteResult(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should return 403 for non-admin/non-teacher', async () => {
      req.user = { id: 'student1', role: 'student' };
      req.params = { id: 'result123' };
      const mockResult = {
        _id: 'result123',
        subject: 'Math',
        student: { _id: 'student1' },
      };
      mockResultFindById.mockReturnValue({ populate: jest.fn().mockResolvedValue(mockResult) });

      await deleteResult(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
