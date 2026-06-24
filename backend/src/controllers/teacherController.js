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
        let query = {};
        
        if (userRole === 'admin') {
            // Admin can see all students
            query = { role: 'student' };
        } else if (userRole === 'teacher') {
            const teacher = await User.findById(teacherId);
            if (!teacher || !teacher.assigned_class) return res.json([]); // No classes assigned, return empty array
            const classList = teacher.assigned_class.split(',').map(c => c.trim());
            query = { role: 'student', assigned_class: { $in: classList } };
        } else {
            // This endpoint is intended for teachers. Admins can use /api/admin/users/role/student
            return res.status(403).json({ message: "Not authorized to view students via this endpoint" });
        }

        const students = await User.find(query).select('-password');
        res.json(students);
    } catch (err) {
        console.error("Error fetching teacher's students:", err.message);
        res.status(500).json({ message: "Server Error fetching assigned students", error: err.message });
    }
};