import User from '../models/User.js';

/**
 * @desc    Get students assigned to the logged-in teacher's class(es)
 * @route   GET /api/teacher/my-students
 * @access  Teacher
 */
export const getMyStudents = async (req, res) => {
    const teacherId = req.user.id;
    const userRole = String(req.user.role || '').toLowerCase();

    try {
        if (userRole === 'admin') {
            // Admins can see all students
            const students = await User.find({ role: 'student' }).select('-password');
            return res.json(students);
        } else if (userRole === 'teacher') {
            // Teachers can only see students in their assigned classes
            const teacher = await User.findById(teacherId);
            if (!teacher || !teacher.assigned_class) return res.json([]); // No classes assigned, return empty array
            const classList = teacher.assigned_class.split(',').map(c => c.trim());
            const students = await User.find({ role: 'student', assigned_class: { $in: classList } }).select('-password');
            return res.json(students);
        } else {
            // Block other roles
            return res.status(403).json({ message: "Not authorized to view students via this endpoint" });
        }
    } catch (err) {
        console.error("Error fetching teacher's students:", err.message);
        res.status(500).json({ message: "Server Error fetching assigned students", error: err.message });
    }
};