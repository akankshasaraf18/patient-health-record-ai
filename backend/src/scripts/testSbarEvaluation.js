/**
 * Test script for SBAR Evaluation utilities
 *
 * This script processes the hospital dataset and evaluates
 * the quality of LLM-generated summaries against ground truth.
 */

import fs from "fs";
import path from "path";
import xlsx from "xlsx";
import {
  calculateJaccardSimilarity,
  extractSbarComponent,
  evaluateAccuracy,
} from "../utils/sbarEvaluation.js";
import { fileURLToPath } from "url";

// Get the directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load data from Excel file with .csv.xlsx extension
 * @param {string} filePath - Path to the Excel file
 * @returns {Array} Parsed data as array of objects
 */
const loadExcelData = (filePath) => {
  try {
    // Read the Excel file
    const workbook = xlsx.readFile(filePath);

    // Get the first worksheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const data = xlsx.utils.sheet_to_json(worksheet);

    console.log(`Successfully loaded ${data.length} records from Excel file`);
    return data;
  } catch (error) {
    console.error("Error loading Excel data:", error);
    return [];
  }
};

/**
 * Placeholder function to get LLM-generated summary
 * This would be replaced with actual implementation
 */
const getGeneratedSummary = (record) => {
  // For testing purposes, we're creating a simple mock summary
  // In a real scenario, this would call the actual LLM or retrieve pre-generated summaries

  // Extract components from the ground truth to simulate different levels of matching
  const gtSituation = extractSbarComponent(record.summary || "", "S");
  const gtBackground = extractSbarComponent(record.summary || "", "B");
  const gtAssessment = extractSbarComponent(record.summary || "", "A");
  const gtRecommendation = extractSbarComponent(record.summary || "", "R");

  // Add some variability to simulate different accuracy levels
  const modifyText = (text, accuracy) => {
    if (!text) return "";

    // Split text into words
    const words = text.split(/\s+/);

    // Determine how many words to keep based on accuracy
    const keepCount = Math.floor(words.length * accuracy);

    // Keep some words, replace others
    return words
      .map((word, index) =>
        index < keepCount
          ? word
          : ["important", "patient", "medical", "treatment", "recommend"][
              index % 5
            ]
      )
      .join(" ");
  };

  // Simulate different accuracy levels for different components
  return {
    situation: modifyText(gtSituation, 0.7), // 70% similar
    background: modifyText(gtBackground, 0.6), // 60% similar
    assessment: modifyText(gtAssessment, 0.8), // 80% similar
    recommendation: modifyText(gtRecommendation, 0.5), // 50% similar
  };
};

/**
 * Custom implementation of evaluateAccuracy using our mock generator
 */
const customEvaluateAccuracy = (csvData) => {
  // Validation
  if (!Array.isArray(csvData) || csvData.length === 0) {
    console.error("Invalid or empty data provided");
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

    // Get LLM-generated summary (using our custom mock generator)
    const generatedSummary = getGeneratedSummary(record);

    // Calculate similarity for each component
    if (gtSituation && generatedSummary.situation) {
      const score = calculateJaccardSimilarity(
        gtSituation,
        generatedSummary.situation
      );
      situationScores.push(score);

      // Detailed logging for first few records
      if (situationScores.length <= 3) {
        console.log(
          `\n--- Record ${situationScores.length} Situation Evaluation ---`
        );
        console.log(`Ground Truth: "${gtSituation.substring(0, 100)}..."`);
        console.log(
          `Generated: "${generatedSummary.situation.substring(0, 100)}..."`
        );
        console.log(`Jaccard Similarity: ${(score * 100).toFixed(2)}%`);
      }
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
 * Run the evaluation on our dataset
 */
const main = async () => {
  try {
    // Define the path to the Excel file
    const dataFilePath = path.join(
      __dirname,
      "../../data/hospital_dataset.csv.xlsx"
    );

    // Check if file exists
    if (!fs.existsSync(dataFilePath)) {
      console.error(`File not found: ${dataFilePath}`);
      process.exit(1);
    }

    // Load data
    const data = loadExcelData(dataFilePath);

    // Sample data - first 3 records
    console.log("\nSample data (first 3 records):");
    data.slice(0, 3).forEach((record, index) => {
      console.log(`\nRecord ${index + 1}:`);
      console.log(
        `Summary: ${
          record.summary ? record.summary.substring(0, 100) + "..." : "N/A"
        }`
      );
    });

    // Run custom evaluation
    console.log("\nRunning evaluation...");
    const results = customEvaluateAccuracy(data);

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

    // Test individual functions
    console.log("\n=== Testing Individual Functions ===");

    // Test Jaccard similarity
    const textA =
      "The patient is experiencing severe chest pain and shortness of breath";
    const textB = "Patient has chest pain and difficulty breathing";
    const similarity = calculateJaccardSimilarity(textA, textB);
    console.log(`Jaccard Similarity Test: ${(similarity * 100).toFixed(2)}%`);

    // Test SBAR extraction
    const sampleSbar =
      "S: Patient admitted with fever. B: History of pneumonia. A: Respiratory infection likely. R: Start antibiotics.";
    console.log(`\nSBAR Extraction Test:`);
    console.log(`Situation: "${extractSbarComponent(sampleSbar, "S")}"`);
    console.log(`Background: "${extractSbarComponent(sampleSbar, "B")}"`);
    console.log(`Assessment: "${extractSbarComponent(sampleSbar, "A")}"`);
    console.log(`Recommendation: "${extractSbarComponent(sampleSbar, "R")}"`);
  } catch (error) {
    console.error("Error in main function:", error);
  }
};

// Run the main function
main();
