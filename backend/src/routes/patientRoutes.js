import express from "express";
import * as patientController from "../controllers/patientController.js";
import {
  authenticate,
  requireDoctor,
  requireRole,
} from "../middleware/auth.js";

const router = express.Router();

/**
 * Patient Routes
 * All patient management endpoints
 */

// Get available nurses (doctor only) - MUST be before /:id route
router.get(
  "/nurses/available",
  authenticate,
  requireDoctor,
  patientController.getAvailableNurses
);

// Create patient (doctor only)
router.post("/", authenticate, requireDoctor, patientController.createPatient);

// Get all patients (role-based filtering)
router.get("/", authenticate, patientController.getPatients);

// Get patient by ID (access-controlled) - MUST be after specific routes
router.get("/:id", authenticate, patientController.getPatientById);

// Update patient (doctor only)
router.put(
  "/:id",
  authenticate,
  requireDoctor,
  patientController.updatePatient
);

// Assign nurses (doctor only)
router.post(
  "/:id/assign-nurse",
  authenticate,
  requireDoctor,
  patientController.assignNurse
);

// Discharge patient (doctor only)
router.post(
  "/:id/discharge",
  authenticate,
  requireDoctor,
  patientController.dischargePatient
);

export default router;
