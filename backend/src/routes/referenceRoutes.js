import express from "express";
import Summary from "../models/Summary.js";

const router = express.Router();

/**
 * POST /api/reference/generate/:id
 * Generate a tailored reference summary for a specific summary
 */
router.post("/generate/:id", async (req, res) => {
  try {
    const summaryId = req.params.id;

    // Get the summary
    const summary = await Summary.findById(summaryId).populate("patientId");

    if (!summary) {
      return res.status(404).json({ error: "Summary not found" });
    }

    // Extract patient information
    const patientName = summary.patientId
      ? `${summary.patientId.firstName} ${summary.patientId.lastName}`
      : "Unknown Patient";
    const patientAge = summary.patientId?.age || "Unknown";
    const mrn = summary.patientId?.mrn || "Unknown";

    // Get diagnosis from summary
    let diagnosis = "Unknown";
    if (summary.summaryOutput?.background?.diagnosis) {
      diagnosis = summary.summaryOutput.background.diagnosis;
    }

    // Generate reference summary
    const referenceSummary = {
      situation: `${patientAge}-year-old patient ${patientName} (MRN: ${mrn}) admitted with ${diagnosis}. Initial assessment shows patient is stable. Medication administered during current shift for symptom management.`,

      background: `${diagnosis}. Patient has no significant past medical history noted. No known allergies reported.`,

      assessment: `Patient condition stable with ongoing monitoring. Vital signs within acceptable range. No significant events reported during this period.`,

      recommendation: `Continue current medication regimen as prescribed, maintain regular monitoring per protocol, ensure adequate hydration, reassess in 4-6 hours.`,
    };

    res.status(200).json({
      message: "Reference summary generated successfully",
      reference: referenceSummary,
    });
  } catch (error) {
    console.error("Error generating reference summary:", error);
    res.status(500).json({ error: "Failed to generate reference summary" });
  }
});

export default router;
