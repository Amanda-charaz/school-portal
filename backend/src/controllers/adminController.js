import User from '../models/User.js';
import Student from '../models/Student.js';
import Class from '../models/Class.js';
import AuditLog from '../models/AuditLog.js';
import { validatePasswordComplexity } from '../utils/index.js';

// Get all audit logs
export const getAuditLogs = async (req, res) => {
  try {
    const { actionType } = req.query;
    const query = actionType ? { actionType } : {};

    const logs = await AuditLog.find(query)
      .populate('performedBy', 'full_name school_id')
      .populate('targetUser', 'full_name school_id')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(logs);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Error fetching audit logs", error: err.message });
  }
};

// Get system-wide audit logs (Class creations, promotions, user management)
export const getSystemLogs = async (req, res) => {
  try {
    const { actionType } = req.query;
    const query = actionType ? { actionType } : {};

    const logs = await AuditLog.find(query)
      .populate('performedBy', 'full_name school_id')
      .populate('targetUser', 'full_name school_id')
      .sort({ timestamp: -1 })
      .limit(100);

    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: "Error fetching system logs", error: err.message });
  }
};

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password -raw_password_view') // Keep hashed keys secure
      .sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users", error: err.message });
  }
};

// Get a single user by ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user", error: err.message });
  }
};

// Create new user (admin only)
export const createUser = async (req, res) => {
  try {
    const { full_name, role, assigned_subjects, assigned_class } = req.body;

    // Validate required fields
    if (!full_name || !role) {
      return res.status(400).json({ message: "Full name and role are required." });
    }

    // 1. Determine prefix and count existing users for sequential ID
    const prefix = role === 'student' ? 'S' : role === 'teacher' ? 'T' : 'A';
    const count = await User.countDocuments({ role });
    const nextIdNumber = count + 1;

    // 2. Auto-generate school_id and shorthand email
    const school_id = `${prefix}${nextIdNumber}`;
    const email = `${school_id.toLowerCase()}@s.com`;
    // SECURITY: Generate a more secure, random default password for each user.
    // This is a simple implementation. For higher security, consider a more robust
    // random string generator.
    const defaultPassword = `sch_${Math.random().toString(36).slice(-8)}`;

    // Validate default password complexity
    const complexityError = validatePasswordComplexity(defaultPassword);
    if (complexityError) {
      return res.status(400).json({
        message: `Cannot create user: default password does not meet complexity requirements. ${complexityError}`
      });
    }

    // Ensure assigned_subjects is handled as an array
    let subjectsArray = [];
    if (assigned_subjects) {
      subjectsArray = Array.isArray(assigned_subjects) 
        ? assigned_subjects 
        : assigned_subjects.split(',').map(s => s.trim()).filter(Boolean);
    }

    // 3. Teachers are assigned to subjects, not classes
    // Note: Students link to classes via the Student profile model, not the User model.

    const newUser = new User({
      full_name,
      email,
      password: defaultPassword,
      role,
      school_id,
      assigned_class: assigned_class || null,
      assigned_subjects: role === 'teacher' ? subjectsArray : [],
      mustResetPassword: true
    });

    const savedUser = await newUser.save();

    res.status(201).json({ message: "User created successfully", user: savedUser });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update user (admin only)
export const updateUser = async (req, res) => {
  try {
    const { full_name, email, role, school_id, assigned_subjects, assigned_class } = req.body;
    const userId = req.params.id;

    // Check if user exists first
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prepare update data
    const updateData = {};
    if (full_name) updateData.full_name = full_name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (school_id) updateData.school_id = school_id;
    if (assigned_class !== undefined) updateData.assigned_class = assigned_class;
    if (assigned_subjects !== undefined) {
      updateData.assigned_subjects = Array.isArray(assigned_subjects) 
        ? assigned_subjects 
        : assigned_subjects.split(',').map(s => s.trim()).filter(Boolean);
    }

    // Handle Student profile sync if needed
    if (assigned_class !== undefined && existingUser.role === 'student') {
      await Student.updateOne({ user: userId }, { current_class: assigned_class || "Unassigned" });
    }

    // Find and update user, returning the updated document
    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      updateData, 
      { new: true, runValidators: true }
    ).select('-password -raw_password_view');

    res.json({ message: "User updated successfully", user: updatedUser });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete user (admin only)
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If the user is a student, also delete their associated Student profile record.
    if (user.role === 'student') {
      await Student.deleteOne({ user: user._id });
    }

    // 2. Remove the core User account
    await User.findByIdAndDelete(req.params.id);

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Reset user password (admin only)
export const resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }

    // Validate new password complexity
    const complexityError = validatePasswordComplexity(newPassword);
    if (complexityError) {
      return res.status(400).json({ message: complexityError });
    }

    user.password = newPassword; // Rely on pre-save hook for hashing
    user.mustResetPassword = true;

    await user.save();
    res.json({ message: "Password reset successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get users by role
export const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const users = await User.find({ role: role.toLowerCase() }) // Query MongoDB using the string enum role values
      .select('-password -raw_password_view') // Keep hashed keys secure
      .sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: "Error filtering user records", error: err.message });
  }
};

// Deactivate user (admin only)
export const deactivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.active = false;
    await user.save();

    res.json({ message: "User deactivated successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Class Management
export const createClass = async (req, res) => {
  try {
    const { name, description, formTeacher } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Class name is required." });
    }

    if (formTeacher) {
      const teacher = await User.findById(formTeacher);
      if (!teacher || teacher.role !== 'teacher') {
        return res.status(400).json({ message: "Form teacher must be a valid user with the 'teacher' role." });
      }

      const alreadyAssigned = await Class.findOne({ formTeacher });
      if (alreadyAssigned) {
        return res.status(400).json({ message: "This teacher is already assigned as a form teacher to another class." });
      }
    }

    const newClass = await Class.create({ name, description, formTeacher });

    await AuditLog.create({
      actionType: 'CLASS_CREATED',
      performedBy: req.user.id,
      details: { classId: newClass._id, className: newClass.name, description: newClass.description, formTeacher: newClass.formTeacher },
      timestamp: new Date()
    });

    // 🔄 Sync the teacher's assigned_class property
    if (formTeacher) {
      await User.findByIdAndUpdate(formTeacher, { assigned_class: newClass.name });
    }

    res.status(201).json({ message: "Class created successfully", class: newClass });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find()
      .populate('formTeacher', 'full_name school_id') // Populate formTeacher's name and ID
      .sort({ name: 1 });
    res.json(classes);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch classes", error: err.message });
  }
};

export const updateClass = async (req, res) => {
  try {
    const { name, description, formTeacher } = req.body;

    // Fetch the existing class to compare formTeacher before update
    const existingClass = await Class.findById(req.params.id);
    if (!existingClass) return res.status(404).json({ message: "Class not found" });

    if (formTeacher) {
      const teacher = await User.findById(formTeacher);
      if (!teacher || teacher.role !== 'teacher') {
        return res.status(400).json({ message: "Form teacher must be a valid user with the 'teacher' role." });
      }

      // Ensure the teacher is not already assigned to another class (excluding the current class being updated)
      const alreadyAssigned = await Class.findOne({ formTeacher, _id: { $ne: req.params.id } });
      if (alreadyAssigned) {
        return res.status(400).json({ message: "This teacher is already assigned as a form teacher to another class." });
      }
    }

    const updatedClass = await Class.findByIdAndUpdate(
      req.params.id,
      { name, description, formTeacher },
      { new: true }
    );

    if (updatedClass) {
      // 🔄 Sync teacher's assigned_class property
      // If the form teacher has changed or been unassigned
      if (existingClass.formTeacher && String(existingClass.formTeacher) !== String(updatedClass.formTeacher)) {
        // Clear assigned_class for the old form teacher
        await User.findByIdAndUpdate(existingClass.formTeacher, { assigned_class: null });
      }

      // Assign the new form teacher to this class
      if (updatedClass.formTeacher) {
        await User.findByIdAndUpdate(updatedClass.formTeacher, { assigned_class: updatedClass.name });
      }

      // 🔄 Cascading Update: If the class name was changed, update all members
      if (existingClass.name !== updatedClass.name) {
        await User.updateMany({ assigned_class: existingClass.name }, { assigned_class: updatedClass.name });
        await Student.updateMany({ current_class: existingClass.name }, { current_class: updatedClass.name });
      }
      // If formTeacher was explicitly set to null (unassigned) and there was an old one
      else if (!updatedClass.formTeacher && existingClass.formTeacher) {
        await User.findByIdAndUpdate(existingClass.formTeacher, { assigned_class: null });
      }

      await AuditLog.create({
        actionType: 'CLASS_UPDATED',
        performedBy: req.user.id,
        details: {
          classId: updatedClass._id,
          className: updatedClass.name,
          description: updatedClass.description,
          formTeacher: updatedClass.formTeacher,
          changes: req.body // Log what was sent in the request body
        },
        timestamp: new Date()
      });
    }

    if (!updatedClass) return res.status(404).json({ message: "Class not found" });
    res.json({ message: "Class updated successfully", class: updatedClass });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteClass = async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: "Class not found" });

    // 🔄 Clear assigned_class for the form teacher if one exists
    if (cls.formTeacher) {
      await User.findByIdAndUpdate(cls.formTeacher, { assigned_class: null });
    }

    // Unassign users from this class before deleting
    await User.updateMany({ assigned_class: cls.name }, { assigned_class: "" });
    await Student.updateMany({ current_class: cls.name }, { current_class: "Unassigned" });

    await AuditLog.create({
      actionType: 'CLASS_DELETED',
      performedBy: req.user.id,
      details: { classId: cls._id, className: cls.name, description: cls.description },
      timestamp: new Date()
    });
    await Class.findByIdAndDelete(req.params.id);
    res.json({ message: "Class deleted successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getClassMembers = async (req, res) => {
  try {
    const { name } = req.params;
    const members = await User.find({ assigned_class: name }).select('full_name school_id role email');
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch class members", error: err.message });
  }
};

export const assignUsersToClass = async (req, res) => {
  try {
    const { className, userIds } = req.body;

    if (!className || !Array.isArray(userIds)) {
      return res.status(400).json({ message: "className and userIds array are required." });
    }

    // 1. Unassign all users currently in this class to ensure a clean sync
    await User.updateMany({ assigned_class: className }, { assigned_class: "" });
    await Student.updateMany({ current_class: className }, { current_class: "Unassigned" });

    // Update core User accounts
    await User.updateMany({ _id: { $in: userIds } }, { assigned_class: className });
    
    // Update Student profiles where applicable
    await Student.updateMany({ user: { $in: userIds } }, { current_class: className });

    res.json({ message: `Successfully assigned users to ${className}` });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * @desc    Promotes/Moves all students from one class to another
 * @route   POST /api/admin/classes/promote
 * @access  Admin
 */
export const promoteClass = async (req, res) => {
  try {
    const { fromClassName, toClassName } = req.body;

    if (!fromClassName || !toClassName) {
      return res.status(400).json({ message: "Source and destination classes are required." });
    }

    // 1. Update core User accounts (Only for students)
    const userUpdate = await User.updateMany(
      { role: 'student', assigned_class: fromClassName },
      { assigned_class: toClassName }
    );

    // 2. Update Student profiles
    const studentUpdate = await Student.updateMany(
      { current_class: fromClassName },
      { current_class: toClassName }
    );

    res.json({ 
      message: `Successfully moved students from ${fromClassName} to ${toClassName}`,
      count: userUpdate.modifiedCount
    });
  } catch (err) {
    console.error(`Error during class promotion: ${err.message}`);

    try {
      await AuditLog.create({
        actionType: 'CLASS_PROMOTION',
        performedBy: req.user.id,
        details: { fromClassName: req.body.fromClassName, toClassName: req.body.toClassName, status: 'FAILED', error: err.message },
        timestamp: new Date()
      });
    } catch (auditErr) {
      console.error('Failed to write promotion audit log:', auditErr.message);
    }

    res.status(500).json({ message: "Error during class promotion", error: err.message });
  }
};
