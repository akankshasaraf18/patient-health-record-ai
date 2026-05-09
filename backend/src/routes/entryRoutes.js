import express from "express";
import * as entryController from "../controllers/entryController.js";
import { authenticate, requireNurse } from "../middleware/auth.js";

const router = express.Router();

/**
 * Entry Routes
 * All nurse log entry endpoints
 */

// Create entry (nurse only)
router.post(
  "/:patientId/entries",
  authenticate,
  requireNurse,
  entryController.createEntry
);

// Get entries for a patient (with filters)
router.get("/:patientId/entries", authenticate, entryController.getEntries);

// Get latest vitals
router.get(
  "/:patientId/vitals/latest",
  authenticate,
  entryController.getLatestVitals
);

// Get medication history
router.get(
  "/:patientId/medications",
  authenticate,
  entryController.getMedicationHistory
);

// Update entry (nurse only)
router.put(
  "/entries/:id",
  authenticate,
  requireNurse,
  entryController.updateEntry
);

// Delete entry (nurse only)
router.delete(
  "/entries/:id",
  authenticate,
  requireNurse,
  entryController.deleteEntry
);

export default router;
