import User from '../models/User.js';
import Result from '../models/Result.js';
import Attendance from '../models/Attendance.js';
import Fee from '../models/Fee.js';
import mongoose from 'mongoose';

const calculateGrade = (score) => {
    if (score >= 80) return "A";
    if (score >= 70) return "B";
    if (score >= 60) return "C";
    if (score >= 50) return "D";
    if (score >= 40) return "E";
    return "U";
};

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

export const getStudentDashboard = async (req, res) => {
    const studentId = mongoose.Types.ObjectId.isValid(req.user.id) 
      ? new mongoose.Types.ObjectId(req.user.id) 
      : req.user.id;

    try {
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

// Teachers can view their assigned students, admins can view all
export const getStudentsByTeacher = async (req, res) => {
    const teacherId = req.user.id;
    const userRole = String(req.user.role || req.user.role_id || "").toLowerCase();

    try {
        let query;

        if (userRole === 'admin' || userRole === 'teacher') {
            // Admins and Teachers now see all students for comprehensive selection and reporting
            query = User.find({ role: 'student' }).select('-password');
        } else {
            return res.status(403).json({ message: "Not authorized to view students" });
        }

        const students = await query;
        res.json(students);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error fetching assigned students", error: err.message });
    }
};
