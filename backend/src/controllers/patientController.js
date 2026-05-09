import * as patientService from "../services/patientService.js";

/**
 * Patient Controller
 * Handles HTTP requests for patient management
 */

/**
 * POST /api/patients
 * Create a new patient (doctor only)
 */
export const createPatient = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const patientData = req.body;

    // Validation
    const required = [
      "mrn",
      "firstName",
      "lastName",
      "dateOfBirth",
      "diagnosis",
    ];
    const missing = required.filter((field) => !patientData[field]);
    if (missing.length > 0) {
      return res.status(400).json({
        error: "Missing required fields",
        missing,
      });
    }

    const patient = await patientService.createPatient(doctorId, patientData);

    res.status(201).json({
      message: "Patient created successfully",
      patient,
    });
  } catch (error) {
    console.error("Create patient error:", error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * GET /api/patients
 * Get all patients (role-based filtering)
 */
export const getPatients = async (req, res) => {
  try {
    const { id: userId, role, shift } = req.user;

    let patients;
    if (role === "doctor" || role === "admin") {
      patients = await patientService.getPatientsByDoctor(userId);
    } else if (role === "nurse") {
      patients = await patientService.getPatientsByNurse(userId, shift);
    } else {
      return res.status(403).json({ error: "Invalid role" });
    }

    res.status(200).json({ patients });
  } catch (error) {
    console.error("Get patients error:", error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * GET /api/patients/:id
 * Get patient by ID
 */
export const getPatientById = async (req, res) => {
  try {
    const { id: patientId } = req.params;
    const { id: userId, role } = req.user;

    const patient = await patientService.getPatientById(
      patientId,
      userId,
      role
    );

    res.status(200).json({ patient });
  } catch (error) {
    console.error("Get patient error:", error);
    res
      .status(error.message === "Access denied to this patient" ? 403 : 404)
      .json({
        error: error.message,
      });
  }
};

/**
 * PUT /api/patients/:id
 * Update patient details (doctor only)
 */
export const updatePatient = async (req, res) => {
  try {
    const { id: patientId } = req.params;
    const doctorId = req.user.id;
    const updates = req.body;

    const patient = await patientService.updatePatient(
      patientId,
      doctorId,
      updates
    );

    res.status(200).json({
      message: "Patient updated successfully",
      patient,
    });
  } catch (error) {
    console.error("Update patient error:", error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * POST /api/patients/:id/assign-nurse
 * Assign or update nurses for a patient (doctor only)
 */
export const assignNurse = async (req, res) => {
  try {
    const { id: patientId } = req.params;
    const doctorId = req.user.id;
    const { dayNurseId, nightNurseId } = req.body;

    if (!dayNurseId && !nightNurseId) {
      return res.status(400).json({
        error: "At least one nurse assignment required",
      });
    }

    const patient = await patientService.assignNurse(patientId, doctorId, {
      dayNurseId,
      nightNurseId,
    });

    res.status(200).json({
      message: "Nurses assigned successfully",
      patient,
    });
  } catch (error) {
    console.error("Assign nurse error:", error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * POST /api/patients/:id/discharge
 * Discharge patient (doctor only)
 */
export const dischargePatient = async (req, res) => {
  try {
    const { id: patientId } = req.params;
    const doctorId = req.user.id;

    const patient = await patientService.dischargePatient(patientId, doctorId);

    res.status(200).json({
      message: "Patient discharged successfully",
      patient,
    });
  } catch (error) {
    console.error("Discharge patient error:", error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * GET /api/patients/nurses/available
 * Get all available nurses for assignment
 */
export const getAvailableNurses = async (req, res) => {
  try {
    const nurses = await patientService.getAvailableNurses();

    res.status(200).json(nurses);
  } catch (error) {
    console.error("Get available nurses error:", error);
    res.status(400).json({ error: error.message });
  }
};
