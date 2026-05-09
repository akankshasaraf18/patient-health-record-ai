/**
 * Summary Evaluation Service
 *
 * This service provides functions to evaluate the quality of LLM-generated
 * SBAR summaries against ground truth data.
 */

import { authGet, authPost } from "../utils/api";

// API base URL is managed by the api utility

/**
 * Get evaluation metrics for summaries
 * @returns {Promise<Object>} Metrics data including scores for each SBAR component
 */
export const getEvaluationMetrics = async () => {
  try {
    const response = await authGet(`/evaluation/metrics`);
    return response.data.metrics;
  } catch (error) {
    console.error("Error getting evaluation metrics:", error);
    throw new Error(
      error.response?.data?.error || "Failed to get evaluation metrics"
    );
  }
};

/**
 * Compare a specific summary with ground truth data
 * @param {string} summaryId - ID of the summary to compare
 * @param {number} groundTruthIndex - Index of the ground truth record to compare with
 * @returns {Promise<Object>} Comparison data including scores and content
 */
export const compareSummary = async (
  summaryId,
  groundTruthIndex = 0,
  useGeneratedReference = true
) => {
  try {
    const response = await authPost(`/evaluation/compare`, {
      summaryId,
      groundTruthIndex,
      useGeneratedReference,
    });
    return response.data.comparison;
  } catch (error) {
    console.error("Error comparing summary:", error);
    throw new Error(error.response?.data?.error || "Failed to compare summary");
  }
};

export default {
  getEvaluationMetrics,
  compareSummary,
};
