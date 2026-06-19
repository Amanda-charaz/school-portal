import Fee from '../models/Fee.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import PDFDocument from 'pdfkit';
import { toObjectId, findStudentBySchoolId } from '../utils/index.js';

/**
 * Records a new fee for a student.
 * Automatically calculates balance and payment status.
 */
export const addFee = async (req, res) => {
  try {
    const { student_id, total_amount, paid_amount, term, due_date } = req.body;

    // Find student by their automated school_id (e.g., S1)
    const student = await findStudentBySchoolId(student_id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    const paid = Number(paid_amount) || 0;
    const balance = Number(total_amount) - paid;
    
    let status = 'Pending';
    if (balance <= 0) status = 'Paid';
    else if (paid > 0 && balance > 0) status = 'Partial';

    const newFee = new Fee({
      student_id: student._id,
      total_amount,
      paid_amount: paid,
      balance,
      status,
      term,
      due_date,
      received_by: req.user.id // From authMiddleware
    });

    await newFee.save();
    res.status(201).json({ message: 'Fee record added successfully!', fee: newFee });
  } catch (error) {
    res.status(500).json({ message: 'Error adding fee record', error: error.message });
  }
};

/**
 * Generates a specific term-based invoice for a student.
 * Handles base fees, discounts, and fines as requested by the admin.
 */
export const generateInvoice = async (req, res) => {
  try {
    const { student_id, base_amount, discount, fines, term, year } = req.body;

    // Find student by their internal ID (sent from select menu) or School ID
    let student;
    if (mongoose.Types.ObjectId.isValid(student_id)) {
        student = await User.findById(student_id);
    } else {
        student = await User.findOne({ school_id: student_id, role: 'student' });
    }

    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    // 🛡️ Prevent duplicate invoices for the same student, term, and year
    const existingInvoice = await Fee.findOne({ student_id: student._id, term, year });
    if (existingInvoice) {
      return res.status(400).json({ message: `A fee invoice already exists for Term ${term}, ${year} for this student.` });
    }

    const base = Number(base_amount) || 0;
    const disc = Number(discount) || 0;
    const fine = Number(fines) || 0;
    const total = base + fine - disc;
    
    // Default due date: 30 days from invoice generation
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const newFee = new Fee({
      student_id: student._id,
      base_amount: base,
      discount: disc,
      fines: fine,
      total_amount: total,
      paid_amount: 0,
      balance: total,
      status: total <= 0 ? 'Paid' : 'Pending',
      term,
      year,
      due_date: dueDate,
      received_by: req.user.id
    });

    await newFee.save();
    res.status(201).json({ message: 'Fee invoice generated successfully!', fee: newFee });
  } catch (error) {
    res.status(500).json({ message: 'Error generating fee invoice', error: error.message });
  }
};

/**
 * Retrieves all fee records with populated student and staff names.
 */
export const getAllFees = async (req, res) => {
  try {
    const fees = await Fee.find()
      .populate('student_id', 'full_name school_id')
      .populate('received_by', 'full_name school_id');
    res.status(200).json(fees);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching fees', error: error.message });
  }
};

/**
 * Retrieves all fee records associated with a specific student ID.
 */
export const getStudentFees = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await findStudentBySchoolId(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    const fees = await Fee.find({ student_id: student._id })
      .populate('received_by', 'full_name');
      
    res.status(200).json(fees);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student fees', error: error.message });
  }
};

/**
 * Retrieves fee records for the authenticated student.
 */
export const getMyFees = async (req, res) => {
  try {
    // Normalize ID to ensure it matches the ObjectId stored in the database
    const studentId = toObjectId(req.user.id);

    const fees = await Fee.find({ student_id: studentId })
      .populate('received_by', 'full_name school_id')
      .sort({ createdAt: -1 });

    if (fees.length === 0) {
      return res.status(404).json({ message: 'No fee records found for your account.' });
    }

    res.status(200).json(fees);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching your fee records', error: error.message });
  }
};

/**
 * @desc    Generate a formal PDF invoice for a fee record
 * @route   GET /api/fees/invoice/:id
 * @access  Admin or Student (owner)
 */
export const generateInvoicePDF = async (req, res) => {
  try {
    const { id } = req.params;
    const fee = await Fee.findById(id).populate('student_id', 'full_name school_id');

    if (!fee) {
      return res.status(404).json({ message: 'Fee record not found' });
    }

    // Security check: Only admins or the student who owns the fee can download the invoice
    if (req.user.role !== 'admin' && String(fee.student_id._id) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to access this invoice' });
    }

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice_${id.slice(-6)}.pdf`);

    doc.pipe(res);

    // Official Border
    doc.rect(20, 20, 552, 350).stroke();

    // Header
    doc.fontSize(20).text('ACADEMIC FEE INVOICE', { align: 'center', underline: true });
    doc.fontSize(10).text('ZIMBABWE SECONDARY SCHOOL BURSAR OFFICE', { align: 'center' });
    doc.moveDown();

    // Metadata Row
    const top = 110;
    doc.fontSize(12).text(`Invoice No: ${fee._id.toString().toUpperCase()}`, 50, top);
    doc.text(`Date: ${new Date(fee.createdAt).toLocaleDateString('en-GB')}`, 400, top);
    
    doc.moveDown(2);
    doc.text('--------------------------------------------------------------------------------', 50);
    doc.moveDown();

    // Main Content
    doc.text(`Billed To: ${fee.student_id?.full_name || 'N/A'}`);
    doc.text(`Student ID: ${fee.student_id?.school_id || 'N/A'}`);
    doc.text(`Description: Term ${fee.term}, ${fee.year || new Date().getFullYear()} Tuition Fees`);
    doc.text(`Due Date: ${new Date(fee.due_date).toLocaleDateString('en-GB')}`);
    doc.moveDown();
    
    // Detailed Breakdown
    doc.fontSize(12).text(`Base Tuition: $${fee.base_amount?.toLocaleString() || '0'}`);
    doc.text(`Fines/Charges: +$${fee.fines?.toLocaleString() || '0'}`);
    doc.fillColor('green').text(`Discounts Applied: -$${fee.discount?.toLocaleString() || '0'}`);
    doc.moveDown(0.5);
    doc.fillColor('black').fontSize(14).text(`Total Amount: $${fee.total_amount.toLocaleString()}`);

    doc.fillColor('green').text(`Paid Amount: $${fee.paid_amount.toLocaleString()}`);
    doc.moveDown(0.5);
    doc.fontSize(16).fillColor(fee.balance > 0 ? 'red' : 'black').text(`BALANCE DUE: $${fee.balance.toLocaleString()}`, { underline: true });

    doc.fontSize(10).fillColor('black').text('Note: Please keep this invoice for your records.', 50, 340);
    doc.text('Authorized Official Stamp', 400, 340);

    doc.end();
  } catch (err) {
    res.status(500).json({ message: 'Error generating invoice', error: err.message });
  }
};