import * as summaryService from "../services/summaryService.js";

/**
 * Summary Controller
 * Handles HTTP requests for patient summaries
 */

/**
 * POST /api/patients/:patientId/summaries/generate
 * Generate a new summary for a patient
 */
export const generateSummary = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { id: userId, role } = req.user;
    const { startDate, endDate } = req.body;

    const summary = await summaryService.generateSummary(
      patientId,
      userId,
      role,
      { startDate, endDate }
    );

    res.status(201).json({
      message: "Summary generated successfully",
      summary,
    });
  } catch (error) {
    console.error("Generate summary error:", error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * GET /api/patients/:patientId/summaries
 * Get all summaries for a patient
 */
export const getSummaries = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { id: userId, role } = req.user;

    const summaries = await summaryService.getSummariesByPatient(
      patientId,
      userId,
      role
    );

    res.status(200).json({ summaries, count: summaries.length });
  } catch (error) {
    console.error("Get summaries error:", error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * GET /api/summaries/:id
 * Get summary by ID
 */
export const getSummaryById = async (req, res) => {
  try {
    const { id: summaryId } = req.params;
    const { id: userId, role } = req.user;

    const summary = await summaryService.getSummaryById(
      summaryId,
      userId,
      role
    );

    res.status(200).json({ summary });
  } catch (error) {
    console.error("Get summary error:", error);
    res.status(error.message.includes("Access denied") ? 403 : 404).json({
      error: error.message,
    });
  }
};

/**
 * PUT /api/summaries/:id
 * Update summary (doctor review/edit)
 */
export const updateSummary = async (req, res) => {
  try {
    const { id: summaryId } = req.params;
    const doctorId = req.user.id;
    const updates = req.body;

    const summary = await summaryService.updateSummary(
      summaryId,
      doctorId,
      updates
    );

    res.status(200).json({
      message: "Summary updated successfully",
      summary,
    });
  } catch (error) {
    console.error("Update summary error:", error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * POST /api/summaries/:id/approve
 * Approve summary (doctor sign-off)
 */
export const approveSummary = async (req, res) => {
  try {
    const { id: summaryId } = req.params;
    const doctorId = req.user.id;

    const summary = await summaryService.approveSummary(summaryId, doctorId);

    res.status(200).json({
      message: "Summary approved successfully",
      summary,
    });
  } catch (error) {
    console.error("Approve summary error:", error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * GET /api/summaries/pending
 * Get pending summaries for review (doctor)
 */
export const getPendingSummaries = async (req, res) => {
  try {
    const doctorId = req.user.id;

    const summaries = await summaryService.getPendingSummaries(doctorId);

    res.status(200).json({ summaries, count: summaries.length });
  } catch (error) {
    console.error("Get pending summaries error:", error);
    res.status(400).json({ error: error.message });
  }
};
