import HandoffSummary from "../models/handoffSummary.js";
import { generateSummary } from "../services/handoffService.js";

// Generate a new handoff summary draft
export const generateHandoffSummary = async (req, res) => {
  try {
    const { encounterId } = req.params;
    const { shiftType, sourceNoteIds } = req.body;

    if (!encounterId || !shiftType || !sourceNoteIds || !sourceNoteIds.length) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters",
      });
    }

    const handoffSummary = await generateSummary(
      encounterId,
      shiftType,
      sourceNoteIds
    );

    res.status(201).json({
      success: true,
      data: handoffSummary,
    });
  } catch (error) {
    console.error("Error generating handoff summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate handoff summary",
      error: error.message,
    });
  }
};

// Get a specific handoff summary
export const getHandoffSummary = async (req, res) => {
  try {
    const { summaryId } = req.params;

    const handoffSummary = await HandoffSummary.findById(summaryId)
      .populate("sourceNotesRefs", "noteType authorRole creationTimestamp")
      .exec();

    if (!handoffSummary) {
      return res.status(404).json({
        success: false,
        message: "Handoff summary not found",
      });
    }

    res.status(200).json({
      success: true,
      data: handoffSummary,
    });
  } catch (error) {
    console.error("Error retrieving handoff summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve handoff summary",
      error: error.message,
    });
  }
};

// Finalize a handoff summary
export const finalizeHandoffSummary = async (req, res) => {
  try {
    const { summaryId } = req.params;
    const { nurseReviewerId, summaryOutput, reviewEdits } = req.body;

    if (!nurseReviewerId) {
      return res.status(400).json({
        success: false,
        message: "Nurse reviewer ID is required",
      });
    }

    const handoffSummary = await HandoffSummary.findById(summaryId);

    if (!handoffSummary) {
      return res.status(404).json({
        success: false,
        message: "Handoff summary not found",
      });
    }

    // Update summary output and status
    handoffSummary.summaryOutput =
      summaryOutput || handoffSummary.summaryOutput;
    handoffSummary.nurseReviewerId = nurseReviewerId;
    handoffSummary.nurseReviewStatus = "Finalized";

    // Add review edits to the audit trail
    if (reviewEdits && reviewEdits.length > 0) {
      handoffSummary.reviewEdits.push(
        ...reviewEdits.map((edit) => ({
          ...edit,
          editedBy: nurseReviewerId,
          timestamp: new Date(),
        }))
      );
    }

    await handoffSummary.save();

    res.status(200).json({
      success: true,
      data: handoffSummary,
    });
  } catch (error) {
    console.error("Error finalizing handoff summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to finalize handoff summary",
      error: error.message,
    });
  }
};

// Get all handoff summaries for an encounter
export const getHandoffSummariesByEncounter = async (req, res) => {
  try {
    const { encounterId } = req.params;

    const handoffSummaries = await HandoffSummary.find({ encounterId })
      .sort({ generationTimestamp: -1 })
      .exec();

    res.status(200).json({
      success: true,
      count: handoffSummaries.length,
      data: handoffSummaries,
    });
  } catch (error) {
    console.error("Error retrieving handoff summaries:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve handoff summaries",
      error: error.message,
    });
  }
};
