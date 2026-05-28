const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.get('/users', protect, authorize('admin'), getUsers);
router.delete('/users/:id', protect, authorize('admin'), deleteUser);
router.post('/results/add', protect, authorize('admin', 'teacher'), addResult);
module.exports = router;
