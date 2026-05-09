# SBAR Summary Evaluation

This module provides tools to evaluate the quality of LLM-generated SBAR (Situation, Background, Assessment, Recommendation) summaries against ground truth data.

## Overview

The evaluation system compares automatically generated patient summaries with reference summaries using Jaccard similarity, which measures text overlap. The system:

1. Extracts SBAR components from ground truth summaries
2. Compares them with LLM-generated summaries
3. Calculates similarity scores for each component
4. Provides overall evaluation metrics

## Features

- **Jaccard Similarity Calculation**: Measures text overlap between generated and reference summaries
- **SBAR Component Extraction**: Reliably extracts S, B, A, R components from formatted text
- **CSV/Excel Data Support**: Works with the hospital dataset provided
- **API Integration**: Includes REST endpoints for evaluating summary quality

## Core Utilities

### `calculateJaccardSimilarity(textA, textB)`

Calculates the Jaccard similarity between two text strings:

```javascript
import { calculateJaccardSimilarity } from "./utils/sbarEvaluation.js";

const similarity = calculateJaccardSimilarity(
  "Patient has fever and cough",
  "Patient reporting fever with cough"
);
console.log(`Similarity: ${similarity * 100}%`); // Output: Similarity: 66.67%
```

### `extractSbarComponent(sbarString, componentKey)`

Extracts a specific component (S, B, A, or R) from an SBAR-formatted string:

```javascript
import { extractSbarComponent } from "./utils/sbarEvaluation.js";

const sbarText =
  "S: Patient admitted with fever. B: History of pneumonia. A: Suspected infection. R: Start antibiotics.";

const situation = extractSbarComponent(sbarText, "S");
console.log(situation); // Output: Patient admitted with fever.
```

### `evaluateAccuracy(csvData)`

Evaluates the accuracy of generated summaries against ground truth:

```javascript
import { evaluateAccuracy } from "./utils/sbarEvaluation.js";

const results = evaluateAccuracy(patientRecords);
console.log(`Overall score: ${results.overallScore * 100}%`);
```

## API Endpoints

### GET /api/evaluation/metrics

Returns evaluation metrics for summaries:

```
GET /api/evaluation/metrics
```

Response:

```json
{
  "message": "SBAR evaluation metrics retrieved successfully",
  "metrics": {
    "situationScore": "40.10",
    "backgroundScore": "46.97",
    "assessmentScore": "60.44",
    "recommendationScore": "28.18",
    "overallScore": "43.92",
    "recordsEvaluated": 1000
  }
}
```

### POST /api/evaluation/compare

Compares a specific summary with ground truth:

```
POST /api/evaluation/compare
Content-Type: application/json

{
  "summaryId": "1234",
  "groundTruthIndex": 5
}
```

Response:

```json
{
  "message": "Comparison completed successfully",
  "comparison": {
    "groundTruth": {
      "situation": "Patient admitted with fever.",
      "background": "History of pneumonia.",
      "assessment": "Respiratory infection likely.",
      "recommendation": "Start antibiotics."
    },
    "generated": {
      "situation": "Patient presented with high fever.",
      "background": "Patient has history of lung infections.",
      "assessment": "Signs consistent with respiratory infection.",
      "recommendation": "Begin antibiotic treatment."
    },
    "scores": {
      "situation": "65.25",
      "background": "42.86",
      "assessment": "70.12",
      "recommendation": "58.33",
      "overall": "59.14"
    }
  }
}
```

## Testing Utilities

To run the SBAR component extraction test:

```bash
node src/utils/sbarTest.js --run
```

To test evaluation with the hospital dataset:

```bash
node src/scripts/testSbarEvaluation.js
```

## Implementation Details

### Jaccard Similarity

The Jaccard similarity coefficient measures similarity between finite sets by dividing the size of the intersection by the size of the union of the sets:

J(A,B) = |A ∩ B| / |A ∪ B|

For text comparison, we:

1. Convert text to lowercase
2. Remove punctuation
3. Split into words (tokens)
4. Create sets of unique words
5. Calculate intersection and union
6. Compute the similarity score

### SBAR Component Extraction

The extraction uses regular expressions to identify components based on markers like "S:", "B:", etc. It can handle variations in formatting including:

- Standard format: "S: text. B: text. A: text. R: text."
- Newline separated: "S: text\nB: text\nA: text\nR: text."
- Full words: "Situation: text. Background: text..."
- Mixed formats and spacing

## Future Improvements

- Add support for more sophisticated NLP similarity metrics (BLEU, ROUGE, etc.)
- Implement semantic similarity using embeddings
- Add visualization of similarity results
- Support additional summary formats beyond SBAR
