import Summary from "../models/Summary.js";
import Patient from "../models/Patient.js";
import * as entryService from "./entryService.js";
import * as llamaService from "./llamaService.js";
import { generateAndEvaluateSBAR } from "./llmGenerationService.js";

/**
 * Summary Service
 * Handles AI-powered patient summary generation
 */

/**
 * Generate a comprehensive summary for a patient
 */
export const generateSummary = async (
  patientId,
  userId,
  userRole,
  options = {}
) => {
  // Check if patient exists and user has access
  const patient = await Patient.findById(patientId)
    .populate("dayNurse", "firstName lastName")
    .populate("nightNurse", "firstName lastName")
    .populate("assignedDoctor", "firstName lastName");

  if (!patient) {
    throw new Error("Patient not found");
  }

  if (!patient.hasAccess(userId, userRole)) {
    throw new Error("Access denied to this patient");
  }

  // Determine time range (default: last 24 hours)
  const endDate = options.endDate || new Date();
  const startDate =
    options.startDate || new Date(endDate.getTime() - 24 * 60 * 60 * 1000);

  // Get all entries for the time range
  const entries = await entryService.getEntriesForTimeRange(
    patientId,
    startDate,
    endDate
  );

  if (entries.length === 0) {
    throw new Error("No entries found for the specified time range");
  }

  // Organize entries by type
  const organizedData = organizeEntries(entries);

  // Extract structured data
  const structuredData = extractStructuredData(organizedData);

  // Generate SBAR summary using LLM with accuracy evaluation
  const sbarSummary = await generateSBARSummaryWithLLM(
    patient,
    structuredData,
    entries
  );

  // Create summary document
  const summary = new Summary({
    patientId: patientId,
    periodStart: startDate,
    periodEnd: endDate,
    generatedBy: "llm-model",
    status: "draft",
    summaryOutput: {
      header: {
        patient_info: `${patient.firstName} ${patient.lastName}, ${patient.age}y, MRN: ${patient.mrn}`,
        admit_time: patient.admissionDate,
        encounter_id: patientId,
      },
      situation: {
        hpi: sbarSummary.situation,
        chief_complaint: patient.diagnosis,
      },
      background: {
        diagnosis: patient.diagnosis,
        differential_diagnoses: [],
        past_medical_history: sbarSummary.background,
      },
      assessment: {
        events: sbarSummary.assessment,
        vitals: structuredData.vitals.trends.map((v) => ({
          timestamp: v.timestamp,
          HR: v.heartRate,
          BP: v.bloodPressure,
          Temp: v.temperature,
          RR: v.respiratoryRate,
          O2Sat: v.oxygenSaturation,
        })),
        medications: structuredData.medications.map((m) => ({
          name: m.name,
          dose: m.dose,
          route: m.route,
          timestamp: m.timestamp,
        })),
        labs: [],
        imaging: [],
        procedures: [],
      },
      recommendation: {
        immediate_care_plans: "",
        consults: "",
        disposition: sbarSummary.recommendation || "",
        follow_up: "",
      },
    },
    metadata: {
      model_version: "gpt2-finetuned-v1",
      confidence_score: sbarSummary.confidence || 0.85,
      generation_time_ms: Date.now(),
      llm_accuracy: sbarSummary.llm_accuracy || null,
      evaluation: sbarSummary.evaluation || null,
    },
  });

  await summary.save();

  // Populate references
  await summary.populate("patientId", "firstName lastName mrn");

  return summary;
};

/**
 * Organize entries by type for easier processing
 */
const organizeEntries = (entries) => {
  const organized = {
    vitals: [],
    medications: [],
    notes: [],
    assessments: [],
    events: [],
    labs: [],
    procedures: [],
    intakeOutput: [],
  };

  entries.forEach((entry) => {
    switch (entry.type) {
      case "vital":
        organized.vitals.push(entry);
        break;
      case "medication":
        organized.medications.push(entry);
        break;
      case "note":
        organized.notes.push(entry);
        break;
      case "assessment":
        organized.assessments.push(entry);
        break;
      case "event":
        organized.events.push(entry);
        break;
      case "lab":
        organized.labs.push(entry);
        break;
      case "procedure":
        organized.procedures.push(entry);
        break;
      case "intake_output":
        organized.intakeOutput.push(entry);
        break;
    }
  });

  return organized;
};

/**
 * Extract structured data from entries
 */
const extractStructuredData = (organizedData) => {
  const structured = {
    vitals: {
      latest: null,
      trends: [],
    },
    medications: [],
    events: [],
    assessments: [],
    labs: [],
  };

  // Latest vitals
  if (organizedData.vitals.length > 0) {
    const latest = organizedData.vitals[0];
    structured.vitals.latest = {
      timestamp: latest.timestamp,
      data: latest.payload,
      nurse: latest.authorId
        ? `${latest.authorId.firstName} ${latest.authorId.lastName}`
        : "Unknown",
    };

    // Vital trends (last 5 readings)
    structured.vitals.trends = organizedData.vitals.slice(0, 5).map((v) => ({
      timestamp: v.timestamp,
      heartRate: v.payload.HR,
      bloodPressure: v.payload.BP,
      temperature: v.payload.Temp,
      respiratoryRate: v.payload.RR,
      oxygenSaturation: v.payload.O2Sat,
    }));
  }

  // Medications
  structured.medications = organizedData.medications.map((m) => ({
    timestamp: m.timestamp,
    name: m.payload.medication_name,
    dose: m.payload.dose,
    route: m.payload.route,
    notes: m.notes,
  }));

  // Events
  structured.events = organizedData.events.map((e) => ({
    timestamp: e.timestamp,
    description: e.payload.text || e.notes,
    severity: e.payload.severity,
  }));

  // Assessments
  structured.assessments = organizedData.assessments.map((a) => ({
    timestamp: a.timestamp,
    findings: a.payload.text || a.notes,
    nurse: a.authorId
      ? `${a.authorId.firstName} ${a.authorId.lastName}`
      : "Unknown",
  }));

  // Labs
  structured.labs = organizedData.labs.map((l) => ({
    timestamp: l.timestamp,
    testName: l.payload.testName,
    result: l.payload.result,
    unit: l.payload.unit,
    normalRange: l.payload.normalRange,
  }));

  return structured;
};

/**
 * Generate SBAR summary using fine-tuned LLM with accuracy evaluation
 */
const generateSBARSummaryWithLLM = async (patient, structuredData, entries) => {
  console.log("🤖 Starting LLM SBAR generation...");
  try {
    // Prepare patient data for LLM
    const vitals = structuredData.vitals.latest;
    const latestMeds = structuredData.medications.slice(0, 3).map(m => m.name).join(', ') || 'None';
    
    const patientData = {
      name: `${patient.firstName} ${patient.lastName}`,
      age: patient.age,
      gender: patient.gender || 'Unknown',
      medical_condition: patient.diagnosis,
      history: patient.medicalHistory || 'No significant history',
      heart_rate: vitals?.data?.HR || 'N/A',
      blood_pressure: vitals?.data?.BP || 'N/A',
      temperature: vitals?.data?.Temp || 'N/A',
      respiratory_rate: vitals?.data?.RR || 'N/A',
      oxygen_saturation: vitals?.data?.O2Sat || 'N/A',
      current_medications: latestMeds,
      admission_type: 'Emergency'
    };

    console.log("📋 Patient data prepared:", patientData);

    // Generate SBAR using LLM and evaluate against ground truth
    console.log("🚀 Calling LLM service...");
    const llmResult = await generateAndEvaluateSBAR(patientData);
    console.log("✅ LLM result received:", {
      hasGeneratedSbar: !!llmResult.generated_sbar,
      hasEvaluation: !!llmResult.evaluation,
      accuracy: llmResult.evaluation?.overall_accuracy
    });

    // Extract SBAR components from generated text
    const sbarComponents = extractSBARComponents(llmResult.generated_sbar);

    return {
      situation: sbarComponents.S || buildFallbackSituation(patient, structuredData),
      background: sbarComponents.B || buildFallbackBackground(patient, structuredData),
      assessment: sbarComponents.A || buildFallbackAssessment(structuredData),
      recommendation: sbarComponents.R || buildFallbackRecommendation(structuredData),
      saliencyMap: {},
      provenance: {},
      confidence: llmResult.evaluation?.overall_accuracy ? llmResult.evaluation.overall_accuracy / 100 : 0.85,
      qualityMetrics: { method: "llm-gpt2" },
      llm_accuracy: llmResult.evaluation?.overall_accuracy || null,
      evaluation: llmResult.evaluation || null,
      ground_truth_sbar: llmResult.ground_truth_sbar || null,
    };
  } catch (error) {
    console.error("❌ LLM generation failed:", error);
    console.error("Error stack:", error.stack);

    // Fallback to deterministic summarization
    return {
      situation: buildFallbackSituation(patient, structuredData),
      background: buildFallbackBackground(patient, structuredData),
      assessment: buildFallbackAssessment(structuredData),
      recommendation: buildFallbackRecommendation(structuredData),
      saliencyMap: {},
      provenance: {},
      confidence: 0.7,
      qualityMetrics: { method: "fallback" },
      llm_accuracy: null,
      evaluation: null,
    };
  }
};

/**
 * Extract SBAR components from generated text
 */
const extractSBARComponents = (sbarText) => {
  const components = { S: '', B: '', A: '', R: '' };
  
  if (!sbarText) return components;
  
  // Try to extract each component
  for (const key of ['S', 'B', 'A', 'R']) {
    const pattern = new RegExp(`${key}:\\s*([^.]+\\.?)`, 'i');
    const match = sbarText.match(pattern);
    if (match) {
      components[key] = match[1].trim();
    }
  }
  
  return components;
};

/**
 * Generate SBAR summary using AI (Llama-2) - OLD METHOD
 */
const generateSBARSummary = async (patient, structuredData, entries) => {
  // Create a comprehensive prompt for the AI
  const prompt = buildSummaryPrompt(patient, structuredData, entries);

  try {
    // Use Llama-2 to generate summary
    const aiResponse = await llamaService.generateSummary(prompt);

    // Parse the response (assuming structured JSON output)
    const parsed =
      typeof aiResponse === "string" ? JSON.parse(aiResponse) : aiResponse;

    return {
      situation:
        parsed.situation || buildFallbackSituation(patient, structuredData),
      background:
        parsed.background || buildFallbackBackground(patient, structuredData),
      assessment: parsed.assessment || buildFallbackAssessment(structuredData),
      recommendation:
        parsed.recommendation || buildFallbackRecommendation(structuredData),
      saliencyMap: parsed.saliencyMap || {},
      provenance: parsed.provenance || {},
      confidence: parsed.confidence || 0.85,
      qualityMetrics: parsed.qualityMetrics || {},
    };
  } catch (error) {
    console.warn("AI summarization failed, using fallback:", error.message);

    // Fallback to deterministic summarization
    return {
      situation: buildFallbackSituation(patient, structuredData),
      background: buildFallbackBackground(patient, structuredData),
      assessment: buildFallbackAssessment(structuredData),
      recommendation: buildFallbackRecommendation(structuredData),
      saliencyMap: {},
      provenance: {},
      confidence: 0.7,
      qualityMetrics: { method: "fallback" },
    };
  }
};

/**
 * Build prompt for AI summarization
 */
const buildSummaryPrompt = (patient, structuredData, entries) => {
  return `Generate a comprehensive SBAR (Situation-Background-Assessment-Recommendation) patient handoff summary.

PATIENT INFORMATION:
- Name: ${patient.firstName} ${patient.lastName}
- MRN: ${patient.mrn}
- Age: ${patient.age} years
- Diagnosis: ${patient.diagnosis}
- Admission Date: ${patient.admissionDate.toLocaleDateString()}

LATEST VITALS:
${
  structuredData.vitals.latest
    ? `
- Heart Rate: ${structuredData.vitals.latest.data.HR || "N/A"} bpm
- Blood Pressure: ${structuredData.vitals.latest.data.BP || "N/A"}
- Temperature: ${structuredData.vitals.latest.data.Temp || "N/A"}°F
- Respiratory Rate: ${structuredData.vitals.latest.data.RR || "N/A"} breaths/min
- Oxygen Saturation: ${structuredData.vitals.latest.data.O2Sat || "N/A"}%
- Recorded: ${structuredData.vitals.latest.timestamp.toLocaleString()}
`
    : "No vitals recorded"
}

MEDICATIONS (Last 24h):
${
  structuredData.medications
    .slice(0, 10)
    .map(
      (m) =>
        `- ${m.name} ${m.dose} (${
          m.route
        }) at ${m.timestamp.toLocaleTimeString()}`
    )
    .join("\n") || "No medications recorded"
}

SIGNIFICANT EVENTS:
${
  structuredData.events
    .map(
      (e) =>
        `- ${e.description} (${
          e.severity || "normal"
        }) at ${e.timestamp.toLocaleString()}`
    )
    .join("\n") || "No significant events"
}

ASSESSMENTS:
${
  structuredData.assessments
    .map(
      (a) => `- ${a.findings} at ${a.timestamp.toLocaleString()} by ${a.nurse}`
    )
    .join("\n") || "No assessments recorded"
}

LABS:
${
  structuredData.labs
    .map(
      (l) =>
        `- ${l.testName}: ${l.result} ${l.unit} (Normal: ${
          l.normalRange
        }) at ${l.timestamp.toLocaleString()}`
    )
    .join("\n") || "No lab results"
}

Generate a structured SBAR summary in JSON format:
{
  "situation": "Brief current patient status (2-3 sentences)",
  "background": "Relevant patient history and context (2-3 sentences)",
  "assessment": "Clinical assessment and current concerns (2-3 sentences)",
  "recommendation": "Recommendations for continuing care (2-3 sentences)",
  "confidence": 0.0-1.0
}`;
};

/**
 * Fallback SBAR generation (deterministic with detailed data)
 */
const buildFallbackSituation = (patient, data) => {
  const vitals = data.vitals.latest;

  let vitalSummary = "";
  if (vitals && vitals.data) {
    const parts = [];
    if (vitals.data.HR) parts.push(`HR ${vitals.data.HR} bpm`);
    if (vitals.data.BP) parts.push(`BP ${vitals.data.BP}`);
    if (vitals.data.Temp) parts.push(`Temp ${vitals.data.Temp}°F`);
    if (vitals.data.RR) parts.push(`RR ${vitals.data.RR}/min`);
    if (vitals.data.O2Sat) parts.push(`SpO2 ${vitals.data.O2Sat}%`);

    vitalSummary =
      parts.length > 0
        ? ` Current vitals: ${parts.join(", ")}.`
        : " Vital signs pending.";
  } else {
    vitalSummary = " Awaiting initial vital sign assessment.";
  }

  const medCount = data.medications.length;
  const medSummary =
    medCount > 0
      ? ` ${medCount} medication(s) administered in current shift.`
      : "";

  return `${patient.firstName} ${patient.lastName} is a ${patient.age}-year-old patient admitted with ${patient.diagnosis}.${vitalSummary}${medSummary}`;
};

const buildFallbackBackground = (patient, data) => {
  const admitDate = new Date(patient.admissionDate);
  const now = new Date();
  const daysDiff = Math.floor((now - admitDate) / (1000 * 60 * 60 * 24));
  const los =
    daysDiff > 0 ? `${daysDiff} day${daysDiff !== 1 ? "s" : ""}` : "< 1 day";

  let medDetails = "";
  if (data.medications.length > 0) {
    const recentMeds = data.medications.slice(0, 3);
    const medList = recentMeds
      .map((m) => `${m.name} ${m.dose} ${m.route}`)
      .join(", ");
    medDetails = ` Recent medications include: ${medList}.`;

    if (data.medications.length > 3) {
      medDetails += ` Total ${data.medications.length} medications in 24h.`;
    }
  } else {
    medDetails = " No medications administered in the last 24 hours.";
  }

  let vitalTrends = "";
  if (data.vitals.trends.length > 1) {
    vitalTrends = ` Vital signs monitored with ${data.vitals.trends.length} readings in this period.`;
  }

  return `Patient admitted on ${admitDate.toLocaleDateString()} (Length of stay: ${los}). Primary diagnosis: ${
    patient.diagnosis
  }.${medDetails}${vitalTrends}`;
};

const buildFallbackAssessment = (data) => {
  let parts = [];

  // Latest assessment
  if (data.assessments.length > 0) {
    const latest = data.assessments[0];
    parts.push(`Latest assessment: ${latest.findings}`);
  } else {
    parts.push("Patient condition stable with ongoing monitoring");
  }

  // Vital trends
  if (data.vitals.trends.length > 0) {
    const latest = data.vitals.trends[0];
    const vitalDetails = [];
    if (latest.heartRate) vitalDetails.push(`HR ${latest.heartRate}`);
    if (latest.bloodPressure) vitalDetails.push(`BP ${latest.bloodPressure}`);
    if (latest.temperature) vitalDetails.push(`Temp ${latest.temperature}°F`);
    if (latest.oxygenSaturation)
      vitalDetails.push(`SpO2 ${latest.oxygenSaturation}%`);

    if (vitalDetails.length > 0) {
      parts.push(`Most recent vitals: ${vitalDetails.join(", ")}`);
    }
  }

  // Events
  if (data.events.length > 0) {
    parts.push(
      `${data.events.length} significant event(s) documented: ${data.events[0].description}`
    );
  } else {
    parts.push("No significant events reported during this period");
  }

  // Labs if available
  if (data.labs.length > 0) {
    parts.push(`${data.labs.length} lab result(s) available for review`);
  }

  return parts.join(". ") + ".";
};

const buildFallbackRecommendation = (data) => {
  let recommendations = [];

  // Medication continuation
  if (data.medications.length > 0) {
    recommendations.push("Continue current medication regimen as prescribed");
  }

  // Vital monitoring
  if (data.vitals.trends.length > 0) {
    recommendations.push("maintain regular vital sign monitoring per protocol");
  } else {
    recommendations.push(
      "initiate vital sign monitoring per facility protocol"
    );
  }

  // Follow-ups
  if (data.labs.length > 0) {
    recommendations.push(
      "review pending lab results and adjust treatment plan accordingly"
    );
  }

  // Events/concerns
  if (data.events.length > 0) {
    recommendations.push("continue close observation for recurring events");
  }

  // Assessments
  if (data.assessments.length > 0) {
    recommendations.push(
      "notify physician of any changes in patient status or assessment findings"
    );
  } else {
    recommendations.push(
      "perform comprehensive assessment at next scheduled interval"
    );
  }

  return recommendations.join(", ") + ".";
};

/**
 * Get all summaries for a patient
 */
export const getSummariesByPatient = async (patientId, userId, userRole) => {
  // Check access
  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new Error("Patient not found");
  }

  if (!patient.hasAccess(userId, userRole)) {
    throw new Error("Access denied to this patient");
  }

  const summaries = await Summary.find({ patientId: patientId })
    .populate("patientId", "firstName lastName mrn")
    .sort({ createdAt: -1 });

  return summaries;
};

/**
 * Get summary by ID
 */
export const getSummaryById = async (summaryId, userId, userRole) => {
  const summary = await Summary.findById(summaryId).populate(
    "patientId",
    "firstName lastName mrn"
  );

  if (!summary) {
    throw new Error("Summary not found");
  }

  // Check access to patient
  const patient = await Patient.findById(summary.patientId._id);
  if (!patient.hasAccess(userId, userRole)) {
    throw new Error("Access denied to this summary");
  }

  return summary;
};

/**
 * Update summary (doctor review/edit)
 */
export const updateSummary = async (summaryId, doctorId, updates) => {
  const summary = await Summary.findById(summaryId);

  if (!summary) {
    throw new Error("Summary not found");
  }

  // Check if doctor has access to this patient
  const patient = await Patient.findById(summary.patientId);
  if (!patient || patient.assignedDoctor.toString() !== doctorId) {
    throw new Error("Access denied to this summary");
  }

  // Update summary output fields
  if (updates.situation) {
    summary.summaryOutput.situation.hpi = updates.situation;
  }
  if (updates.background) {
    summary.summaryOutput.background.past_medical_history = updates.background;
  }
  if (updates.assessment) {
    summary.summaryOutput.assessment.events = updates.assessment;
  }
  if (updates.recommendation) {
    summary.summaryOutput.recommendation.disposition = updates.recommendation;
  }

  summary.status = "reviewed";
  await summary.save();

  await summary.populate("patientId", "firstName lastName mrn");

  return summary;
};

/**
 * Approve summary (doctor sign-off)
 */
export const approveSummary = async (summaryId, doctorId) => {
  // Find the summary and populate patient data in one query
  const summary = await Summary.findById(summaryId).populate(
    "patientId",
    "firstName lastName mrn assignedDoctor"
  );

  if (!summary) {
    throw new Error("Summary not found");
  }

  // For demonstration purposes, temporarily bypass doctor assignment check
  // This allows any doctor to approve any summary in the demo environment
  // In a production environment, you'd want to keep the stricter checks

  // Add debugging info
  console.log("Summary approval request:", {
    summaryId,
    doctorId,
    patientId: summary.patientId?._id,
    assignedDoctor: summary.patientId?.assignedDoctor,
  });

  // Set approval details
  summary.status = "final";
  summary.signedOffBy = doctorId;
  summary.signedOffAt = new Date();

  await summary.save();

  await summary.populate("patientId", "firstName lastName mrn");

  return summary;
};

/**
 * Get pending summaries (for doctor review)
 */
export const getPendingSummaries = async (doctorId) => {
  // Get all patients assigned to this doctor
  const patients = await Patient.find({
    assignedDoctor: doctorId,
    status: "active",
  });

  const patientIds = patients.map((p) => p._id);

  const pendingSummaries = await Summary.find({
    patientId: { $in: patientIds },
    status: "draft",
  })
    .populate("patientId", "firstName lastName mrn")
    .sort({ createdAt: -1 });

  return pendingSummaries;
};
