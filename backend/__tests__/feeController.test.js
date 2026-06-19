import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mockFeeSave = jest.fn();
const mockFeeFind = jest.fn();
const mockFeeFindById = jest.fn();
const mockFeeFindOne = jest.fn();

jest.unstable_mockModule('../src/models/Fee.js', () => {
  const FeeConstructor = jest.fn().mockImplementation(function (data) {
    Object.assign(this, data);
    this.save = mockFeeSave;
  });
  FeeConstructor.find = mockFeeFind;
  FeeConstructor.findById = mockFeeFindById;
  FeeConstructor.findOne = mockFeeFindOne;
  return { default: FeeConstructor };
});

const mockUserFindOne = jest.fn();
const mockUserFindById = jest.fn();

jest.unstable_mockModule('../src/models/User.js', () => ({
  default: {
    findOne: mockUserFindOne,
    findById: mockUserFindById,
  },
}));

jest.unstable_mockModule('mongoose', () => ({
  default: {
    Types: {
      ObjectId: {
        isValid: jest.fn().mockReturnValue(false),
      },
    },
  },
}));

jest.unstable_mockModule('pdfkit', () => ({
  default: jest.fn(),
}));

const { addFee, generateInvoice, getAllFees, getStudentFees, getMyFees } =
  await import('../src/controllers/feeController.js');

describe('feeController', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      user: { id: 'admin1', role: 'admin' },
      body: {},
      params: {},
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('addFee', () => {
    it('should return 404 if student not found', async () => {
      req.body = { student_id: 'S999', total_amount: 1000, paid_amount: 0, term: '1' };
      mockUserFindOne.mockResolvedValue(null);

      await addFee(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Student not found.' });
    });

    it('should create fee with Pending status when nothing paid', async () => {
      req.body = { student_id: 'S1', total_amount: 1000, paid_amount: 0, term: '1' };
      mockUserFindOne.mockResolvedValue({ _id: 'studentObjId', school_id: 'S1', role: 'student' });
      mockFeeSave.mockResolvedValue();

      await addFee(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const response = res.json.mock.calls[0][0];
      expect(response.fee.status).toBe('Pending');
      expect(response.fee.balance).toBe(1000);
    });

    it('should create fee with Partial status when partially paid', async () => {
      req.body = { student_id: 'S1', total_amount: 1000, paid_amount: 500, term: '1' };
      mockUserFindOne.mockResolvedValue({ _id: 'studentObjId', school_id: 'S1', role: 'student' });
      mockFeeSave.mockResolvedValue();

      await addFee(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const response = res.json.mock.calls[0][0];
      expect(response.fee.status).toBe('Partial');
      expect(response.fee.balance).toBe(500);
    });

    it('should create fee with Paid status when fully paid', async () => {
      req.body = { student_id: 'S1', total_amount: 1000, paid_amount: 1000, term: '1' };
      mockUserFindOne.mockResolvedValue({ _id: 'studentObjId', school_id: 'S1', role: 'student' });
      mockFeeSave.mockResolvedValue();

      await addFee(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const response = res.json.mock.calls[0][0];
      expect(response.fee.status).toBe('Paid');
      expect(response.fee.balance).toBe(0);
    });

    it('should handle missing paid_amount as 0', async () => {
      req.body = { student_id: 'S1', total_amount: 500, term: '1' };
      mockUserFindOne.mockResolvedValue({ _id: 'studentObjId', school_id: 'S1', role: 'student' });
      mockFeeSave.mockResolvedValue();

      await addFee(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const response = res.json.mock.calls[0][0];
      expect(response.fee.paid_amount).toBe(0);
      expect(response.fee.balance).toBe(500);
    });

    it('should handle server errors', async () => {
      req.body = { student_id: 'S1', total_amount: 1000, term: '1' };
      mockUserFindOne.mockRejectedValue(new Error('DB Error'));

      await addFee(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('generateInvoice', () => {
    it('should return 404 if student not found', async () => {
      req.body = { student_id: 'S999', base_amount: 1000, term: '1', year: 2025 };
      mockUserFindOne.mockResolvedValue(null);

      await generateInvoice(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 if duplicate invoice exists', async () => {
      req.body = { student_id: 'S1', base_amount: 1000, term: '1', year: 2025 };
      mockUserFindOne.mockResolvedValue({ _id: 'studentObjId', school_id: 'S1' });
      mockFeeFindOne.mockResolvedValue({ _id: 'existingFee' });

      await generateInvoice(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should calculate total correctly with discount and fines', async () => {
      req.body = { student_id: 'S1', base_amount: 1000, discount: 100, fines: 50, term: '1', year: 2025 };
      mockUserFindOne.mockResolvedValue({ _id: 'studentObjId', school_id: 'S1' });
      mockFeeFindOne.mockResolvedValue(null);
      mockFeeSave.mockResolvedValue();

      await generateInvoice(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const response = res.json.mock.calls[0][0];
      // total = base + fines - discount = 1000 + 50 - 100 = 950
      expect(response.fee.total_amount).toBe(950);
      expect(response.fee.balance).toBe(950);
      expect(response.fee.status).toBe('Pending');
    });

    it('should default discount and fines to 0', async () => {
      req.body = { student_id: 'S1', base_amount: 500, term: '1', year: 2025 };
      mockUserFindOne.mockResolvedValue({ _id: 'studentObjId', school_id: 'S1' });
      mockFeeFindOne.mockResolvedValue(null);
      mockFeeSave.mockResolvedValue();

      await generateInvoice(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const response = res.json.mock.calls[0][0];
      expect(response.fee.total_amount).toBe(500);
    });

    it('should mark as Paid if total is zero or negative', async () => {
      req.body = { student_id: 'S1', base_amount: 100, discount: 200, fines: 0, term: '1', year: 2025 };
      mockUserFindOne.mockResolvedValue({ _id: 'studentObjId', school_id: 'S1' });
      mockFeeFindOne.mockResolvedValue(null);
      mockFeeSave.mockResolvedValue();

      await generateInvoice(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const response = res.json.mock.calls[0][0];
      expect(response.fee.status).toBe('Paid');
    });
  });

  describe('getAllFees', () => {
    it('should return all fees with populated fields', async () => {
      const fees = [{ total_amount: 1000 }];
      mockFeeFind.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(fees),
        }),
      });

      await getAllFees(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(fees);
    });

    it('should handle errors', async () => {
      mockFeeFind.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockRejectedValue(new Error('DB Error')),
        }),
      });

      await getAllFees(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getStudentFees', () => {
    it('should return 404 if student not found', async () => {
      req.params = { studentId: 'S999' };
      mockUserFindOne.mockResolvedValue(null);

      await getStudentFees(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return fees for a given student', async () => {
      req.params = { studentId: 'S1' };
      const fees = [{ total_amount: 1000 }];
      mockUserFindOne.mockResolvedValue({ _id: 'studentObjId', school_id: 'S1', role: 'student' });
      mockFeeFind.mockReturnValue({
        populate: jest.fn().mockResolvedValue(fees),
      });

      await getStudentFees(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(fees);
    });
  });

  describe('getMyFees', () => {
    it('should return 404 if no fee records found', async () => {
      req.user = { id: 'student1' };
      mockFeeFind.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([]),
        }),
      });

      await getMyFees(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return fee records for authenticated student', async () => {
      req.user = { id: 'student1' };
      const fees = [{ total_amount: 1000, balance: 500 }];
      mockFeeFind.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(fees),
        }),
      });

      await getMyFees(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(fees);
    });
  });
});
