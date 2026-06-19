import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import { connectToDatabase } from './src/config/db.js';
import User from "./src/models/User.js";

import authRoutes from "./src/routes/authRoutes.js";
import resultRoutes from "./src/routes/resultRoutes.js";
import attendanceRoutes from "./src/routes/attendanceRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import feeRoutes from "./src/routes/feeRoutes.js";
import studentRoutes from "./src/routes/studentRoutes.js";
import fileRoutes from "./src/routes/fileRoutes.js";
import accountsRoutes from './src/routes/accounts.js';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/result", resultRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/fees", feeRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/files", fileRoutes);
app.use('/api/accounts', accountsRoutes);

app.get("/", (req, res) => {
  res.send("School Portal API Running...");
});

// Global error-handling middleware for uncaught route/middleware errors
app.use((err, req, res, _next) => {
  console.error("Unhandled error:", err.message);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error"
  });
});

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// Fire up our resilient database connection wrapper
connectToDatabase(MONGO_URI).then(async () => {
  // Admin account repair/initialization
  try {
    const existingAdmin = await User.findOne({ email: "admin@test.com" });

    if (!existingAdmin) {
      await User.create({
        full_name: "System Admin",
        email: "admin@test.com",
        password: "admin123",
        role: "admin",
        role_id: "admin"
      });
      console.log("🚀 Admin account CREATED");
    } else {
      existingAdmin.password = "admin123";
      existingAdmin.role = "admin";
      existingAdmin.role_id = "admin";
      await existingAdmin.save();
      console.log("🛠️ Admin account UPDATED");
    }
    console.log("🔑 Admin Login → admin@test.com / admin123");
  } catch (err) {
    console.error("❌ Admin repair failed:", err.message);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server is flying high on port ${PORT}`);
  });
}).catch((err) => {
  console.error("❌ Failed to start server:", err.message);
  process.exit(1);
});