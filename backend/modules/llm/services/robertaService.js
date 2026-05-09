import * as ort from "onnxruntime-node";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load the RoBERTa model for saliency filtering
export const initializeRobertaModel = async () => {
  try {
    const modelPath =
      process.env.ROBERTA_MODEL_PATH ||
      join(__dirname, "../../../models/roberta-saliency.onnx");

    // Check if model file exists
    if (!fs.existsSync(modelPath)) {
      throw new Error(`RoBERTa model not found at path: ${modelPath}`);
    }

    // Create an ONNX inference session
    const session = await ort.InferenceSession.create(modelPath);

    console.log("RoBERTa model loaded successfully");
    return session;
  } catch (error) {
    console.error("Error loading RoBERTa model:", error);
    throw error;
  }
};

// Preprocess text for RoBERTa model
export const preprocessText = (text) => {
  // Implement text preprocessing specific to RoBERTa
  // This is a simplified placeholder - actual implementation would include:
  // - Tokenization
  // - Converting tokens to ids
  // - Creating attention masks
  // - Formatting as tensor

  // Return a placeholder for demonstration
  return {
    input_ids: [
      /* tokenized input */
    ],
    attention_mask: [
      /* attention mask */
    ],
  };
};

// Run saliency filtering on text using RoBERTa
export const filterSalientSentences = async (session, text) => {
  try {
    // Split text into sentences
    const sentences = text.split(/(?<=[.!?])\s+/);

    // Process each sentence and get saliency scores
    const results = await Promise.all(
      sentences.map(async (sentence) => {
        // Preprocess sentence
        const preprocessed = preprocessText(sentence);

        // Run inference
        const feeds = {};
        feeds["input_ids"] = new ort.Tensor("int64", preprocessed.input_ids, [
          1,
          preprocessed.input_ids.length,
        ]);
        feeds["attention_mask"] = new ort.Tensor(
          "int64",
          preprocessed.attention_mask,
          [1, preprocessed.attention_mask.length]
        );

        const outputMap = await session.run(feeds);

        // Extract saliency score (this is simplified)
        const saliencyScore = outputMap.logits.data[0];

        return {
          sentence,
          saliencyScore,
        };
      })
    );

    // Sort by saliency score and filter top sentences
    const topSalientSentences = results
      .sort((a, b) => b.saliencyScore - a.saliencyScore)
      .slice(0, Math.max(5, Math.floor(sentences.length * 0.3))) // Take top 30% or at least 5 sentences
      .map((result) => result.sentence);

    return topSalientSentences.join(" ");
  } catch (error) {
    console.error("Error in saliency filtering:", error);
    throw error;
  }
};
