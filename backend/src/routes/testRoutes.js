const express = require("express");
const router = express.Router();
const { verifyToken, authorize } = require("../middleware/authMiddleware");
// 🔓 Any logged-in user
router.get("/dashboard", verifyToken, (req, res) => {
  res.json({ message: "Welcome user", user: req.user });
});

// 🔐 Admin only
router.get("/admin", verifyToken, authorize([4]), (req, res) => {
  res.json({ message: "Welcome Admin" });
});

// 👨‍🏫 Teacher only
router.get("/teacher", verifyToken, authorize([2]), (req, res) => {
  res.json({ message: "Welcome Teacher" });
});

// 🎓 Student only
router.get("/student", verifyToken, authorize([1]), (req, res) => {
  res.json({ message: "Welcome Student" });
});

module.exports = router;