import * as entryService from "../services/entryService.js";

/**
 * Entry Controller
 * Handles HTTP requests for nurse log entries
 */

/**
 * POST /api/patients/:patientId/entries
 * Create a new entry
 */
export const createEntry = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { id: nurseId, shift } = req.user;
    const entryData = req.body;

    // Validation
    if (!entryData.type) {
      return res.status(400).json({ error: "Entry type is required" });
    }

    if (!entryData.payload) {
      return res.status(400).json({ error: "Entry payload is required" });
    }

    const entry = await entryService.createEntry(
      nurseId,
      shift,
      patientId,
      entryData
    );

    res.status(201).json({
      message: "Entry created successfully",
      entry,
    });
  } catch (error) {
    console.error("Create entry error:", error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * GET /api/patients/:patientId/entries
 * Get all entries for a patient with optional filters
 */
export const getEntries = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { id: userId, role } = req.user;
    const { type, shift, startDate, endDate, limit } = req.query;

    const entries = await entryService.getEntriesByPatient(
      patientId,
      userId,
      role,
      { type, shift, startDate, endDate, limit: limit ? parseInt(limit) : 100 }
    );

    res.status(200).json({ entries, count: entries.length });
  } catch (error) {
    console.error("Get entries error:", error);
    res.status(error.message.includes("Access denied") ? 403 : 400).json({
      error: error.message,
    });
  }
};

/**
 * GET /api/patients/:patientId/vitals/latest
 * Get latest vitals for a patient
 */
export const getLatestVitals = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { id: userId, role } = req.user;

    const vitals = await entryService.getLatestVitals(patientId, userId, role);

    res.status(200).json({ vitals });
  } catch (error) {
    console.error("Get latest vitals error:", error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * GET /api/patients/:patientId/medications
 * Get medication history for a patient
 */
export const getMedicationHistory = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { id: userId, role } = req.user;

    const medications = await entryService.getMedicationHistory(
      patientId,
      userId,
      role
    );

    res.status(200).json({ medications, count: medications.length });
  } catch (error) {
    console.error("Get medication history error:", error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * PUT /api/entries/:id
 * Update an entry
 */
export const updateEntry = async (req, res) => {
  try {
    const { id: entryId } = req.params;
    const { id: nurseId } = req.user;
    const updates = req.body;

    const entry = await entryService.updateEntry(entryId, nurseId, updates);

    res.status(200).json({
      message: "Entry updated successfully",
      entry,
    });
  } catch (error) {
    console.error("Update entry error:", error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * DELETE /api/entries/:id
 * Delete an entry (soft delete)
 */
export const deleteEntry = async (req, res) => {
  try {
    const { id: entryId } = req.params;
    const { id: nurseId } = req.user;

    const result = await entryService.deleteEntry(entryId, nurseId);

    res.status(200).json(result);
  } catch (error) {
    console.error("Delete entry error:", error);
    res.status(400).json({ error: error.message });
  }
};
