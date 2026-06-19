import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mockTransactionSave = jest.fn();
const mockTransactionFind = jest.fn();
const mockTransactionFindById = jest.fn();
const mockTransactionFindByIdAndDelete = jest.fn();

jest.unstable_mockModule('../src/models/Transaction.js', () => {
  const TransactionConstructor = jest.fn().mockImplementation(function (data) {
    Object.assign(this, data);
    this.save = mockTransactionSave;
  });
  TransactionConstructor.find = mockTransactionFind;
  TransactionConstructor.findById = mockTransactionFindById;
  TransactionConstructor.findByIdAndDelete = mockTransactionFindByIdAndDelete;
  return { default: TransactionConstructor };
});

const mockFeeAggregate = jest.fn();
const mockFeeFindOne = jest.fn();

jest.unstable_mockModule('../src/models/Fee.js', () => ({
  default: {
    aggregate: mockFeeAggregate,
    findOne: mockFeeFindOne,
  },
}));

jest.unstable_mockModule('mongoose', () => {
  function ObjectIdMock(id) { return id; }
  ObjectIdMock.isValid = jest.fn().mockImplementation((id) => id && id.length === 24);
  return {
    default: {
      Types: { ObjectId: ObjectIdMock },
    },
  };
});

jest.unstable_mockModule('pdfkit', () => ({
  default: jest.fn(),
}));

const {
  getMyTransactions,
  getAccountsSummary,
  addTransaction,
  getOutstandingBalance,
  deleteTransaction,
} = await import('../src/controllers/accountsController.js');

describe('accountsController', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      user: { id: 'admin1', role: 'admin' },
      body: {},
      params: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('getMyTransactions', () => {
    it('should return transactions for authenticated user', async () => {
      req.user = { id: 'student1' };
      const transactions = [{ amount: 500, category: 'Tuition' }];
      mockTransactionFind.mockReturnValue({
        sort: jest.fn().mockResolvedValue(transactions),
      });

      await getMyTransactions(req, res);

      expect(res.json).toHaveBeenCalledWith(transactions);
    });

    it('should handle errors', async () => {
      req.user = { id: 'student1' };
      mockTransactionFind.mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error('DB Error')),
      });

      await getMyTransactions(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getAccountsSummary', () => {
    it('should return all transactions with populated user info', async () => {
      const transactions = [{ amount: 500 }];
      mockTransactionFind.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(transactions),
        }),
      });

      await getAccountsSummary(req, res);

      expect(res.json).toHaveBeenCalledWith(transactions);
    });

    it('should handle errors', async () => {
      mockTransactionFind.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockRejectedValue(new Error('DB Error')),
        }),
      });

      await getAccountsSummary(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('addTransaction', () => {
    it('should create a new expense transaction', async () => {
      req.body = { amount: 500, category: 'Maintenance', type: 'Expense', description: 'Repairs' };
      mockTransactionSave.mockResolvedValue();

      await addTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should create income transaction and auto-apply tuition payment to fee', async () => {
      const userId = '507f1f77bcf86cd799439011'; // 24-char ObjectId
      req.body = { user: userId, amount: 500, category: 'Tuition', type: 'Income' };
      mockTransactionSave.mockResolvedValue();
      const mockFee = {
        paid_amount: 200,
        total_amount: 1000,
        balance: 800,
        status: 'Partial',
        save: jest.fn().mockResolvedValue(),
      };
      mockFeeFindOne.mockReturnValue({ sort: jest.fn().mockResolvedValue(mockFee) });

      await addTransaction(req, res);

      expect(mockFee.paid_amount).toBe(700);
      expect(mockFee.balance).toBe(300);
      expect(mockFee.status).toBe('Partial');
      expect(mockFee.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should mark fee as Paid when balance is fully covered', async () => {
      const userId = '507f1f77bcf86cd799439011';
      req.body = { user: userId, amount: 800, category: 'Tuition', type: 'Income' };
      mockTransactionSave.mockResolvedValue();
      const mockFee = {
        paid_amount: 200,
        total_amount: 1000,
        balance: 800,
        status: 'Partial',
        save: jest.fn().mockResolvedValue(),
      };
      mockFeeFindOne.mockReturnValue({ sort: jest.fn().mockResolvedValue(mockFee) });

      await addTransaction(req, res);

      expect(mockFee.paid_amount).toBe(1000);
      expect(mockFee.balance).toBe(0);
      expect(mockFee.status).toBe('Paid');
    });

    it('should not apply tuition payment if no outstanding fee exists', async () => {
      const userId = '507f1f77bcf86cd799439011';
      req.body = { user: userId, amount: 500, category: 'Tuition', type: 'Income' };
      mockTransactionSave.mockResolvedValue();
      mockFeeFindOne.mockReturnValue({ sort: jest.fn().mockResolvedValue(null) });

      await addTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should handle null user for general expenses', async () => {
      req.body = { user: '', amount: 200, category: 'Utilities', type: 'Expense' };
      mockTransactionSave.mockResolvedValue();

      await addTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should handle errors', async () => {
      req.body = { amount: 500, category: 'Other', type: 'Income' };
      mockTransactionSave.mockRejectedValue(new Error('DB Error'));

      await addTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getOutstandingBalance', () => {
    it('should return total outstanding balance', async () => {
      mockFeeAggregate.mockResolvedValue([{ _id: null, totalOutstanding: 15000 }]);

      await getOutstandingBalance(req, res);

      expect(res.json).toHaveBeenCalledWith({ totalOutstanding: 15000 });
    });

    it('should return 0 if no fees exist', async () => {
      mockFeeAggregate.mockResolvedValue([]);

      await getOutstandingBalance(req, res);

      expect(res.json).toHaveBeenCalledWith({ totalOutstanding: 0 });
    });

    it('should handle errors', async () => {
      mockFeeAggregate.mockRejectedValue(new Error('DB Error'));

      await getOutstandingBalance(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('deleteTransaction', () => {
    it('should delete a transaction', async () => {
      req.params = { id: 'tx1' };
      mockTransactionFindByIdAndDelete.mockResolvedValue({ _id: 'tx1' });

      await deleteTransaction(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'Transaction deleted successfully' });
    });

    it('should return 404 if transaction not found', async () => {
      req.params = { id: 'nonexistent' };
      mockTransactionFindByIdAndDelete.mockResolvedValue(null);

      await deleteTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle errors', async () => {
      req.params = { id: 'tx1' };
      mockTransactionFindByIdAndDelete.mockRejectedValue(new Error('DB Error'));

      await deleteTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
