import Patient from "../models/Patient.js";
import User from "../models/User.js";

/**
 * Patient Service
 * Handles patient creation, assignment, and management
 */

/**
 * Create a new patient (doctor only)
 */
export const createPatient = async (doctorId, patientData) => {
  const {
    mrn,
    firstName,
    lastName,
    dateOfBirth,
    admissionDate,
    diagnosis,
    dayNurseId,
    nightNurseId,
  } = patientData;

  // Check if MRN already exists
  const existingPatient = await Patient.findOne({ mrn });
  if (existingPatient) {
    throw new Error("Patient with this MRN already exists");
  }

  // Validate nurses if provided
  if (dayNurseId) {
    const dayNurse = await User.findById(dayNurseId);
    if (!dayNurse || dayNurse.role !== "nurse" || dayNurse.shift !== "day") {
      throw new Error("Invalid day nurse assignment");
    }
  }

  if (nightNurseId) {
    const nightNurse = await User.findById(nightNurseId);
    if (
      !nightNurse ||
      nightNurse.role !== "nurse" ||
      nightNurse.shift !== "night"
    ) {
      throw new Error("Invalid night nurse assignment");
    }
  }

  // Create patient
  const patient = new Patient({
    mrn,
    firstName,
    lastName,
    dateOfBirth,
    admissionDate: admissionDate || new Date(),
    diagnosis,
    assignedDoctor: doctorId,
    dayNurse: dayNurseId,
    nightNurse: nightNurseId,
    status: "active",
  });

  await patient.save();

  return patient;
};

/**
 * Get all patients for a doctor
 */
export const getPatientsByDoctor = async (doctorId) => {
  const patients = await Patient.find({
    assignedDoctor: doctorId,
    status: "active",
  })
    .populate("dayNurse", "firstName lastName email shift")
    .populate("nightNurse", "firstName lastName email shift")
    .populate("assignedDoctor", "firstName lastName email")
    .sort({ admissionDate: -1 });

  return patients;
};

/**
 * Get all patients for a nurse (based on their shift)
 */
export const getPatientsByNurse = async (nurseId, shift) => {
  const query = { status: "active" };

  if (shift === "day") {
    query.dayNurse = nurseId;
  } else if (shift === "night") {
    query.nightNurse = nurseId;
  }

  const patients = await Patient.find(query)
    .populate("dayNurse", "firstName lastName email shift")
    .populate("nightNurse", "firstName lastName email shift")
    .populate("assignedDoctor", "firstName lastName email")
    .sort({ admissionDate: -1 });

  return patients;
};

/**
 * Get patient by ID
 */
export const getPatientById = async (patientId, userId, userRole) => {
  console.log("Fetching patient:", { patientId, userId, userRole });

  const patient = await Patient.findById(patientId)
    .populate("dayNurse", "firstName lastName email shift")
    .populate("nightNurse", "firstName lastName email shift")
    .populate("assignedDoctor", "firstName lastName email");

  console.log("Found patient:", patient ? "YES" : "NO");

  if (!patient) {
    throw new Error("Patient not found");
  }

  // Check access
  if (!patient.hasAccess(userId, userRole)) {
    console.log("Access denied for user:", userId);
    throw new Error("Access denied to this patient");
  }

  return patient;
};

/**
 * Update patient details (doctor only)
 */
export const updatePatient = async (patientId, doctorId, updates) => {
  const patient = await Patient.findOne({
    _id: patientId,
    assignedDoctor: doctorId,
  });

  if (!patient) {
    throw new Error("Patient not found or access denied");
  }

  // Update allowed fields
  const allowedFields = ["firstName", "lastName", "dateOfBirth", "diagnosis"];
  allowedFields.forEach((field) => {
    if (updates[field] !== undefined) {
      patient[field] = updates[field];
    }
  });

  await patient.save();

  return patient;
};

/**
 * Assign or update nurses for a patient (doctor only)
 */
export const assignNurse = async (
  patientId,
  doctorId,
  { dayNurseId, nightNurseId }
) => {
  const patient = await Patient.findOne({
    _id: patientId,
    assignedDoctor: doctorId,
  });

  if (!patient) {
    throw new Error("Patient not found or access denied");
  }

  // Validate and assign day nurse
  if (dayNurseId) {
    const dayNurse = await User.findById(dayNurseId);
    if (!dayNurse || dayNurse.role !== "nurse" || dayNurse.shift !== "day") {
      throw new Error("Invalid day nurse assignment");
    }
    await patient.updateNurseAssignment("day", dayNurseId);
  }

  // Validate and assign night nurse
  if (nightNurseId) {
    const nightNurse = await User.findById(nightNurseId);
    if (
      !nightNurse ||
      nightNurse.role !== "nurse" ||
      nightNurse.shift !== "night"
    ) {
      throw new Error("Invalid night nurse assignment");
    }
    await patient.updateNurseAssignment("night", nightNurseId);
  }

  // Reload with populated fields
  await patient.populate("dayNurse", "firstName lastName email shift");
  await patient.populate("nightNurse", "firstName lastName email shift");

  return patient;
};

/**
 * Discharge patient (doctor only)
 */
export const dischargePatient = async (patientId, doctorId) => {
  const patient = await Patient.findOne({
    _id: patientId,
    assignedDoctor: doctorId,
  });

  if (!patient) {
    throw new Error("Patient not found or access denied");
  }

  await patient.discharge();

  return patient;
};

/**
 * Get all nurses for assignment
 */
export const getAvailableNurses = async () => {
  const nurses = await User.find({ role: "nurse" })
    .select("firstName lastName email shift")
    .sort({ shift: 1, lastName: 1 });

  return {
    dayNurses: nurses.filter((n) => n.shift === "day"),
    nightNurses: nurses.filter((n) => n.shift === "night"),
  };
};
