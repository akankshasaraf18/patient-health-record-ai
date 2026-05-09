/**
 * Llama Service
 * Handles AI-powered text generation using Llama-2 API
 * Includes graceful fallback if API is not available
 */

import axios from "axios";

let apiConfigured = false;

/**
 * Initialize API configuration
 */
const initializeAPI = async () => {
  try {
    // Check if AI summarization is enabled
    if (process.env.ENABLE_AI_SUMMARIZATION !== "true") {
      console.log(
        "ℹ️  AI summarization disabled. Using fallback summarization."
      );
      return false;
    }

    const apiUrl = process.env.LLAMA2_API_URL;
    const apiKey = process.env.LLAMA2_API_KEY;

    if (!apiUrl || !apiKey) {
      console.log(
        "⚠️  LLAMA2_API_URL or LLAMA2_API_KEY not set. Using fallback summarization."
      );
      return false;
    }

    console.log("🤖 AI API configured successfully!");
    apiConfigured = true;
    return true;
  } catch (error) {
    console.warn(
      "⚠️  AI API initialization failed (this is OK):",
      error.message
    );
    console.log("ℹ️  System will use deterministic fallback summarization");
    apiConfigured = false;
    return false;
  }
};

/**
 * Generate summary using Llama-2 API or fallback
 */
export const generateSummary = async (prompt) => {
  // Try AI generation if API is configured
  if (apiConfigured) {
    try {
      const response = await axios.post(
        process.env.LLAMA2_API_URL + "/chat/completions",
        {
          model: "meta-llama/Meta-Llama-3-8B-Instruct",
          messages: [
            {
              role: "system",
              content:
                'You are a medical assistant generating SBAR patient handoff summaries. Respond ONLY with valid JSON in this exact format: {"situation": "...", "background": "...", "assessment": "...", "recommendation": "...", "confidence": 0.85}',
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: parseInt(process.env.MAX_TOKENS) || 1024,
          temperature: parseFloat(process.env.TEMPERATURE) || 0.3,
          top_p: parseFloat(process.env.TOP_P) || 0.95,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.LLAMA2_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );

      const content = response.data.choices[0].message.content.trim();

      // Try to extract JSON from markdown code blocks if present
      let jsonContent = content;
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1];
      } else {
        // Try to find JSON object in the response
        const objectMatch = content.match(/\{[\s\S]*\}/);
        if (objectMatch) {
          jsonContent = objectMatch[0];
        }
      }

      const parsed = JSON.parse(jsonContent);
      console.log("✅ AI summary generated successfully!");
      return parsed;
    } catch (error) {
      console.error("AI generation failed, using fallback:", error.message);
      if (error.response) {
        console.error("API Response:", error.response.data);
      }
      return null; // Will trigger fallback in summaryService
    }
  }

  // Return null to trigger fallback in summaryService
  return null;
};

/**
 * Check if AI API is available
 */
export const isModelAvailable = () => {
  return apiConfigured;
};

/**
 * Get API status
 */
export const getModelStatus = () => {
  return {
    enabled: process.env.ENABLE_AI_SUMMARIZATION === "true",
    configured: apiConfigured,
    apiUrl: process.env.LLAMA2_API_URL || "not set",
  };
};

// Initialize API on module load (non-blocking)
initializeAPI().catch((err) => {
  console.log("ℹ️  AI API not available, using fallback summarization");
});

export default {
  generateSummary,
  isModelAvailable,
  getModelStatus,
};
