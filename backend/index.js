import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { connectToDatabase } from './src/config/db.js';

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

// --- Secure CORS Configuration for Render ---
// This is critical for allowing your Vercel frontend to communicate with your Render backend.
// --- Environment-based CORS Configuration ---
const allowedOrigins = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : [
  'http://localhost:3000',
  'http://localhost:5173'
];

const corsOptions = {
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
};

app.use(cors(corsOptions));
// --- End CORS Configuration ---

// Handle OPTIONS preflight requests
app.options('*', cors(corsOptions));

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

// Connect to the database when the serverless function starts.
connectToDatabase(process.env.MONGO_URI).catch((err) => {
  console.error("❌ Failed to connect to database on startup:", err.message);
  // Exit the process if the database connection fails on startup.
  process.exit(1);
});

// Export the app for Vercel to use
export default app;