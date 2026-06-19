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

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:5173'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.removeHeader('X-Powered-By');
  next();
});

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

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// Fire up our resilient database connection wrapper
connectToDatabase(MONGO_URI).then(async () => {
  // Admin account repair/initialization
  try {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@school.local";
    const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || "ChangeMe!2024";
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      await User.create({
        full_name: "System Admin",
        email: adminEmail,
        password: adminPassword,
        role: "admin",
        role_id: "admin"
      });
      console.log("Admin account created. Change the default password immediately.");
    }
  } catch (err) {
    console.log("❌ Admin repair failed:", err.message);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server is flying high on port ${PORT}`);
  });
});