/**
 * SBAR Debugging Utility
 *
 * This utility helps debug issues with the SBAR evaluation by dumping component data
 */

import {
  extractSbarComponent,
  calculateJaccardSimilarity,
} from "./sbarEvaluation.js";

// Example ground truth and generated summaries for testing
const examples = [
  {
    groundTruth: `Situation: 45-year-old male patient admitted with fever, productive cough, and shortness of breath for 3 days. Temp 39.2°C, HR 105, RR 22, BP 135/85, O2 sat 92% on room air.
      
    Background: History of smoking (1 pack/day x 20 years), no previous hospitalizations. No known drug allergies. Currently on no home medications.
      
    Assessment: Patient has moderate community-acquired pneumonia based on clinical presentation and chest X-ray showing right lower lobe infiltrate. Decreased breath sounds and crackles in right lung base. Started on IV antibiotics and oxygen therapy.
      
    Recommendation: Continue IV antibiotics for 48 hours, then reassess for transition to oral therapy. Maintain oxygen to keep saturation >94%. Monitor for respiratory distress. Encourage incentive spirometry. Consider discharge after afebrile for 24 hours and clinically improving.`,

    generated: {
      situation:
        "akansha saraf is a 20-year-old patient admitted with Community-acquired pneumonia, moderate severity. Awaiting initial vital sign assessment. 1 medication(s) administered in current shift.",
      background: "Community-acquired pneumonia, moderate severity",
      assessment:
        "Patient condition stable with ongoing monitoring. No significant events reported during this period.",
      recommendation:
        "Continue current medication regimen as prescribed, initiate vital sign monitoring per facility protocol, perform comprehensive assessment at next scheduled interval.",
    },
  },
];

/**
 * Debug the SBAR component extraction and scoring
 */
const debugSbarEvaluation = () => {
  console.log("\n=== SBAR EVALUATION DEBUG ===\n");

  examples.forEach((example, index) => {
    console.log(`Example ${index + 1}:`);

    // Extract ground truth components
    const gtSituation = extractSbarComponent(example.groundTruth, "S");
    const gtBackground = extractSbarComponent(example.groundTruth, "B");
    const gtAssessment = extractSbarComponent(example.groundTruth, "A");
    const gtRecommendation = extractSbarComponent(example.groundTruth, "R");

    console.log("\n--- Ground Truth Components ---");
    console.log(`Situation: "${gtSituation}"`);
    console.log(`Background: "${gtBackground}"`);
    console.log(`Assessment: "${gtAssessment}"`);
    console.log(`Recommendation: "${gtRecommendation}"`);

    console.log("\n--- Generated Components ---");
    console.log(`Situation: "${example.generated.situation}"`);
    console.log(`Background: "${example.generated.background}"`);
    console.log(`Assessment: "${example.generated.assessment}"`);
    console.log(`Recommendation: "${example.generated.recommendation}"`);

    // Calculate similarity scores
    const situationScore = calculateJaccardSimilarity(
      gtSituation,
      example.generated.situation
    );
    const backgroundScore = calculateJaccardSimilarity(
      gtBackground,
      example.generated.background
    );
    const assessmentScore = calculateJaccardSimilarity(
      gtAssessment,
      example.generated.assessment
    );
    const recommendationScore = calculateJaccardSimilarity(
      gtRecommendation,
      example.generated.recommendation
    );

    // Calculate overall score
    const overallScore =
      [
        situationScore,
        backgroundScore,
        assessmentScore,
        recommendationScore,
      ].reduce((sum, score) => sum + score, 0) / 4;

    console.log("\n--- Similarity Scores ---");
    console.log(`Situation: ${(situationScore * 100).toFixed(2)}%`);
    console.log(`Background: ${(backgroundScore * 100).toFixed(2)}%`);
    console.log(`Assessment: ${(assessmentScore * 100).toFixed(2)}%`);
    console.log(`Recommendation: ${(recommendationScore * 100).toFixed(2)}%`);
    console.log(`Overall: ${(overallScore * 100).toFixed(2)}%`);

    // Add detailed token analysis
    console.log("\n--- Detailed Word Analysis ---");

    const analyzeWords = (textA, textB, label) => {
      console.log(`\n${label} Analysis:`);

      // Normalize and tokenize
      const normalize = (text) =>
        text
          .toLowerCase()
          .replace(/[^\w\s]/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      const wordsA = normalize(textA).split(/\s+/);
      const wordsB = normalize(textB).split(/\s+/);

      const setA = new Set(wordsA);
      const setB = new Set(wordsB);
      const intersection = [...setA].filter((word) => setB.has(word));

      console.log(
        `- Words in ground truth: ${wordsA.length} (unique: ${setA.size})`
      );
      console.log(
        `- Words in generated: ${wordsB.length} (unique: ${setB.size})`
      );
      console.log(`- Matching words: ${intersection.length}`);
      if (intersection.length > 0) {
        console.log(`- Matched: "${intersection.join('", "')}"`);
      }
    };

    analyzeWords(gtSituation, example.generated.situation, "Situation");
    analyzeWords(gtBackground, example.generated.background, "Background");
    analyzeWords(gtAssessment, example.generated.assessment, "Assessment");
    analyzeWords(
      gtRecommendation,
      example.generated.recommendation,
      "Recommendation"
    );
  });
};

// Run the debug
debugSbarEvaluation();

// Allow running from command line
if (process.argv[2] === "--debug") {
  debugSbarEvaluation();
}

export default debugSbarEvaluation;
