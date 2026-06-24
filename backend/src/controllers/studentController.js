import User from '../models/User.js';
import Result from '../models/Result.js';
import Attendance from '../models/Attendance.js';
import Fee from '../models/Fee.js';
import { calculateGrade } from '../utils/grades.js';
import mongoose from 'mongoose';

// Get student's own profile (read-only)
export const getStudentProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const student = await User.findById(userId).select('-password');
        if (!student) {
            return res.status(404).json({ message: "User profile not found" });
        }

        res.json({
            id: student._id,
            full_name: student.full_name,
            email: student.email,
            school_id: student.school_id,
            role: student.role,
            assigned_class: student.assigned_class,
            assigned_subjects: student.assigned_subjects || []
        });
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch profile", error: err.message });
    }
};

// Get teachers for the logged-in student's class
export const getStudentTeachers = async (req, res) => {
    try {
        const student = await User.findById(req.user.id);
        if (!student || !student.assigned_class) {
            return res.status(404).json({ message: "Student or assigned class not found." });
        }

        // Find teachers assigned to the same class as the student
        const teachers = await User.find({
            role: 'teacher',
            assigned_class: { $in: student.assigned_class.split(',').map(c => c.trim()) }
        }).select('full_name email assigned_subjects');

        res.json(teachers);

    } catch (err) {
        console.error("Error fetching student's teachers:", err.message);
        res.status(500).json({ message: "Server Error fetching teachers", error: err.message });
    }
};

export const getStudentDashboard = async (req, res) => {
    try {
        const studentId = mongoose.Types.ObjectId.isValid(req.user.id) 
          ? new mongoose.Types.ObjectId(req.user.id) 
          : req.user.id;
        const student = await User.findById(studentId);
        if (!student || student.role !== 'student') {
            return res.status(404).json({ message: "Student record not found" });
        }

        const results = await Result.find({ student: studentId })
            .sort({ year: -1, term: -1 })
            .limit(5);

        const attendance = await Attendance.aggregate([
            { $match: { student_id: studentId } },
            {
                $group: {
                    _id: null,
                    present_days: {
                        $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] }
                    },
                    absent_days: {
                        $sum: { $cond: [{ $eq: ["$status", "Absent"] }, 1, 0] }
                    },
                    late_days: {
                        $sum: { $cond: [{ $eq: ["$status", "Late"] }, 1, 0] }
                    }
                }
            }
        ]);

        const summary = attendance[0] || { present_days: 0, absent_days: 0, late_days: 0 };
        const totalDays = summary.present_days + summary.absent_days + summary.late_days;
        const attendanceRate = totalDays > 0 
            ? (((summary.present_days + summary.late_days) / totalDays) * 100).toFixed(1)
            : "0.0";

        // Fetch actual financial records instead of a hardcoded message
        const fees = await Fee.find({ student_id: studentId });
        const totalBalance = fees.reduce((sum, f) => sum + f.balance, 0);

        const attendanceTrend = await Attendance.aggregate([
            { $match: { student_id: studentId } },
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
            { $limit: 6 }
        ]);

        res.json({
            profile: {
                id: student._id,
                full_name: student.full_name,
                school_id: student.school_id,
                email: student.email,
                assigned_class: student.assigned_class
            },
            academic_summary: results.map(g => ({
                subject: g.subject,
                score: g.score,
                grade: g.grade,
                term: g.term,
                year: g.year,
                grade_letter: calculateGrade(g.score)
            })),
            attendance_stats: {
                summary: { ...summary, attendance_rate: attendanceRate },
                trends: attendanceTrend.reverse()
            },
            financial_status: { 
                total_balance: totalBalance,
                invoice_count: fees.length,
                status: totalBalance > 0 ? 'Outstanding' : 'Clear'
            }
        });

    } catch (err) {
        console.error("Dashboard Error:", err.message);
        res.status(500).json({ message: "Server Error loading dashboard", error: err.message });
    }
};

export const getMyResults = async (req, res) => {
    const userId = req.user.id;
    try {
        const results = await Result.find({ student: userId })
            .populate('student', 'full_name school_id')
            .sort({ year: -1, term: -1 });

        if (results.length === 0) {
            return res.status(404).json({ message: "No results found." });
        }

        const gradedResults = results.map(row => ({
            _id: row._id,
            student_name: row.student?.full_name || "Unknown Student",
            school_id: row.student?.school_id || "N/A",
            subject: row.subject,
            score: row.score,
            grade: row.grade,
            term: row.term,
            year: row.year,
            grade_letter: calculateGrade(row.score),
            is_pass: row.score >= 40,
            createdAt: row.createdAt
        }));

        res.json(gradedResults);
    } catch (err) {
        console.error("Results Error:", err.message);
        res.status(500).json({ message: "Server Error fetching results", error: err.message });
    }
};

export const getMyAttendance = async (req, res) => {
    try {
      const studentId = req.user.id;
      const { startDate, endDate } = req.query;
      let filter = { student_id: studentId };
  
      if (startDate || endDate) {
        filter.date = {};
        if (startDate) {
          const start = new Date(new Date(startDate).setUTCHours(0, 0, 0, 0));
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
      res.status(500).json({ message: "Error fetching your attendance history", error: err.message });
    }
  };

  // Get all distinct classes
  export const getAllClasses = async (req, res) => {
    try {
      const classes = await User.distinct('assigned_class', { 
        assigned_class: { $ne: null, $ne: '' } 
      });
      // Sort the classes alphabetically
      res.json(classes.sort());
    } catch (err) {
      res.status(500).json({ message: "Error fetching classes", error: err.message });
    }
  };
