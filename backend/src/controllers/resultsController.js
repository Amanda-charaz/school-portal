import Result from '../models/Result.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { calculateGrade } from '../utils/grades.js';
import { isTeacherAssignedToSubject } from '../utils/permissions.js';

export const addResult = async (req, res) => {
  try {
    const { student_id, subject, score, grade, term, year } = req.body;

    // Validate required fields
    if (!student_id || !subject || !score || !term) {
      return res.status(400).json({ message: "student_id, subject, score, and term are required." });
    }

    // Validate score range
    const numericScore = Number(score);
    if (isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
      return res.status(400).json({ message: "Invalid score. Must be between 0 and 100." });
    }

    // Find the user in the database using their School ID
    const user = await User.findOne({ school_id: student_id });

    if (!user) {
        return res.status(404).json({ message: "Student not found with that ID" });
    }

    const finalYear = Number(year) || new Date().getFullYear();
    const finalTerm = String(term);

    // 🛡️ Prevent duplicate grade entries for the same subject, term, and year
    const existingResult = await Result.findOne({
      student: user._id,
      subject: subject,
      term: finalTerm,
      year: finalYear
    });

    if (existingResult) {
      return res.status(400).json({ message: `A result already exists for ${subject} (Term ${finalTerm}, ${finalYear}) for this student.` });
    }

    // Auto-calculate grade if not provided
    const finalGrade = grade || calculateGrade(score);

    const newResult = new Result({
      student: user._id,
      subject,
      score,
      grade: finalGrade,
      term: finalTerm,
      year: finalYear,
      recordedBy: req.user.id
    });

    await newResult.save();

    // Create an audit log for the new result
    await AuditLog.create({
      actionType: 'RESULT_CREATED',
      performedBy: req.user.id,
      targetUser: user._id,
      details: { subject, score, grade: finalGrade, term: finalTerm, year: finalYear },
      timestamp: new Date()
    });

    res.status(201).json(newResult);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * @desc    Update an existing result
 * @route   PUT /api/result/:id
 * @access  Teacher or Admin
 */
export const updateResult = async (req, res) => {
  try {
    const { id } = req.params;
    const { score, subject, term, year } = req.body;

    const result = await Result.findById(id);
    if (!result) return res.status(404).json({ message: "Result not found" });

    const oldScore = result.score;

    // Validate score if provided
    if (score !== undefined) {
      const numericScore = Number(score);
      if (isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
        return res.status(400).json({ message: "Invalid score. Must be between 0 and 100." });
      }
      result.score = numericScore;
      result.grade = calculateGrade(numericScore);
    }

    if (subject) result.subject = subject;
    if (term) result.term = String(term);
    if (year) result.year = Number(year);

    result.updatedAt = new Date();
    await result.save();

    // Create an audit log for the update
    await AuditLog.create({
      actionType: 'RESULT_UPDATED',
      performedBy: req.user.id,
      targetUser: result.student,
      details: { 
        subject: result.subject, 
        oldScore, 
        newScore: result.score, 
        grade: result.grade 
      },
      timestamp: new Date()
    });

    res.json({ message: "Result updated successfully", result });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getAllResults = async (req, res) => {
    try {
        const userRole = String(req.user.role || req.user.role_id || "").toLowerCase();
        let query = {};
        // Teachers and Admins can now see all institutional results

        const results = await Result.find(query).populate('student', 'full_name school_id assigned_class');
        res.json(results);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch results", error: err.message });
    }
};

export const getMyResults = async (req, res) => {
    try {
        const userRole = String(req.user.role || req.user.role_id || "").toLowerCase();

        // Only students can use this endpoint to view their own results
        if (userRole === 'student') {
          const results = await Result.find({ student: req.user.id }).sort({ year: -1, term: -1 });

          if (!results || results.length === 0) {
              return res.status(404).json({ message: "No results found for this student." });
          }

          return res.json(results);
        }

        // Teachers and admins can't use this endpoint
        return res.status(403).json({ message: "This endpoint is for students only" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error fetching your results", error: err.message });
    }
};

export const getLeaderboard = async (req, res) => {
    try {
        const userRole = String(req.user.role || req.user.role_id || "").toLowerCase();
        let query = {};

        // Students only see leaderboard for their class
        if (userRole === 'student') {
          const student = await User.findById(req.user.id);
          if (student?.assigned_class) {
            const classStudents = await User.find({ role: 'student', assigned_class: student.assigned_class });
            const studentIds = classStudents.map(s => s._id.toString());
            query = { student: { $in: studentIds } };
          }
        }
        // Teachers see leaderboard for their class
        else if (userRole === 'teacher') {
          const teacher = await User.findById(req.user.id);
          if (teacher?.assigned_class) {
            const classList = teacher.assigned_class.split(',').filter(Boolean).map(c => c.trim());
            const classStudents = await User.find({ role: 'student', assigned_class: { $in: classList } });
            const studentIds = classStudents.map(s => s._id.toString());
            query = { student: { $in: studentIds } };
          }
        }
        // Admins see all results

        const topResults = await Result.find(query)
            .populate('student', 'full_name school_id assigned_class')
            .sort({ score: -1 })
            .limit(10);
        res.json(topResults);
    } catch (err) {
        res.status(500).json({ message: "Error fetching leaderboard", error: err.message });
    }
};

/**
 * @desc    Delete a specific result
 * @route   DELETE /api/result/:id
 * @access  Teacher or Admin
 */
export const deleteResult = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await Result.findById(id).populate('student', 'full_name school_id');
    if (!result) return res.status(404).json({ message: "Result not found" });

    // Prepare audit details before deletion to record the state of the grade being removed
    const auditDetails = {
      resultId: result._id,
      subject: result.subject,
      score: result.score,
      grade: result.grade,
      term: result.term,
      year: result.year,
      studentName: result.student?.full_name,
      studentSchoolId: result.student?.school_id
    };

    await Result.findByIdAndDelete(id);

    // Create an audit log entry for the deletion
    await AuditLog.create({
      actionType: 'RESULT_DELETED',
      performedBy: req.user.id,
      targetUser: result.student?._id,
      details: auditDetails,
      timestamp: new Date()
    });

    res.json({ message: "Result deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting result", error: err.message });
  }
};