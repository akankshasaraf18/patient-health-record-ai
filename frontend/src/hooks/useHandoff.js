import { useEffect } from "react";
import { useHandoffContext } from "../context/HandoffContext";
import handoffService from "../services/handoffService";

export const useFetchHandoffSummaries = (encounterId) => {
  const { state, dispatch, ActionTypes } = useHandoffContext();

  useEffect(() => {
    const fetchSummaries = async () => {
      try {
        dispatch({ type: ActionTypes.FETCH_SUMMARIES_REQUEST });
        const summaries = await handoffService.getHandoffSummariesByEncounter(
          encounterId
        );
        dispatch({
          type: ActionTypes.FETCH_SUMMARIES_SUCCESS,
          payload: summaries,
        });
      } catch (error) {
        dispatch({
          type: ActionTypes.FETCH_SUMMARIES_FAILURE,
          payload: error.message,
        });
      }
    };

    if (encounterId) {
      fetchSummaries();
    }
  }, [encounterId, dispatch, ActionTypes]);

  return {
    summaries: state.handoffSummaries,
    loading: state.loading,
    error: state.error,
  };
};

export const useFetchHandoffSummary = (summaryId) => {
  const { state, dispatch, ActionTypes } = useHandoffContext();

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        dispatch({ type: ActionTypes.FETCH_SUMMARY_REQUEST });
        const summary = await handoffService.getHandoffSummary(summaryId);
        dispatch({
          type: ActionTypes.FETCH_SUMMARY_SUCCESS,
          payload: summary,
        });
      } catch (error) {
        dispatch({
          type: ActionTypes.FETCH_SUMMARY_FAILURE,
          payload: error.message,
        });
      }
    };

    if (summaryId) {
      fetchSummary();
    }
  }, [summaryId, dispatch, ActionTypes]);

  return {
    summary: state.currentSummary,
    loading: state.loading,
    error: state.error,
  };
};

export const useGenerateHandoffSummary = () => {
  const { dispatch, ActionTypes } = useHandoffContext();

  const generateSummary = async (encounterId, shiftType, sourceNoteIds) => {
    try {
      dispatch({ type: ActionTypes.GENERATE_SUMMARY_REQUEST });
      const summary = await handoffService.generateHandoffSummary(
        encounterId,
        shiftType,
        sourceNoteIds
      );
      dispatch({
        type: ActionTypes.GENERATE_SUMMARY_SUCCESS,
        payload: summary,
      });
      return summary;
    } catch (error) {
      dispatch({
        type: ActionTypes.GENERATE_SUMMARY_FAILURE,
        payload: error.message,
      });
      throw error;
    }
  };

  return { generateSummary };
};

export const useFinalizeHandoffSummary = () => {
  const { state, dispatch, ActionTypes } = useHandoffContext();

  const finalizeSummary = async (summaryId, nurseReviewerId) => {
    try {
      dispatch({ type: ActionTypes.FINALIZE_SUMMARY_REQUEST });

      const summary = await handoffService.finalizeHandoffSummary(
        summaryId,
        nurseReviewerId,
        state.currentSummary.summaryOutput,
        state.editHistory
      );

      dispatch({
        type: ActionTypes.FINALIZE_SUMMARY_SUCCESS,
        payload: summary,
      });

      return summary;
    } catch (error) {
      dispatch({
        type: ActionTypes.FINALIZE_SUMMARY_FAILURE,
        payload: error.message,
      });
      throw error;
    }
  };

  return { finalizeSummary };
};

export const useHandoffEditor = () => {
  const { state, dispatch, ActionTypes } = useHandoffContext();

  const updateSummaryField = (field, value, previousValue) => {
    // Update the field
    dispatch({
      type: ActionTypes.UPDATE_SUMMARY_FIELD,
      payload: { field, value },
    });

    // Add to edit history
    dispatch({
      type: ActionTypes.ADD_EDIT_HISTORY,
      payload: {
        field,
        previousValue,
        newValue: value,
        timestamp: new Date(),
      },
    });
  };

  const clearEditHistory = () => {
    dispatch({ type: ActionTypes.CLEAR_EDIT_HISTORY });
  };

  return {
    summary: state.currentSummary,
    editHistory: state.editHistory,
    updateSummaryField,
    clearEditHistory,
  };
};
