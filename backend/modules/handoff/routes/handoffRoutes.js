import express from "express";
import * as handoffController from "../controllers/handoffController.js";

const router = express.Router();

// Generate a new handoff summary draft
router.post("/generate/:encounterId", handoffController.generateHandoffSummary);

// Get a specific handoff summary
router.get("/:summaryId", handoffController.getHandoffSummary);

// Finalize a handoff summary
router.put("/:summaryId/finalize", handoffController.finalizeHandoffSummary);

// Get all handoff summaries for an encounter
router.get(
  "/encounter/:encounterId",
  handoffController.getHandoffSummariesByEncounter
);

export default router;
