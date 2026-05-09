/**
 * SBAR Component Utility
 *
 * A simple utility for testing SBAR component extraction and similarity calculations.
 * This is helpful for verifying that the extractSbarComponent function works correctly.
 */

import {
  extractSbarComponent,
  calculateJaccardSimilarity,
} from "../utils/sbarEvaluation.js";

// Sample SBAR text with different formats
const sampleTexts = [
  "S: 45-year-old male admitted with severe chest pain and shortness of breath. B: History of hypertension and smoking. A: Acute myocardial infarction suspected based on ECG changes and elevated troponin. R: Immediate cardiology consult and initiation of anticoagulation therapy.",

  "S: Patient reports increased pain in the surgical site.\nB: Post-operative day 3 after appendectomy.\nA: Incision appears red with purulent discharge.\nR: Start antibiotics and order wound culture.",

  "Situation: 67-year-old female with progressive dyspnea.\nBackground: COPD history with two exacerbations in the past year.\nAssessment: Acute COPD exacerbation, oxygen saturation 88%.\nRecommendation: Initiate nebulizer treatments and corticosteroids.",

  "S:Fever of 102.5°F for 24 hours B:History of UTIs R:Urine culture and empiric antibiotics A:Symptoms consistent with pyelonephritis",

  "situation: Fall at home with hip pain background: Osteoporosis diagnosed 3 years ago assessment: Suspected hip fracture recommendation: Order x-ray and orthopedic consult",

  "This patient presented with cough and fever. They have a history of asthma. Based on examination, they likely have bronchitis. I recommend bronchodilators and antibiotics.",
];

// Test extraction and similarity
const testSbarExtraction = () => {
  console.log("=== SBAR Component Extraction Test ===\n");

  for (let i = 0; i < sampleTexts.length; i++) {
    console.log(`Test Text ${i + 1}:`);
    console.log(`"${sampleTexts[i].substring(0, 50)}..."`);

    // Extract components
    const situation = extractSbarComponent(sampleTexts[i], "S");
    const background = extractSbarComponent(sampleTexts[i], "B");
    const assessment = extractSbarComponent(sampleTexts[i], "A");
    const recommendation = extractSbarComponent(sampleTexts[i], "R");

    console.log("\nExtracted components:");
    console.log(`Situation: "${situation}"`);
    console.log(`Background: "${background}"`);
    console.log(`Assessment: "${assessment}"`);
    console.log(`Recommendation: "${recommendation}"`);

    // For the last text, which doesn't have explicit markers
    if (i === sampleTexts.length - 1) {
      console.log(
        "\nNote: The last example has no explicit SBAR markers, " +
          "so extraction returns empty strings. In a real application, " +
          "you might need additional logic to handle unstructured text."
      );
    }

    console.log("\n-----------------------------------\n");
  }
};

// Test similarity between different texts
const testJaccardSimilarity = () => {
  console.log("=== Jaccard Similarity Test ===\n");

  const testPairs = [
    {
      a: "45-year-old male admitted with chest pain",
      b: "A 45-year-old man presented with chest pain",
      description: "Similar content with different wording",
    },
    {
      a: "Patient has fever of 102.5°F and productive cough",
      b: "Patient reports headache and sore throat",
      description: "Different symptoms",
    },
    {
      a: "Start antibiotics and monitor renal function",
      b: "Begin antibiotic therapy and check kidney function",
      description: "Same recommendation with synonyms",
    },
    {
      a: "History of diabetes, hypertension, and previous MI",
      b: "History of diabetes, high blood pressure, and heart attack",
      description: "Medical terms vs. layman's terms",
    },
  ];

  for (const pair of testPairs) {
    const similarity = calculateJaccardSimilarity(pair.a, pair.b);
    console.log(`Test: ${pair.description}`);
    console.log(`Text A: "${pair.a}"`);
    console.log(`Text B: "${pair.b}"`);
    console.log(`Jaccard Similarity: ${(similarity * 100).toFixed(2)}%`);
    console.log("\n-----------------------------------\n");
  }
};

// Run the tests
console.log("\n=== SBAR Utility Test ===\n");
testSbarExtraction();
testJaccardSimilarity();
console.log("Testing complete!");

// If run directly
if (process.argv[2] === "--run") {
  testSbarExtraction();
  testJaccardSimilarity();
}

export { testSbarExtraction, testJaccardSimilarity };
