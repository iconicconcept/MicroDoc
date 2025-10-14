import express from "express";
import dotenv from "dotenv";
import "dotenv/config";
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
import cors from "cors";
import helmet from "helmet";
// import compression from "compression";
// import morgan from "morgan";
import { connectToDatabase } from "./config/database.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { rateLimiter } from "./middleware/rateLimiter.js";

// Route imports
import authRoutes from "./routes/auth.route.js";
import clinicalNotesRoutes from "./routes/clinicalNotes.route.js";
import labReportsRoutes from "./routes/labReports.route.js";
import burnoutRoutes from "./routes/burnout.route.js";
import patientsRoutes from "./routes/patients.route.js";
import analyticsRoutes from "./routes/analytics.route.js";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 7000;

// Manually locate the .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

console.log("process.cwd():", process.cwd());
console.log("Looking for .env at:", path.resolve(__dirname, "../.env"));
console.log("Current working directory:", process.cwd());
console.log("MONGODB_URI from env:", process.env.MONGODB_URI);

// Middleware
app.use(helmet());
// app.use(compression());
// app.use(morgan("combined"));
const allowedOrigins = [process.env.FRONTEND_URL || "http://localhost:3000"];

app.use(
  cors({
    origin: allowedOrigins,
    methods: "GET,POST,PUT,DELETE,PATCH,OPTIONS",
    allowedHeaders: "Content-Type, Authorization",
    credentials: true,
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(rateLimiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/clinical-notes", clinicalNotesRoutes);
app.use("/api/lab-reports", labReportsRoutes);
app.use("/api/burnout", burnoutRoutes);
app.use("/api/patients", patientsRoutes);
app.use("/api/analytics", analyticsRoutes)

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Error handling
app.use(errorHandler);

// 404 handler
// app.use("*", (req, res) => {
//   res.status(404).json({ error: "Route not found" });
// });

async function startServer() {
  try {
    await connectToDatabase();
    console.log("MONGODB_URI:", process.env.MONGODB_URI);
    app.listen(PORT, () => {
      console.log(`🚀 Backend server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
