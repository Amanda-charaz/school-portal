import Transaction from '../models/Transaction.js';
import Fee from '../models/Fee.js';
import PDFDocument from 'pdfkit';
import mongoose from 'mongoose';

/**
 * @desc    Get transactions for the authenticated student
 * @route   GET /api/accounts/my-transactions
 * @access  Student
 */
export const getMyTransactions = async (req, res) => {
  try {
    // Ensure ID is treated as a valid ObjectId for the query
    const userId = mongoose.Types.ObjectId.isValid(req.user.id) 
      ? new mongoose.Types.ObjectId(req.user.id) 
      : req.user.id;

    const transactions = await Transaction.find({ user: userId })
      .sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching transactions', error: err.message });
  }
};

/**
 * @desc    Get all transactions for the financial overview
 * @route   GET /api/accounts/summary
 * @access  Admin
 */
export const getAccountsSummary = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('user', 'full_name school_id role')
      .sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: 'Server error while fetching accounts summary', error: err.message });
  }
};

/**
 * @desc    Generate a formal PDF receipt for a transaction
 * @route   GET /api/accounts/receipt/:id
 * @access  Admin or Student (owner)
 */
export const generateReceiptPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findById(id).populate('user', 'full_name school_id');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Security check: Only admins or the student who owns the transaction can download the receipt
    if (req.user.role !== 'admin' && String(transaction.user?._id || transaction.user) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to access this receipt' });
    }

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Receipt_${id.slice(-6)}.pdf`);

    doc.pipe(res);

    // Official Border
    doc.rect(20, 20, 552, 280).stroke();

    // Header
    doc.fontSize(20).text('OFFICIAL PAYMENT RECEIPT', { align: 'center', underline: true });
    doc.fontSize(10).text('ZIMBABWE SECONDARY SCHOOL ACCOUNTS OFFICE', { align: 'center' });
    doc.moveDown();

    // Metadata Row
    const top = 110;
    doc.fontSize(12).text(`Receipt No: ${transaction._id.toString().toUpperCase()}`, 50, top);
    doc.text(`Date: ${new Date(transaction.date).toLocaleDateString('en-GB')}`, 400, top);
    
    doc.moveDown(2);
    doc.text('--------------------------------------------------------------------------------', 50);
    doc.moveDown();

    // Main Content
    doc.text(`Received From: ${transaction.user?.full_name || 'General System'}`);
    doc.text(`Student/Staff ID: ${transaction.user?.school_id || 'N/A'}`);
    doc.text(`Payment For: ${transaction.category}`);
    doc.text(`Description: ${transaction.description || 'N/A'}`);
    doc.moveDown();
    doc.fontSize(16).text(`TOTAL PAID: $${transaction.amount.toLocaleString()}`, { underline: true });

    doc.fontSize(10).text('Authorized Signature: ________________________', 50, 270);
    doc.text('Official School Stamp', 400, 270);

    doc.end();
  } catch (err) {
    res.status(500).json({ message: 'Error generating receipt', error: err.message });
  }
};

/**
 * @desc    Log a new income (tuition) or school expense
 * @route   POST /api/accounts/transaction
 * @access  Admin
 */
export const addTransaction = async (req, res) => {
  const { user, amount, category, type, description } = req.body;

  if (!amount || !category || !type) {
    return res.status(400).json({ message: 'amount, category, and type are required.' });
  }

  try {
    // Normalize user ID: convert empty strings to null or ensure it's a valid ObjectId
    const targetUserId = user && mongoose.Types.ObjectId.isValid(user) 
      ? new mongoose.Types.ObjectId(user) 
      : null;

    const newTransaction = new Transaction({
      user: targetUserId,
      amount: Number(amount) || 0,
      category,
      type,
      description,
      date: new Date()
    });
    await newTransaction.save();

    // 🔄 Automatically apply Tuition payments to the student's Fee record
    if (type === 'Income' && category === 'Tuition' && targetUserId) {
      const fee = await Fee.findOne({ 
        student_id: targetUserId, 
        status: { $in: ['Pending', 'Partial'] } 
      }).sort({ createdAt: 1 }); // Apply to oldest fee first

      if (fee) {
        fee.paid_amount += Number(amount);
        fee.balance = Math.max(0, fee.total_amount - fee.paid_amount);
        
        // Update status based on remaining balance
        fee.status = fee.balance <= 0 ? 'Paid' : 'Partial';
        
        await fee.save();
      }
    }

    res.status(201).json(newTransaction);
  } catch (err) {
    res.status(400).json({ message: 'Error processing financial record', error: err.message });
  }
};

/**
 * @desc    Calculate the total outstanding tuition balance for all students
 * @route   GET /api/accounts/outstanding-balance
 * @access  Admin
 */
export const getOutstandingBalance = async (req, res) => {
  try {
    const result = await Fee.aggregate([
      {
        $group: { _id: null, totalOutstanding: { $sum: '$balance' } }
      }
    ]);
    const total = result.length > 0 ? result[0].totalOutstanding : 0;
    res.json({ totalOutstanding: total });
  } catch (err) {
    res.status(500).json({ message: 'Error calculating outstanding balance', error: err.message });
  }
};

/**
 * @desc    Delete a specific transaction
 * @route   DELETE /api/accounts/transaction/:id
 * @access  Admin
 */
export const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndDelete(req.params.id);
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });
    res.json({ message: "Transaction deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting transaction", error: err.message });
  }
};