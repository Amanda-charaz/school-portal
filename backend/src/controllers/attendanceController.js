import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import mongoose from 'mongoose';
import { startOfDay, subDays } from 'date-fns';
import PDFDocument from 'pdfkit';

/**
 * @desc    Mark bulk attendance for a specific date
 * @route   POST /api/attendance/add
 * @access  Teacher or Admin
 */
export const addAttendance = async (req, res) => {
  const { date, students, class_name } = req.body;

  if (!date || !students || !Array.isArray(students)) {
    return res.status(400).json({ message: "Date and student list are required." });
  }

  try {
    // Normalize date to YYYY-MM-DD (Midnight UTC) to avoid time-zone overlap issues
    const normalizedDate = new Date(date);
    normalizedDate.setUTCHours(0, 0, 0, 0);

    const ops = students.map(record => ({
      updateOne: {
        filter: { 
          student_id: mongoose.Types.ObjectId.isValid(record.student_id) ? new mongoose.Types.ObjectId(record.student_id) : record.student_id, 
          date: normalizedDate 
        },
        update: {
          status: record.status,
          marked_by: req.user.id,
          class_name
        },
        upsert: true
      }
    }));

    await Attendance.bulkWrite(ops);

    // 🛡️ Audit Logging: Record who marked attendance and for which class
    await AuditLog.create({
      actionType: 'ATTENDANCE_MARKED',
      performedBy: req.user.id,
      details: { 
        date: normalizedDate, 
        class_name: class_name || "General", 
        studentCount: students.length 
      }
    });

    res.status(200).json({ message: `Attendance for ${class_name || 'class'} recorded successfully.` });
  } catch (err) {
    res.status(500).json({ message: "Failed to record attendance" });
  }
};

/**
 * @desc    Get all attendance records (with optional filters)
 * @route   GET /api/attendance/all
 * @access  Admin
 */
export const getAllAttendance = async (req, res) => {
  try {
    const { date, class_name } = req.query;
    const userRole = String(req.user.role || "").toLowerCase();
    let filter = {};

    if (date) {
      const qDate = new Date(date);
      qDate.setUTCHours(0, 0, 0, 0);
      filter.date = qDate;
    }

    // 🛡️ Security: Teachers can only view attendance for their own assigned classes
    if (userRole === 'teacher') {
      const teacher = await User.findById(req.user.id);
      if (!teacher?.assigned_class) return res.json([]);
      const classList = teacher.assigned_class.split(',').map(c => c.trim());
      filter.class_name = { $in: classList };
    } else if (class_name) {
      filter.class_name = class_name;
    }

    const data = await Attendance.find(filter)
      .populate('student_id', 'full_name school_id role')
      .populate('marked_by', 'full_name')
      .sort({ date: -1 });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Error fetching attendance logs" });
  }
};

/**
 * @desc    Get own attendance history
 * @route   GET /api/attendance/my-attendance
 * @access  Student
 */
export const getMyAttendance = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { startDate, endDate } = req.query;
    let filter = { student_id: studentId };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        const start = startOfDay(new Date(startDate));
        filter.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(new Date(endDate).setUTCHours(23, 59, 59, 999));
        filter.date.$lte = end;
      }
    }

    const records = await Attendance.find(filter)
      .sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: "Error fetching your attendance history" });
  }
};

/**
 * @desc    Export student's attendance trend as a PDF report
 * @route   GET /api/attendance/export-report
 * @access  Student
 */
export const exportAttendancePDF = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query; // Get date range from query
    const student = await User.findById(userId);

    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    let matchFilter = { student_id: student._id };
    if (startDate || endDate) {
      matchFilter.date = {};
      if (startDate) {
        const start = startOfDay(new Date(startDate));
        matchFilter.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(new Date(endDate).setUTCHours(23, 59, 59, 999));
        matchFilter.date.$lte = end;
      }
    }

    // Fetch attendance trends grouped by month (last 12 months)
    const attendanceTrend = await Attendance.aggregate([
      { $match: matchFilter }, // Apply date range filter here
      {
        $group: {
          _id: {
            month: { $month: "$date" },
            year: { $year: "$date" }
          },
          present: { $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ["$status", "Absent"] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ["$status", "Late"] }, 1, 0] } }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 }
    ]);

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Attendance_Report_${student.school_id}.pdf`);

    doc.pipe(res);

    // PDF Header
    doc.fontSize(20).text('Attendance Performance Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Student Name: ${student.full_name}`);
    doc.text(`School ID: ${student.school_id}`);
    doc.text(`Class: ${student.assigned_class || 'Unassigned'}`);
    if (startDate || endDate) {
      doc.text(`Report Period: ${startDate || 'Start'} to ${endDate || 'End'}`);
    }
    doc.moveDown();
    doc.text('Monthly Attendance Trends:', { underline: true });
    doc.moveDown();

    attendanceTrend.reverse().forEach((item) => {
      const monthName = new Date(2000, item._id.month - 1).toLocaleString('default', { month: 'long' });
      doc.fontSize(12).text(`${monthName} ${item._id.year}:`);
      doc.fontSize(10).text(`  - Present: ${item.present} | Absent: ${item.absent} | Late: ${item.late}`);
      doc.moveDown(0.5);
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ message: "Error generating PDF report" });
  }
};

/**
 * @desc    Get attendance trends for a teacher's assigned classes over the last 30 days
 * @route   GET /api/attendance/teacher-trends
 * @access  Teacher or Admin
 */
export const getTeacherAttendanceTrends = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = String(req.user.role || "").toLowerCase();

    let studentIds = [];

    if (userRole === 'admin') {
      const allStudents = await User.find({ role: 'student' }).select('_id');
      studentIds = allStudents.map(s => s._id);
    } else {
      const teacher = await User.findById(userId);
      if (!teacher || !teacher.assigned_class) return res.json([]);
      const classList = teacher.assigned_class.split(',').map(c => c.trim());
      const students = await User.find({ role: 'student', assigned_class: { $in: classList } }).select('_id');
      studentIds = students.map(s => s._id);
    }

    if (studentIds.length === 0) {
      return res.json([]); // No students in assigned classes
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const thirtyDaysAgo = subDays(today, 30);

    const trends = await Attendance.aggregate([
      {
        $match: {
          student_id: { $in: studentIds },
          date: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            status: "$status"
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.date",
          present: { $sum: { $cond: [{ $eq: ["$_id.status", "Present"] }, "$count", 0] } },
          absent: { $sum: { $cond: [{ $eq: ["$_id.status", "Absent"] }, "$count", 0] } },
          late: { $sum: { $cond: [{ $eq: ["$_id.status", "Late"] }, "$count", 0] } }
        }
      },
      { $sort: { "_id": 1 } } // Sort by date ascending
    ]);

    res.json(trends);
  } catch (err) {
    res.status(500).json({ message: "Error fetching teacher attendance trends" });
  }
};

/**
 * @desc    Get summary for teacher's class (total students and today's attendance rate)
 * @route   GET /api/attendance/class-summary
 * @access  Teacher or Admin
 */
export const getClassSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = String(req.user.role || "").toLowerCase();

    let totalStudents = 0;
    let studentIds = [];

    if (userRole === 'admin') {
      totalStudents = await User.countDocuments({ role: 'student' });
      const students = await User.find({ role: 'student' }).select('_id');
      studentIds = students.map(s => s._id);
    } else {
      const teacher = await User.findById(userId);
      if (!teacher || !teacher.assigned_class) return res.json({ totalStudents: 0, attendanceRate: 0 });
      const classList = teacher.assigned_class.split(',').map(c => c.trim());
      totalStudents = await User.countDocuments({ role: 'student', assigned_class: { $in: classList } });
      const students = await User.find({ role: 'student', assigned_class: { $in: classList } }).select('_id');
      studentIds = students.map(s => s._id);
    }

    if (totalStudents === 0) {
      return res.json({ totalStudents: 0, attendanceRate: 0 });
    }

    const todayStart = startOfDay(new Date());
    const todayEnd = new Date(todayStart);
    todayEnd.setUTCHours(23, 59, 59, 999);

    const presentToday = await Attendance.countDocuments({
      student_id: { $in: studentIds },
      date: { $gte: todayStart, $lte: todayEnd },
      status: 'Present'
    });

    const attendanceRate = ((presentToday / totalStudents) * 100).toFixed(1);

    res.json({ totalStudents, attendanceRate });
  } catch (err) {
    res.status(500).json({ message: "Error fetching class summary" });
  }
};

/**
 * @desc    Export attendance records as CSV
 * @route   GET /api/attendance/export-csv
 * @access  Admin
 */
export const exportAttendanceCSV = async (req, res) => {
  try {
    const { date, class_name } = req.query;
    let filter = {};

    if (date) {
      const qDate = new Date(date);
      qDate.setUTCHours(0, 0, 0, 0);
      filter.date = qDate;
    }

    if (class_name) {
      filter.class_name = class_name;
    }

    const data = await Attendance.find(filter)
      .populate('student_id', 'full_name school_id')
      .populate('marked_by', 'full_name')
      .sort({ date: -1 });

    // CSV Headers
    let csv = '\uFEFFDate,Student Name,Student ID,Class,Status,Marked By\n'; // Added BOM for Excel UTF-8 support
    
    data.forEach(record => {
      const rowDate = record.date.toISOString().split('T')[0];
      
      // Helper to escape values for CSV
      const esc = (val) => `"${String(val || 'N/A').replace(/"/g, '""')}"`;

      const studentName = esc(record.student_id?.full_name);
      const studentID = esc(record.student_id?.school_id);
      const className = esc(record.class_name);
      const status = esc(record.status);
      const marker = esc(record.marked_by?.full_name || 'System');
      
      csv += `${rowDate},${studentName},${studentID},${className},${status},${marker}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.attachment(`Attendance_Export_${new Date().toISOString().split('T')[0]}.csv`);
    res.status(200).send(csv);
  } catch (err) {
    res.status(500).json({ message: "Error exporting CSV" });
  }
};