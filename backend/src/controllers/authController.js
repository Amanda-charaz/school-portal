import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { validatePasswordComplexity } from '../utils/index.js';

/**
 * @desc    Change logged-in user password
 * @route   PUT /api/auth/change-password
 * @access  Private (All Roles)
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
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
    res.status(500).json({ message: "Failed to update password" });
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
    const user = await User.findOne({ 
      $or: [{ email: identifier }, { school_id: identifier }] 
    });

    if (!user) {
      // Return generic message to prevent user enumeration
      return res.json({ message: "If an account exists with that email/ID, reset instructions have been sent." });
    }

    // Generate and hash password reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 3600000; // Token valid for 1 hour

    await user.save();

    // TODO: Integrate an email service (e.g. Nodemailer) to send resetToken to user
    res.json({ message: "If an account exists with that email/ID, reset instructions have been sent." });
  } catch (err) {
    res.status(500).json({ message: "Error processing request" });
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
    res.status(500).json({ message: "Error resetting password" });
  }
};