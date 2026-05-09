import { LlamaModel, LlamaContext, LlamaChatSession } from "node-llama-cpp";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let model = null;

// Initialize the Llama model
export const initializeLlamaModel = async () => {
  try {
    const modelPath =
      process.env.LLAMA_MODEL_PATH ||
      join(__dirname, "../../../models/llama2-7b.gguf");

    // Check if model file exists
    if (!fs.existsSync(modelPath)) {
      throw new Error(`Llama model not found at path: ${modelPath}`);
    }

    model = new LlamaModel({
      modelPath,
      contextSize: 4096,
      gpuLayers: 0, // Set to higher value if GPU is available
    });

    console.log("Llama-2 model loaded successfully");
    return model;
  } catch (error) {
    console.error("Error loading Llama-2 model:", error);
    throw error;
  }
};

// Generate abstractive summary using Llama-2
export const generateAbstractiveSummary = async (salientText) => {
  try {
    if (!model) {
      await initializeLlamaModel();
    }

    const context = new LlamaContext({ model });
    const session = new LlamaChatSession({ context });

    // Prepare system prompt
    const systemPrompt = `You are a specialized medical AI assistant that summarizes clinical notes for nursing handoffs.
    Generate a comprehensive summary of the following clinical information using a structured JSON format.
    Your response must be valid JSON with the following fields: "HPI", "DifferentialDiagnoses", "InEDEvents", "ImmediateCarePlans", "Disposition".
    Be factual, precise, and include only information present in the input text.`;

    // User prompt with salient text
    const userPrompt = `Please summarize the following clinical notes: ${salientText}`;

    // Generate completion
    const response = await session.prompt(userPrompt, {
      systemPrompt,
      maxTokens: parseInt(process.env.MAX_TOKENS) || 2048,
      temperature: parseFloat(process.env.TEMPERATURE) || 0.2,
      topP: parseFloat(process.env.TOP_P) || 0.95,
      repeatPenalty: 1.1,
    });

    // Extract JSON from response
    const jsonMatch = response.match(/\\{.*?\\}/s);
    if (!jsonMatch) {
      throw new Error("Failed to generate valid JSON response");
    }

    // Parse and validate JSON structure
    const jsonResponse = JSON.parse(jsonMatch[0]);

    // Ensure all required fields are present
    const requiredFields = [
      "HPI",
      "DifferentialDiagnoses",
      "InEDEvents",
      "ImmediateCarePlans",
      "Disposition",
    ];
    for (const field of requiredFields) {
      if (!jsonResponse[field]) {
        jsonResponse[field] = "No information available.";
      }
    }

    return jsonResponse;
  } catch (error) {
    console.error("Error in abstractive summarization:", error);
    throw error;
  }
};
