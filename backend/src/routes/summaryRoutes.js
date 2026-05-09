import express from "express";
import * as summaryController from "../controllers/summaryController.js";
import { authenticate, requireDoctor } from "../middleware/auth.js";

const router = express.Router();

/**
 * Summary Routes
 * All patient summary endpoints
 */

// Get pending summaries (doctor only)
router.get(
  "/pending",
  authenticate,
  requireDoctor,
  summaryController.getPendingSummaries
);

// Generate summary for a patient
router.post(
  "/patients/:patientId/summaries/generate",
  authenticate,
  summaryController.generateSummary
);

// Get all summaries for a patient
router.get(
  "/patients/:patientId/summaries",
  authenticate,
  summaryController.getSummaries
);

// Get summary by ID
router.get("/:id", authenticate, summaryController.getSummaryById);

// Update summary (doctor only)
router.put(
  "/:id",
  authenticate,
  requireDoctor,
  summaryController.updateSummary
);

// Approve summary (doctor only)
router.post(
  "/:id/approve",
  authenticate,
  requireDoctor,
  summaryController.approveSummary
);

export default router;
