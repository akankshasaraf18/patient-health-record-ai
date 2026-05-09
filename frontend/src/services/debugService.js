/**
 * Debug Service
 *
 * Provides access to debug endpoints for development and troubleshooting
 */

import { authGet, authPost } from "../utils/api";

// API base URL is managed by the api utility

/**
 * Get detailed SBAR component analysis for a specific summary
 *
 * @param {string} summaryId - The ID of the summary to analyze
 * @returns {Promise<Object>} Detailed analysis of SBAR component matching
 */
export const getDetailedSbarAnalysis = async (summaryId) => {
  try {
    // Use our auth utility for consistent authentication
    const response = await authGet(`/debug/sbar/${summaryId}`);
    return response.data.analysis;
  } catch (error) {
    console.error("Error getting SBAR analysis:", error);
    throw new Error(
      error.response?.data?.error || "Failed to analyze SBAR components"
    );
  }
};

/**
 * Generate a tailored reference summary specific to the given summary
 *
 * @param {string} summaryId - The ID of the summary to create reference for
 * @returns {Promise<Object>} Generated reference summary data
 */
export const generateReferenceSummary = async (summaryId) => {
  try {
    // Use our auth utility for consistent authentication
    const response = await authPost(`/reference/generate/${summaryId}`, {});
    return response.data.reference;
  } catch (error) {
    console.error("Error generating reference summary:", error);
    throw new Error(
      error.response?.data?.error || "Failed to generate reference summary"
    );
  }
};
