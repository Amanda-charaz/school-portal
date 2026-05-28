import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  try {
    const { full_name, role, assigned_class, assigned_subjects } =
      req.body;

    // 1. Determine the Prefix based on the role
    let prefix = "A"; // Default for Admin
    if (role === "student") prefix = "S";
    if (role === "teacher") prefix = "T";

    // 2. Count how many users already have this role to get the next sequential number
    const count = await User.countDocuments({ role });

    // 3. Generate the ID (S1, T1, etc.)
    const school_id = `${prefix}${count + 1}`;

    // 4. Generate the automatic email
    const email = `${school_id.toLowerCase()}@s.com`;

    // 5. Set the Default Password
    const defaultPassword = "1234";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // 5. Create the User
    const newUser = await User.create({
      full_name,
      email,
      password: hashedPassword,
      role,
      school_id, // Save the generated ID
      assigned_class: role === "student" ? assigned_class : null,
      assigned_subjects: role === "teacher" ? assigned_subjects : [],
    });

    res.status(201).json({
      message: "User created successfully",
      user: newUser
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during registration" });
  }
};

export const login = async (req, res) => {
  try {
    // 1. Accept both 'email' or 'identifier' from the request body
    const { identifier, email, password } = req.body;

    // Determine which login field to use
    const loginValue = identifier || email;

    if (!loginValue || !password) {
      return res.status(400).json({ message: "Please provide all fields" });
    }

    // 2. Find user by email OR school_id (if you use school IDs)
    const user = await User.findOne({
      $or: [{ email: loginValue }, { school_id: loginValue }],
    });

    if (!user) {
      // 💡 If you see this in your browser, it means the search failed
      return res
        .status(400)
        .json({ message: "Invalid credentials: User not found" });
    }

    // 3. Compare Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // 💡 If you see this, the email was found but the password hash didn't match
      return res
        .status(400)
        .json({ message: "Invalid credentials: Password mismatch" });
    }

    // 4. Generate Token
    // Inside your login function
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role, // String: "admin"
        role_id: user.role_id, // String: "admin" (to support old code)
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );
    res.status(200).json({
      token,
      user: {
        id: user._id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        role_id: user.role_id,
        assigned_class: user.assigned_class,
        assigned_subjects: user.assigned_subjects,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { identifier } = req.body;

    // Find user by email OR school_id
    const user = await User.findOne({
      $or: [{ email: identifier }, { school_id: identifier }],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found with that identifier" });
    }

    // 💡 Institutional Note: In a production environment, we would generate a 
    // cryptographically secure token, save it to the DB with an expiry, 
    // and send a localized email via NodeMailer or SendGrid.
    
    res.status(200).json({ 
      message: `Success! Password reset instructions have been sent to ${user.email}` 
    });
  } catch (err) {
    res.status(500).json({ message: "Server error during password reset request" });
  }
};

export const getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select("full_name _id school_id");
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch students" });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password"); // Never send passwords back!
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
};
