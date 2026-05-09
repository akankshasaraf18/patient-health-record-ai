import Entry from "../models/Entry.js";
import Patient from "../models/Patient.js";

/**
 * Entry Service
 * Handles nurse log entries (vitals, medications, notes, events)
 */

/**
 * Create a new entry
 */
export const createEntry = async (
  nurseId,
  nurseShift,
  patientId,
  entryData
) => {
  const { type, payload, notes, timestamp } = entryData;

  // Check if patient exists and nurse has access
  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new Error("Patient not found");
  }

  if (!patient.hasAccess(nurseId, "nurse")) {
    throw new Error("Access denied to this patient");
  }

  // Validate entry type
  const validTypes = [
    "vital",
    "medication",
    "note",
    "assessment",
    "event",
    "lab",
    "procedure",
    "intake_output",
  ];
  if (!validTypes.includes(type)) {
    throw new Error(
      `Invalid entry type. Must be one of: ${validTypes.join(", ")}`
    );
  }

  // Validate nurse shift time
  // Day shift: 7am-7pm, Night shift: 7pm-7am
  const entryTime = timestamp ? new Date(timestamp) : new Date();
  const hour = entryTime.getHours();
  if (nurseShift === "day") {
    if (hour < 7 || hour >= 19) {
      throw new Error(
        "Day shift nurse can only add reports between 7am and 7pm."
      );
    }
  } else if (nurseShift === "night") {
    if (hour >= 7 && hour < 19) {
      throw new Error(
        "Night shift nurse can only add reports between 7pm and 7am."
      );
    }
  }

  // Create entry
  const entry = new Entry({
    patientId: patientId,
    authorId: nurseId,
    type,
    shift: nurseShift,
    payload,
    notes,
    ...(timestamp && { timestamp: new Date(timestamp) }), // Use custom timestamp if provided
  });

  await entry.save();

  // Populate nurse details
  await entry.populate("authorId", "firstName lastName email shift");

  return entry;
};

/**
 * Get all entries for a patient
 */
export const getEntriesByPatient = async (
  patientId,
  userId,
  userRole,
  options = {}
) => {
  // Check access
  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new Error("Patient not found");
  }

  if (!patient.hasAccess(userId, userRole)) {
    throw new Error("Access denied to this patient");
  }

  const { type, shift, startDate, endDate, limit = 100 } = options;

  const query = {
    patientId: patientId,
    isDeleted: false,
  };

  if (type) query.type = type;
  if (shift) query.shift = shift;
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  const entries = await Entry.find(query)
    .populate("authorId", "firstName lastName email shift")
    .sort({ timestamp: -1 })
    .limit(limit);

  return entries;
};

/**
 * Get latest vitals for a patient
 */
export const getLatestVitals = async (patientId, userId, userRole) => {
  // Check access
  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new Error("Patient not found");
  }

  if (!patient.hasAccess(userId, userRole)) {
    throw new Error("Access denied to this patient");
  }

  const latestVital = await Entry.findOne({
    patientId: patientId,
    type: "vital",
    isDeleted: false,
  })
    .populate("authorId", "firstName lastName email shift")
    .sort({ timestamp: -1 });

  return latestVital;
};

/**
 * Get medication history for a patient
 */
export const getMedicationHistory = async (patientId, userId, userRole) => {
  // Check access
  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new Error("Patient not found");
  }

  if (!patient.hasAccess(userId, userRole)) {
    throw new Error("Access denied to this patient");
  }

  const medications = await Entry.find({
    patientId: patientId,
    type: "medication",
    isDeleted: false,
  })
    .populate("authorId", "firstName lastName email shift")
    .sort({ timestamp: -1 })
    .limit(50);

  return medications;
};

/**
 * Update an entry (nurse can edit their own entries)
 */
export const updateEntry = async (entryId, nurseId, updates) => {
  const entry = await Entry.findOne({
    _id: entryId,
    authorId: nurseId,
    isDeleted: false,
  });

  if (!entry) {
    throw new Error("Entry not found or access denied");
  }

  const { payload, notes } = updates;

  // Use the model method to track edit history
  if (payload !== undefined || notes !== undefined) {
    await entry.editEntry(nurseId, payload || entry.payload, notes);
  }

  await entry.populate("authorId", "firstName lastName email shift");

  return entry;
};

/**
 * Delete an entry (soft delete)
 */
export const deleteEntry = async (entryId, nurseId) => {
  const entry = await Entry.findOne({
    _id: entryId,
    authorId: nurseId,
    isDeleted: false,
  });

  if (!entry) {
    throw new Error("Entry not found or access denied");
  }

  await entry.softDelete(nurseId);

  return { message: "Entry deleted successfully" };
};

/**
 * Get entries for a specific time range (for summarization)
 */
export const getEntriesForTimeRange = async (patientId, startDate, endDate) => {
  const entries = await Entry.find({
    patientId: patientId,
    timestamp: {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    },
    isDeleted: false,
  })
    .populate("authorId", "firstName lastName email shift")
    .sort({ timestamp: 1 }); // Chronological order for summarization

  return entries;
};
