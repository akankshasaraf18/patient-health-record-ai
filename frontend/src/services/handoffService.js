import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Handoff API service
const handoffService = {
  // Get all handoff summaries for an encounter
  getHandoffSummariesByEncounter: async (encounterId) => {
    try {
      const response = await api.get(`/handoff/encounter/${encounterId}`);
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch handoff summaries"
      );
    }
  },

  // Get a specific handoff summary
  getHandoffSummary: async (summaryId) => {
    try {
      const response = await api.get(`/handoff/${summaryId}`);
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch handoff summary"
      );
    }
  },

  // Generate a new handoff summary
  generateHandoffSummary: async (encounterId, shiftType, sourceNoteIds) => {
    try {
      const response = await api.post(`/handoff/generate/${encounterId}`, {
        shiftType,
        sourceNoteIds,
      });
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to generate handoff summary"
      );
    }
  },

  // Finalize a handoff summary
  finalizeHandoffSummary: async (
    summaryId,
    nurseReviewerId,
    summaryOutput,
    reviewEdits
  ) => {
    try {
      const response = await api.put(`/handoff/${summaryId}/finalize`, {
        nurseReviewerId,
        summaryOutput,
        reviewEdits,
      });
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to finalize handoff summary"
      );
    }
  },
};

export default handoffService;
