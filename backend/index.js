import express from "express";
import cors from "cors";
import morgan from "morgan";
import { config } from "dotenv";
import { connectDB } from "./config/database.js";
import { fileURLToPath } from "url";
import path from "path";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, "../.env") });

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Import routes
import authRoutes from "./src/routes/authRoutes.js";
import patientRoutes from "./src/routes/patientRoutes.js";
import entryRoutes from "./src/routes/entryRoutes.js";
import summaryRoutes from "./src/routes/summaryRoutes.js";
import evaluationRoutes from "./src/routes/evaluationRoutes.js";
import debugRoutes from "./src/routes/debugRoutes.js";
import referenceRoutes from "./src/routes/referenceRoutes.js";
import mlMetricsRoutes from "./src/routes/mlMetricsRoutes.js";
import llmRoutes from "./src/routes/llmRoutes.js";

// Register routes
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/patients", entryRoutes);
app.use("/api/summaries", summaryRoutes);
app.use("/api", summaryRoutes);
app.use("/api/evaluation", evaluationRoutes);
app.use("/api/debug", debugRoutes);
app.use("/api/reference", referenceRoutes);
app.use("/api/ml-metrics", mlMetricsRoutes);
app.use("/api/llm", llmRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

// Connect to MongoDB
connectDB();

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;