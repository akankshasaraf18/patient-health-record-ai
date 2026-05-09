import {
  initializeRobertaModel,
  filterSalientSentences,
} from "../../llm/services/robertaService.js";
import {
  initializeLlamaModel,
  generateAbstractiveSummary,
} from "../../llm/services/llamaService.js";
import HandoffSummary from "../models/handoffSummary.js";
import EHRSourceNote from "../../../models/ehrSourceNote.js";
import mongoose from "mongoose";

// Initialize models
let robertaSession = null;
let llamaModel = null;
let modelsInitialized = false;

// Initialize models on service startup
const initializeModels = async () => {
  try {
    robertaSession = await initializeRobertaModel();
    llamaModel = await initializeLlamaModel();
    modelsInitialized = true;
    console.log("✓ LLM models initialized successfully");
  } catch (error) {
    console.warn(
      "⚠ Warning: LLM models could not be initialized:",
      error.message
    );
    console.warn(
      "⚠ The server will run, but AI-powered handoff generation will not be available."
    );
    console.warn(
      "⚠ Please ensure model files are placed in the correct location:"
    );
    console.warn("  - RoBERTa: backend/models/roberta-saliency.onnx");
    console.warn("  - Llama-2: backend/models/llama2-7b.gguf");
    modelsInitialized = false;
  }
};

// Call initialization (in a real app, this would be managed better)
initializeModels().catch(console.error);

// Process EHR notes to extract structured data
export const extractStructuredData = async (sourceNotes) => {
  // This function would implement rule-based extraction for:
  // - Vitals (HR, BP, RR, Temp, O2 Sat)
  // - Labs (CBC, BMP, etc.)
  // - Medications
  // - Orders

  // Simplified implementation for demonstration
  const vitalsAndMetrics = [];

  // Example pattern matching for vitals (simplified)
  const vitalPatterns = {
    HR: /HR:?\s*(\d+)/i,
    BP: /BP:?\s*(\d+)\/(\d+)/i,
    Temp: /Temp:?\s*([\d.]+)/i,
    RR: /RR:?\s*(\d+)/i,
    O2: /O2:?\s*(\d+)%/i,
  };

  sourceNotes.forEach((note) => {
    for (const [name, pattern] of Object.entries(vitalPatterns)) {
      const match = note.content.match(pattern);
      if (match) {
        vitalsAndMetrics.push({
          category: "Vitals",
          name,
          value: match[1], // For BP, this would need to be modified
          unit: name === "Temp" ? "°C" : name === "O2" ? "%" : "bpm",
          timestamp: note.creationTimestamp,
        });
      }
    }
  });

  return vitalsAndMetrics;
};

// Map LLM output to SBAR structure
export const mapToSBARFormat = (llmOutput, patientInfo, vitalsAndMetrics) => {
  // Create SBAR structure from LLM output and extracted data
  return {
    situation: `${patientInfo.name}, ${patientInfo.age}y ${patientInfo.gender}, MRN: ${patientInfo.mrn}. ${llmOutput.HPI}`,
    background: llmOutput.DifferentialDiagnoses,
    assessment: `
      ${llmOutput.InEDEvents}
      
      Vitals: ${vitalsAndMetrics
        .filter((item) => item.category === "Vitals")
        .map((v) => `${v.name}: ${v.value}${v.unit}`)
        .join(", ")}
      
      Labs: ${vitalsAndMetrics
        .filter((item) => item.category === "Labs")
        .map((l) => `${l.name}: ${l.value} ${l.unit}`)
        .join(", ")}
    `,
    recommendation: `${llmOutput.ImmediateCarePlans}\n\nDisposition: ${llmOutput.Disposition}`,
  };
};

// Generate a complete handoff summary
export const generateSummary = async (
  encounterId,
  shiftType,
  sourceNoteIds
) => {
  try {
    // Check if models are available
    if (!modelsInitialized || !robertaSession || !llamaModel) {
      throw new Error(
        "AI models are not available. Please ensure model files are properly installed."
      );
    }

    // Validate source note IDs
    const validSourceNoteIds = sourceNoteIds.filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );

    // Retrieve source notes
    const sourceNotes = await EHRSourceNote.find({
      _id: { $in: validSourceNoteIds },
      encounterId,
    })
      .sort({ creationTimestamp: -1 })
      .exec();

    if (!sourceNotes.length) {
      throw new Error("No valid source notes found");
    }

    // Extract patient info (simplified)
    const patientInfo = {
      name: "Patient Name", // In a real app, this would be extracted from the encounter
      age: "65",
      gender: "M",
      mrn: "12345678",
    };

    // Concatenate note contents
    const allText = sourceNotes.map((note) => note.content).join("\n\n");

    // Step 1: Saliency filtering using RoBERTa
    const salientText = await filterSalientSentences(robertaSession, allText);

    // Step 2: Generate abstractive summary using Llama-2
    const llmOutput = await generateAbstractiveSummary(salientText);

    // Step 3: Extract structured data
    const vitalsAndMetrics = await extractStructuredData(sourceNotes);

    // Step 4: Map to SBAR format
    const sbarContent = mapToSBARFormat(
      llmOutput,
      patientInfo,
      vitalsAndMetrics
    );

    // Create and save handoff summary document
    const handoffSummary = new HandoffSummary({
      encounterId,
      shiftType,
      sourceNotesRefs: validSourceNoteIds,
      summaryOutput: sbarContent,
      vitalsAndMetrics,
      nurseReviewStatus: "Draft",
    });

    await handoffSummary.save();

    return handoffSummary;
  } catch (error) {
    console.error("Error generating summary:", error);
    throw error;
  }
};
