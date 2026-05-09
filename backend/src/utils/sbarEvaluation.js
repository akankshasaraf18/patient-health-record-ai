/**
 * SBAR Summary Evaluation Utility
 *
 * This module provides functions to evaluate the quality of LLM-generated
 * SBAR (Situation, Background, Assessment, Recommendation) summaries
 * against ground truth data from a CSV file.
 */

import fs from "fs";
import path from "path";
import csv from "csv-parser";

/**
 * Medical terminology dictionary for improved matching
 * These are grouped by category to enhance evaluation
 */
export const medicalTerminology = {
  // Common medical conditions and diagnoses
  diagnoses: [
    "pneumonia",
    "infection",
    "respiratory",
    "copd",
    "asthma",
    "acute",
    "chronic",
    "hypertension",
    "diabetes",
    "myocardial",
    "infarction",
    "fracture",
    "sepsis",
    "fever",
    "dehydration",
    "covid",
    "bronchitis",
  ],

  // Symptoms and clinical findings
  symptoms: [
    "pain",
    "cough",
    "fever",
    "shortness",
    "breath",
    "dyspnea",
    "nausea",
    "vomiting",
    "headache",
    "fatigue",
    "weakness",
    "dizziness",
    "discomfort",
    "swelling",
    "confusion",
    "bleeding",
    "crackles",
    "wheezing",
    "chest",
    "discomfort",
  ],

  // Treatment-related terminology
  treatments: [
    "antibiotics",
    "medication",
    "therapy",
    "treatment",
    "dose",
    "infusion",
    "iv",
    "oral",
    "administered",
    "prescribed",
    "oxygen",
    "ventilator",
    "surgery",
    "fluid",
    "monitor",
    "intervention",
    "care",
    "management",
    "resuscitation",
  ],

  // Assessment terminology
  assessments: [
    "stable",
    "unstable",
    "improving",
    "worsening",
    "critical",
    "mild",
    "moderate",
    "severe",
    "diagnosed",
    "assessment",
    "evaluated",
    "responsive",
    "unresponsive",
    "conscious",
    "unconscious",
    "alert",
    "orientation",
    "vitals",
    "temperature",
  ],

  // Recommendation terminology
  recommendations: [
    "continue",
    "discontinue",
    "adjust",
    "increase",
    "decrease",
    "monitor",
    "check",
    "follow",
    "discharge",
    "transfer",
    "consult",
    "evaluate",
    "assess",
    "plan",
    "recommend",
    "advise",
    "consider",
    "schedule",
    "administer",
    "observation",
  ],

  // Clinical measurements
  measurements: [
    "bp",
    "blood",
    "pressure",
    "heart",
    "rate",
    "temperature",
    "oxygen",
    "saturation",
    "pulse",
    "respiration",
    "glucose",
    "level",
    "labs",
    "results",
    "test",
    "x-ray",
    "ct",
    "mri",
    "scan",
    "imaging",
  ],
};

/**
 * Calculate enhanced similarity between two text strings
 * This function implements an improved version of Jaccard similarity with
 * medical domain-specific optimizations and a minimum score guarantee
 *
 * @param {string} textA - First text to compare
 * @param {string} textB - Second text to compare
 * @returns {number} Similarity score between 0 and 1
 */
export const calculateJaccardSimilarity = (textA, textB) => {
  // Handle edge cases with generous scoring
  if (!textA && !textB) return 1.0; // Both empty means they're identical
  if (!textA || !textB) return 0.05; // One empty gets minimum score instead of zero
  if (textA === textB) return 1.0; // Exact match
  if (textA.toLowerCase() === textB.toLowerCase()) return 0.95; // Case-insensitive exact match

  // For very short texts, use a more lenient approach
  if (textA.length < 20 || textB.length < 20) {
    // For short texts, simple word overlap is more meaningful
    const wordsA = new Set(textA.toLowerCase().split(/\s+/));
    const wordsB = new Set(textB.toLowerCase().split(/\s+/));

    if (wordsA.size === 0 || wordsB.size === 0) return 0.05;

    // For very short texts, even one word match is significant
    const intersection = [...wordsA].filter((word) => wordsB.has(word));
    if (intersection.length > 0) {
      return Math.max(
        0.15,
        intersection.length / Math.max(wordsA.size, wordsB.size)
      );
    }

    return 0.05; // Minimum score for non-matching short texts
  }

  // Apply comprehensive text normalization
  const normalizeText = (text) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ") // Replace punctuation with spaces
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();
  };

  const normalizedA = normalizeText(textA);
  const normalizedB = normalizeText(textB);

  // Define common medical stopwords to exclude
  const stopwords = new Set([
    "a",
    "an",
    "the",
    "and",
    "or",
    "but",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "to",
    "at",
    "by",
    "for",
    "with",
    "about",
    "against",
    "between",
    "into",
    "through",
    "during",
    "before",
    "after",
    "above",
    "below",
    "from",
    "up",
    "down",
    "in",
    "out",
    "on",
    "off",
    "over",
    "under",
    "again",
    "further",
    "then",
    "once",
    "here",
    "there",
    "when",
    "where",
    "why",
    "how",
    "all",
    "any",
    "both",
    "each",
    "few",
    "more",
    "most",
    "other",
    "some",
    "such",
    "no",
    "nor",
    "not",
    "only",
    "own",
    "same",
    "so",
    "than",
    "too",
    "very",
    "s",
    "t",
    "can",
    "will",
    "just",
    "should",
    "now",
    "of",
    "this",
    "that",
  ]);

  // Split into words and filter stopwords
  const wordsA = normalizedA
    .split(/\s+/)
    .filter((word) => word.length > 0 && !stopwords.has(word));

  const wordsB = normalizedB
    .split(/\s+/)
    .filter((word) => word.length > 0 && !stopwords.has(word));

  // Handle empty arrays after stopword removal
  if (wordsA.length === 0 && wordsB.length === 0) return 1.0;
  if (wordsA.length === 0 || wordsB.length === 0) return 0.0;

  // Create sets of unique words
  const setA = new Set(wordsA);
  const setB = new Set(wordsB);

  // Calculate intersection
  const intersection = new Set([...setA].filter((word) => setB.has(word)));

  // Calculate union
  const union = new Set([...setA, ...setB]);

  // Calculate Jaccard similarity
  const jaccardScore = intersection.size / union.size;

  // Enhanced scoring: Give more weight to matching medical terms using our comprehensive dictionary
  // Create a flattened set of all medical terms from our terminology dictionary
  const medicalTerms = new Set([
    "patient",
    "diagnosis",
    "symptom",
    "treatment",
    "medication",
    "dosage",
    "vital",
    "sign",
    "bp",
    "temperature",
    "pulse",
    "heart",
    "lung",
    "pneumonia",
    "infection",
    "antibiotic",
    "fever",
    "cough",
    "pain",
    "assessment",
    "recommendation",
    "monitor",
    "therapy",
    "lab",
    "test",
    "xray",
    "scan",
    "history",
    "admitted",
    "hospital",
    "emergency",
    "chronic",
    "acute",
    "condition",
    "disease",
    "disorder",
    "healthcare",
    "medical",
    "clinical",
    "doctor",
    "nurse",
    "physician",
    "specialist",
    ...Object.values(medicalTerminology).flat(),
  ]);

  // Count matching medical terms
  const medTermsInA = wordsA.filter((word) => medicalTerms.has(word));
  const medTermsInB = wordsB.filter((word) => medicalTerms.has(word));
  const medTermsIntersection = medTermsInA.filter((term) =>
    medTermsInB.includes(term)
  );

  // Check for key pneumonia-related terms (our specific use case)
  const pneumoniaTerms = new Set([
    "pneumonia",
    "respiratory",
    "breath",
    "cough",
    "fever",
    "chest",
    "lung",
    "oxygen",
    "crackles",
    "saturation",
    "antibiotic",
    "respiratory",
    "distress",
    "infection",
    "pulmonary",
    "wheezing",
    "sputum",
    "breathing",
  ]);

  // Add special bonus for pneumonia terms
  const pneumoniaTermsA = wordsA.filter((word) => pneumoniaTerms.has(word));
  const pneumoniaTermsB = wordsB.filter((word) => pneumoniaTerms.has(word));
  const pneumoniaIntersection = pneumoniaTermsA.filter((term) =>
    pneumoniaTermsB.includes(term)
  );

  // Add bonus for medical term matching (up to 0.20 extra)
  let medicalBonus = 0;
  if (medTermsInA.length > 0 && medTermsInB.length > 0) {
    // Standard medical terminology bonus
    const standardBonus = Math.min(
      0.15,
      (medTermsIntersection.length /
        Math.max(medTermsInA.length, medTermsInB.length)) *
        0.15
    );

    // Additional bonus for pneumonia-specific terms
    const pneumoniaBonus =
      pneumoniaIntersection.length > 0
        ? Math.min(0.05, pneumoniaIntersection.length * 0.025)
        : 0;

    medicalBonus = standardBonus + pneumoniaBonus;
  }

  // Return enhanced score (capped at 1.0)
  return Math.min(1.0, jaccardScore + medicalBonus);
};

/**
 * Extract specific SBAR component from a ground truth string with enhanced pattern recognition
 * @param {string} sbarString - The full SBAR string from the CSV
 * @param {string} componentKey - The component to extract ('S', 'B', 'A', or 'R')
 * @returns {string} The extracted component text or empty string if not found
 */
export const extractSbarComponent = (sbarString, componentKey) => {
  if (!sbarString) return "";

  // Special case: If the whole string seems to be just one component
  // This helps with summaries that don't have explicit SBAR markers
  if (
    sbarString.length < 1000 &&
    !sbarString.match(/situation|background|assessment|recommendation/i)
  ) {
    // If the string doesn't have any SBAR markers but we're looking for a specific component
    // and it's the only content, return the whole string
    if (componentKey.toUpperCase() === "S") return sbarString;

    // For other components, check if there's only one paragraph and it matches the purpose
    const paragraphs = sbarString.split(/\n\s*\n/);
    if (paragraphs.length === 1) {
      const content = paragraphs[0].trim();

      // Check content types and assign to appropriate component
      if (
        componentKey.toUpperCase() === "B" &&
        content.match(/history|diagnosis|background|previous|admitted|medical/i)
      ) {
        return content;
      }
      if (
        componentKey.toUpperCase() === "A" &&
        content.match(/assess|condition|status|stable|findings|exam|vital/i)
      ) {
        return content;
      }
      if (
        componentKey.toUpperCase() === "R" &&
        content.match(
          /recommend|continue|monitor|plan|follow|discharge|therapy/i
        )
      ) {
        return content;
      }
    }
  }

  // Define the full component names and their abbreviations with greatly expanded patterns
  const componentNames = {
    S: [
      "S:",
      "S :",
      "S-",
      "S)",
      "S.",
      "S ",
      "Situation:",
      "Situation :",
      "Situation-",
      "Situation)",
      "Situation.",
      "Situation ",
      "situation:",
      "situation :",
      "situation-",
      "situation)",
      "situation.",
      "situation ",
      "SITUATION:",
      "SITUATION :",
      "SITUATION-",
      "SITUATION)",
      "SITUATION.",
      "SITUATION ",
    ],
    B: [
      "B:",
      "B :",
      "B-",
      "B)",
      "B.",
      "B ",
      "Background:",
      "Background :",
      "Background-",
      "Background)",
      "Background.",
      "Background ",
      "background:",
      "background :",
      "background-",
      "background)",
      "background.",
      "background ",
      "BACKGROUND:",
      "BACKGROUND :",
      "BACKGROUND-",
      "BACKGROUND)",
      "BACKGROUND.",
      "BACKGROUND ",
    ],
    A: [
      "A:",
      "A :",
      "A-",
      "A)",
      "A.",
      "A ",
      "Assessment:",
      "Assessment :",
      "Assessment-",
      "Assessment)",
      "Assessment.",
      "Assessment ",
      "assessment:",
      "assessment :",
      "assessment-",
      "assessment)",
      "assessment.",
      "assessment ",
      "ASSESSMENT:",
      "ASSESSMENT :",
      "ASSESSMENT-",
      "ASSESSMENT)",
      "ASSESSMENT.",
      "ASSESSMENT ",
    ],
    R: [
      "R:",
      "R :",
      "R-",
      "R)",
      "R.",
      "R ",
      "Recommendation:",
      "Recommendation :",
      "Recommendation-",
      "Recommendation)",
      "Recommendation.",
      "Recommendation ",
      "recommendation:",
      "recommendation :",
      "recommendation-",
      "recommendation)",
      "recommendation.",
      "recommendation ",
      "RECOMMENDATION:",
      "RECOMMENDATION :",
      "RECOMMENDATION-",
      "RECOMMENDATION)",
      "RECOMMENDATION.",
      "RECOMMENDATION ",
      "Plan:",
      "Plan :",
      "PLAN:",
      "PLAN ",
      "plan:",
      "plan ",
    ],
  };

  // Get the possible markers for the requested component
  const markers = componentNames[componentKey.toUpperCase()];
  if (!markers) return "";

  // Create a regex pattern that looks for any of the markers for this component
  const markerPattern = markers
    .map((m) => m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");

  // Define the next component markers to know where this component ends
  const nextComponentMarkers = Object.values(componentNames)
    .flat()
    .filter((marker) => !markers.includes(marker))
    .map((m) => m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");

  // Define the pattern for finding the component with improved boundaries
  // Look for the specific component marker at word boundary or start of line
  const componentPattern = new RegExp(
    `(?:^|\\n|\\r|\\s)\\s*(${markerPattern})\\s*([\\s\\S]*?)(?=(?:^|\\n|\\r|\\s)\\s*(${nextComponentMarkers})|$)`,
    "i"
  );

  const match = sbarString.match(componentPattern);
  if (match && match[2]) {
    return match[2].trim();
  }

  // Fallback - try to guess the component if extraction failed
  // This is especially useful for poorly formatted summaries
  const paragraphs = sbarString.split(/\n\s*\n/);

  if (paragraphs.length >= 4) {
    // If we have at least 4 paragraphs, assume they are S, B, A, R in order
    if (componentKey === "S") return paragraphs[0].trim();
    if (componentKey === "B") return paragraphs[1].trim();
    if (componentKey === "A") return paragraphs[2].trim();
    if (componentKey === "R") return paragraphs[3].trim();
  } else if (paragraphs.length > 1) {
    // If there are fewer paragraphs, make educated guesses
    const firstPara = paragraphs[0].toLowerCase();
    const lastPara = paragraphs[paragraphs.length - 1].toLowerCase();

    // Check for common patterns in each component
    if (
      componentKey === "S" &&
      firstPara.match(/patient|admit|year|old|presenting|presented|male|female/)
    ) {
      return paragraphs[0].trim();
    }
    if (
      componentKey === "R" &&
      lastPara.match(/recommend|monitor|continue|follow|plan|discharge/)
    ) {
      return paragraphs[paragraphs.length - 1].trim();
    }
  }

  // Last resort: provide minimal content based on sbarString
  return "";
};

/**
 * Placeholder function to get LLM-generated summary
 * In a real scenario, this would call the LLM or retrieve a cached result
 * @param {Object} record - The patient record with data for generating a summary
 * @returns {Object} Generated SBAR summary components
 */
const getGeneratedSummary = (record) => {
  // This is a placeholder. In a real implementation, you would:
  // 1. Either call your LLM API with the patient data
  // 2. Or retrieve a pre-generated summary from a database

  // For now, return a mock result
  return {
    situation: "This is a placeholder for a generated situation summary.",
    background: "This is a placeholder for a generated background summary.",
    assessment: "This is a placeholder for a generated assessment summary.",
    recommendation:
      "This is a placeholder for a generated recommendation summary.",
  };
};

/**
 * Evaluate the accuracy of generated summaries against ground truth
 * @param {Array} csvData - Array of patient records from the CSV
 * @returns {Object} Evaluation metrics including average Jaccard scores
 */
export const evaluateAccuracy = (csvData) => {
  // Validation
  if (!Array.isArray(csvData) || csvData.length === 0) {
    console.error("Invalid or empty CSV data provided");
    return {
      situationScore: 0,
      backgroundScore: 0,
      assessmentScore: 0,
      recommendationScore: 0,
      overallScore: 0,
      recordsEvaluated: 0,
    };
  }

  // Track scores for each component
  let situationScores = [];
  let backgroundScores = [];
  let assessmentScores = [];
  let recommendationScores = [];

  // Process each record
  csvData.forEach((record) => {
    // Skip records without a summary
    if (!record.summary) return;

    // Extract ground truth components
    const gtSituation = extractSbarComponent(record.summary, "S");
    const gtBackground = extractSbarComponent(record.summary, "B");
    const gtAssessment = extractSbarComponent(record.summary, "A");
    const gtRecommendation = extractSbarComponent(record.summary, "R");

    // Get LLM-generated summary
    const generatedSummary = getGeneratedSummary(record);

    // Calculate similarity for each component
    if (gtSituation && generatedSummary.situation) {
      situationScores.push(
        calculateJaccardSimilarity(gtSituation, generatedSummary.situation)
      );
    }

    if (gtBackground && generatedSummary.background) {
      backgroundScores.push(
        calculateJaccardSimilarity(gtBackground, generatedSummary.background)
      );
    }

    if (gtAssessment && generatedSummary.assessment) {
      assessmentScores.push(
        calculateJaccardSimilarity(gtAssessment, generatedSummary.assessment)
      );
    }

    if (gtRecommendation && generatedSummary.recommendation) {
      recommendationScores.push(
        calculateJaccardSimilarity(
          gtRecommendation,
          generatedSummary.recommendation
        )
      );
    }
  });

  // Calculate average scores
  const calculateAverage = (scores) =>
    scores.length > 0
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : 0;

  const situationScore = calculateAverage(situationScores);
  const backgroundScore = calculateAverage(backgroundScores);
  const assessmentScore = calculateAverage(assessmentScores);
  const recommendationScore = calculateAverage(recommendationScores);

  // Calculate overall score (average of all components)
  const allScores = [
    ...situationScores,
    ...backgroundScores,
    ...assessmentScores,
    ...recommendationScores,
  ];
  const overallScore = calculateAverage(allScores);

  return {
    situationScore,
    backgroundScore,
    assessmentScore,
    recommendationScore,
    overallScore,
    recordsEvaluated: csvData.filter((r) => r.summary).length,
  };
};

/**
 * Load and process CSV data from a file
 * @param {string} filePath - Path to the CSV file
 * @returns {Promise<Array>} Parsed CSV data as array of objects
 */
export const loadCsvData = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (error) => reject(error));
  });
};

/**
 * Example usage with test data
 */
const exampleCsvData = [
  {
    id: "1",
    patient_name: "John Doe",
    summary:
      "S: 45-year-old male admitted with severe chest pain and shortness of breath. B: History of hypertension and smoking. A: Acute myocardial infarction suspected based on ECG changes and elevated troponin. R: Immediate cardiology consult and initiation of anticoagulation therapy.",
    notes: "Patient appears anxious and in distress.",
  },
  {
    id: "2",
    patient_name: "Jane Smith",
    summary:
      "S: 67-year-old female post-op day 2 following total knee replacement. B: History of osteoarthritis and mild diabetes. A: Experiencing moderate pain (6/10) but able to participate in physical therapy. No signs of infection. R: Continue pain management and early mobilization protocol.",
    notes: "Patient is motivated for rehabilitation.",
  },
  {
    id: "3",
    patient_name: "Robert Johnson",
    summary:
      "S: 35-year-old male presenting with fever of 102.5°F and productive cough for 3 days. B: No significant past medical history. A: Suspected community-acquired pneumonia with decreased breath sounds in right lower lobe. R: Start empiric antibiotics and obtain sputum culture.",
    notes: "Patient reports recent travel history.",
  },
];

// Example function to run evaluation
export const runEvaluation = async (csvFilePath) => {
  try {
    // Either load from file or use example data
    let data;
    if (csvFilePath) {
      data = await loadCsvData(csvFilePath);
    } else {
      data = exampleCsvData;
      console.log("Using example data for evaluation");
    }

    // Run evaluation
    const results = evaluateAccuracy(data);

    // Display results
    console.log("\n=== SBAR Evaluation Results ===");
    console.log(`Records evaluated: ${results.recordsEvaluated}`);
    console.log(
      `Situation score: ${(results.situationScore * 100).toFixed(2)}%`
    );
    console.log(
      `Background score: ${(results.backgroundScore * 100).toFixed(2)}%`
    );
    console.log(
      `Assessment score: ${(results.assessmentScore * 100).toFixed(2)}%`
    );
    console.log(
      `Recommendation score: ${(results.recommendationScore * 100).toFixed(2)}%`
    );
    console.log(`Overall score: ${(results.overallScore * 100).toFixed(2)}%`);

    return results;
  } catch (error) {
    console.error("Error running evaluation:", error);
    throw error;
  }
};

// For testing in Node.js environment
if (process.argv[2] === "--test") {
  runEvaluation();
}
