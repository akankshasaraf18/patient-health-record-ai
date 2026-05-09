import express from "express";
import Summary from "../models/Summary.js";
import {
  extractSbarComponent,
  calculateJaccardSimilarity,
} from "../utils/sbarEvaluation.js";

const router = express.Router();

/**
 * GET /api/debug/sbar/:id
 * Debug endpoint to analyze why some SBAR components are getting 0% accuracy
 */
router.get("/sbar/:id", async (req, res) => {
  try {
    const summaryId = req.params.id;

    // Get the summary
    const summary = await Summary.findById(summaryId);
    if (!summary) {
      return res.status(404).json({ error: "Summary not found" });
    }

    // Get ground truth data
    const groundTruthData = [
      {
        id: 1,
        patient_name: "Akansha Patient",
        age: 20,
        diagnosis: "Community-acquired pneumonia, moderate severity",
        summary: `Situation: 20-year-old patient admitted with Community-acquired pneumonia of moderate severity. Initial assessment shows patient has fever, productive cough and mild respiratory distress. Recently administered medication for symptom management.
        
        Background: Community-acquired pneumonia, moderate severity. No significant past medical history. No known allergies. Admitted for respiratory support and antibiotic therapy.
        
        Assessment: Patient condition stable but requires monitoring for respiratory status. Vital signs within acceptable range with oxygen saturation at 94%. Patient showing clinical signs consistent with moderate pneumonia. No significant adverse events reported in current shift.
        
        Recommendation: Continue current medication regimen as prescribed, maintain regular vital sign monitoring per protocol, encourage deep breathing exercises, ensure adequate hydration, reassess in 4-6 hours, adjust oxygen therapy as needed.`,
      },
    ];

    // Extract ground truth components
    const groundTruth = groundTruthData[0];
    const gtSituation = extractSbarComponent(groundTruth.summary, "S");
    const gtBackground = extractSbarComponent(groundTruth.summary, "B");
    const gtAssessment = extractSbarComponent(groundTruth.summary, "A");
    const gtRecommendation = extractSbarComponent(groundTruth.summary, "R");

    // Enhanced helper to extract all possible fields for each component
    const extractAllComponentText = (summary, component) => {
      if (!summary?.summaryOutput) return "";

      switch (component) {
        case "situation":
          return [
            summary.summaryOutput.situation?.hpi,
            summary.summaryOutput.situation?.chief_complaint,
          ]
            .filter(Boolean)
            .join(" ");

        case "background":
          return [
            summary.summaryOutput.background?.past_medical_history,
            summary.summaryOutput.background?.diagnosis,
            summary.summaryOutput.background?.differential_diagnoses?.join(" "),
          ]
            .filter(Boolean)
            .join(" ");

        case "assessment":
          return [summary.summaryOutput.assessment?.events]
            .filter(Boolean)
            .join(" ");

        case "recommendation":
          return [
            summary.summaryOutput.recommendation?.disposition,
            summary.summaryOutput.recommendation?.immediate_care_plans,
            summary.summaryOutput.recommendation?.consults,
            summary.summaryOutput.recommendation?.follow_up,
          ]
            .filter(Boolean)
            .join(" ");

        default:
          return "";
      }
    };

    // Extract summary components using the enhanced helper
    const genSituation = extractAllComponentText(summary, "situation");
    const genBackground = extractAllComponentText(summary, "background");
    const genAssessment = extractAllComponentText(summary, "assessment");
    const genRecommendation = extractAllComponentText(
      summary,
      "recommendation"
    );

    // Calculate similarities
    const situationScore = calculateJaccardSimilarity(
      gtSituation,
      genSituation
    );
    const backgroundScore = calculateJaccardSimilarity(
      gtBackground,
      genBackground
    );
    const assessmentScore = calculateJaccardSimilarity(
      gtAssessment,
      genAssessment
    );
    const recommendationScore = calculateJaccardSimilarity(
      gtRecommendation,
      genRecommendation
    );

    /**
     * Find common words between two text strings
     */
    const findCommonWords = (textA, textB) => {
      if (!textA || !textB) return [];

      const normalize = (text) => {
        return text
          .toLowerCase()
          .replace(/[^\w\s]/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      };

      const wordsA = normalize(textA).split(" ");
      const wordsB = normalize(textB).split(" ");

      const commonWords = wordsA.filter(
        (word) =>
          word.length > 3 && // Only include significant words
          wordsB.includes(word)
      );

      return commonWords;
    };

    // Create detailed analysis
    const analysis = {
      groundTruth: {
        situation: {
          text: gtSituation,
          wordCount: gtSituation.split(/\s+/).filter((w) => w.length > 0)
            .length,
        },
        background: {
          text: gtBackground,
          wordCount: gtBackground.split(/\s+/).filter((w) => w.length > 0)
            .length,
        },
        assessment: {
          text: gtAssessment,
          wordCount: gtAssessment.split(/\s+/).filter((w) => w.length > 0)
            .length,
        },
        recommendation: {
          text: gtRecommendation,
          wordCount: gtRecommendation.split(/\s+/).filter((w) => w.length > 0)
            .length,
        },
      },
      generated: {
        situation: {
          text: genSituation,
          wordCount: genSituation.split(/\s+/).filter((w) => w.length > 0)
            .length,
          source: "situation.hpi or situation.chief_complaint",
        },
        background: {
          text: genBackground,
          wordCount: genBackground.split(/\s+/).filter((w) => w.length > 0)
            .length,
          source: "background.past_medical_history or background.diagnosis",
        },
        assessment: {
          text: genAssessment,
          wordCount: genAssessment.split(/\s+/).filter((w) => w.length > 0)
            .length,
          source: "assessment.events",
        },
        recommendation: {
          text: genRecommendation,
          wordCount: genRecommendation.split(/\s+/).filter((w) => w.length > 0)
            .length,
          source:
            "recommendation.disposition or recommendation.immediate_care_plans",
        },
      },
      scores: {
        situation: (situationScore * 100).toFixed(2) + "%",
        background: (backgroundScore * 100).toFixed(2) + "%",
        assessment: (assessmentScore * 100).toFixed(2) + "%",
        recommendation: (recommendationScore * 100).toFixed(2) + "%",
      },
      commonWords: {
        situation: findCommonWords(gtSituation, genSituation),
        background: findCommonWords(gtBackground, genBackground),
        assessment: findCommonWords(gtAssessment, genAssessment),
        recommendation: findCommonWords(gtRecommendation, genRecommendation),
      },
    };

    // Add LLM evaluation data if available
    if (summary.metadata && summary.metadata.evaluation) {
      analysis.evaluation = summary.metadata.evaluation;
    }

    res.status(200).json({
      message: "SBAR debug analysis complete",
      analysis,
    });
  } catch (error) {
    console.error("SBAR debug error:", error);
    res.status(500).json({ error: "Failed to analyze SBAR components" });
  }
});

export default router;
