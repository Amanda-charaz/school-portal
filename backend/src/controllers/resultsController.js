import Result from '../models/Result.js';
import User from '../models/User.js';
import {
  getUserRole,
  calculateGrade,
  parseSubjectsList,
  isTeacherAssignedToSubject,
  validateScore,
  createAuditLog,
  sendError,
} from '../utils/index.js';

export const addResult = async (req, res) => {
  try {
    const userRole = getUserRole(req);

    // Only teachers and admins can add results
    if (!['teacher', 'admin'].includes(userRole)) {
      return res.status(403).json({ message: "Only teachers and admins can submit results" });
    }

    const { student_id, subject, score, grade, term, year } = req.body;

    // Validate score range
    const scoreError = validateScore(score);
    if (scoreError) {
      return res.status(400).json({ message: scoreError });
    }
    const numericScore = Number(score);

    // Find the user in the database using their School ID
    const user = await User.findOne({ school_id: student_id });

    if (!user) {
        return res.status(404).json({ message: "Student not found with that ID" });
    }

    // Teachers can only submit results for subjects they are assigned to
    if (userRole === 'teacher') {
      const teacher = await User.findById(req.user.id);
      if (!isTeacherAssignedToSubject(teacher.assigned_subjects, subject)) {
        return res.status(403).json({ message: `Access denied. You are not assigned to teach ${subject || 'this subject'}.` });
      }
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
    await createAuditLog({
      actionType: 'RESULT_CREATED',
      performedBy: req.user.id,
      targetUser: user._id,
      details: { subject, score, grade: finalGrade, term: finalTerm, year: finalYear },
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
    const userRole = getUserRole(req);

    const result = await Result.findById(id);
    if (!result) return res.status(404).json({ message: "Result not found" });

    const oldScore = result.score;

    // Permission Check
    if (userRole === 'teacher') {
      const teacher = await User.findById(req.user.id);
      if (!isTeacherAssignedToSubject(teacher.assigned_subjects, result.subject)) {
        return res.status(403).json({ message: "You are not authorized to edit this subject's results." });
      }
    }

    // Validate score if provided
    if (score !== undefined) {
      const scoreError = validateScore(score);
      if (scoreError) {
        return res.status(400).json({ message: scoreError });
      }
      const numericScore = Number(score);
      result.score = numericScore;
      result.grade = calculateGrade(numericScore);
    }

    if (subject) result.subject = subject;
    if (term) result.term = String(term);
    if (year) result.year = Number(year);

    result.updatedAt = new Date();
    await result.save();

    // Create an audit log for the update
    await createAuditLog({
      actionType: 'RESULT_UPDATED',
      performedBy: req.user.id,
      targetUser: result.student,
      details: { 
        subject: result.subject, 
        oldScore, 
        newScore: result.score, 
        grade: result.grade 
      },
    });

    res.json({ message: "Result updated successfully", result });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getAllResults = async (req, res) => {
    try {
        const userRole = getUserRole(req);
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
        const userRole = getUserRole(req);

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
        const userRole = getUserRole(req);
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
            const classList = parseSubjectsList(teacher.assigned_class);
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
    const userRole = getUserRole(req);

    const result = await Result.findById(id).populate('student', 'full_name school_id');
    if (!result) return res.status(404).json({ message: "Result not found" });

    // Permission Check
    if (userRole === 'teacher') {
      const teacher = await User.findById(req.user.id);
      if (!isTeacherAssignedToSubject(teacher.assigned_subjects, result.subject)) {
        return res.status(403).json({ message: "You are not authorized to delete results for this subject." });
      }
    } else if (userRole !== 'admin') {
      return res.status(403).json({ message: "Access denied." });
    }

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
    await createAuditLog({
      actionType: 'RESULT_DELETED',
      performedBy: req.user.id,
      targetUser: result.student?._id,
      details: auditDetails,
    });

    res.json({ message: "Result deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting result", error: err.message });
  }
};