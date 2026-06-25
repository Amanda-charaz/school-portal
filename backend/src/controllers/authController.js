import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { validatePasswordComplexity } from '../utils/index.js';

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    
    if (!identifier || !password) {
      return res.status(400).json({ message: "Identifier and password are required" });
    }

    // Find user by email or school_id
    const user = await User.findOne({ 
      $or: [{ email: identifier }, { school_id: identifier }] 
    }).select('+password');

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role, role_id: user.role_id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Create audit log
    await AuditLog.create({
      actionType: 'LOGIN',
      performedBy: user._id,
      targetUser: user._id,
      details: { info: "User logged in" },
      timestamp: new Date()
    });

    res.json({
      token,
      user: {
        id: user._id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        role_id: user.role_id,
        school_id: user.school_id,
        assigned_subjects: user.assigned_subjects || [],
        assigned_class: user.assigned_class || null
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};

/**
 * @desc    Change logged-in user password
 * @route   PUT /api/auth/change-password
 * @access  Private (All Roles)
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required." });
    }
    const userId = req.user.id;

    // 1. Find user and explicitly select password field
    // (Assuming the model has select: false for the password field by default)
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2.1. Validate new password complexity
    const complexityError = validatePasswordComplexity(newPassword);
    if (complexityError) {
      return res.status(400).json({ message: complexityError });
    }

    // 2. Verify the current password matches what's in the database
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect current password. Authentication failed." });
    }

    // 3. Update the password field. The User model's pre-save hook will handle hashing automatically.
    user.password = newPassword;
    
    await user.save();

    // 4. Create an audit log for security tracking
    await AuditLog.create({
      actionType: 'PASSWORD_CHANGED',
      performedBy: userId,
      targetUser: userId,
      details: { info: "Self-service password update performed by user" },
      timestamp: new Date()
    });

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update password", error: err.message });
  }
};

/**
 * @desc    Request password reset token
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ message: "Email or school ID is required." });
    }
    const user = await User.findOne({ 
      $or: [{ email: identifier }, { school_id: identifier }] 
    });

    if (!user) {
      return res.status(404).json({ message: "No account found with that email or ID." });
    }

    // Generate and hash password reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 3600000; // Token valid for 1 hour

    await user.save();

    // In a real production app, you would use Nodemailer here to send the email.
    // For now, we return it in the message so you can test the flow.
    res.json({ 
      message: "An email with reset instructions has been sent."
    });
  } catch (err) {
    res.status(500).json({ message: "Error processing request", error: err.message });
  }
};

/**
 * @desc    Reset password using token
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: "Reset token and new password are required." });
    }
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token." });
    }

    const complexityError = validatePasswordComplexity(newPassword);
    if (complexityError) return res.status(400).json({ message: complexityError });

    user.password = newPassword; // Hashed automatically by User model pre-save hook
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password has been reset. you can now sign in." });
  } catch (err) {
    res.status(500).json({ message: "Error resetting password", error: err.message });
  }
};

/**
 * @desc    Get current user's profile
 * @route   GET /api/auth/me
 * @access  Private (All Roles)
 */
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: user._id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      role_id: user.role_id,
      school_id: user.school_id,
      assigned_subjects: user.assigned_subjects || [],
      assigned_class: user.assigned_class || null
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to get user info", error: err.message });
  }
};