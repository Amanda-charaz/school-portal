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

console.log("Step 1: Loading dotenv...");
dotenv.config();
console.log("Step 2: Dotenv loaded. PORT:", process.env.PORT);
console.log("Step 3: Creating express app...");
const app = express();

// --- Secure CORS Configuration for Render ---
// This is critical for allowing your Vercel frontend to communicate with your Render backend.
// --- Robust CORS Configuration for Production Deployment ---
// --- Hardcoded CORS Configuration ---
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://school-portal-iota-eight.vercel.app',
  'https://school-portal-pda3y7f5e-amanda-charazs-projects.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like Postman or mobile)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      console.log(`❌ Blocked Origin: ${origin}`);
      return callback(new Error('CORS Policy Block'), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/fees", feeRoutes);
app.use("/api/result", resultRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/attendance", attendanceRoutes);
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
console.log("Step 4: About to connect to database with URI:", MONGO_URI);

// Fire up our resilient database connection wrapper
connectToDatabase(MONGO_URI).then(async () => {
  console.log("✅ Step 5: Connected to database successfully!");
  console.log("🚀 Step 6: Starting server...");
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Server is flying high on port ${PORT}`);
      console.log(`   Local: http://localhost:${PORT}`);
    });
}).catch((err) => {
  console.error("❌ Failed to start server:", err.message);
  process.exit(1);
});