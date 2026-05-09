import { createContext, useContext, useReducer } from "react";

// Initial state
const initialState = {
  handoffSummaries: [],
  currentSummary: null,
  loading: false,
  error: null,
  editHistory: [],
};

// Action types
const ActionTypes = {
  FETCH_SUMMARIES_REQUEST: "FETCH_SUMMARIES_REQUEST",
  FETCH_SUMMARIES_SUCCESS: "FETCH_SUMMARIES_SUCCESS",
  FETCH_SUMMARIES_FAILURE: "FETCH_SUMMARIES_FAILURE",
  FETCH_SUMMARY_REQUEST: "FETCH_SUMMARY_REQUEST",
  FETCH_SUMMARY_SUCCESS: "FETCH_SUMMARY_SUCCESS",
  FETCH_SUMMARY_FAILURE: "FETCH_SUMMARY_FAILURE",
  UPDATE_SUMMARY_FIELD: "UPDATE_SUMMARY_FIELD",
  ADD_EDIT_HISTORY: "ADD_EDIT_HISTORY",
  CLEAR_EDIT_HISTORY: "CLEAR_EDIT_HISTORY",
  FINALIZE_SUMMARY_REQUEST: "FINALIZE_SUMMARY_REQUEST",
  FINALIZE_SUMMARY_SUCCESS: "FINALIZE_SUMMARY_SUCCESS",
  FINALIZE_SUMMARY_FAILURE: "FINALIZE_SUMMARY_FAILURE",
  GENERATE_SUMMARY_REQUEST: "GENERATE_SUMMARY_REQUEST",
  GENERATE_SUMMARY_SUCCESS: "GENERATE_SUMMARY_SUCCESS",
  GENERATE_SUMMARY_FAILURE: "GENERATE_SUMMARY_FAILURE",
};

// Reducer function
const handoffReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.FETCH_SUMMARIES_REQUEST:
    case ActionTypes.FETCH_SUMMARY_REQUEST:
    case ActionTypes.FINALIZE_SUMMARY_REQUEST:
    case ActionTypes.GENERATE_SUMMARY_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case ActionTypes.FETCH_SUMMARIES_SUCCESS:
      return {
        ...state,
        handoffSummaries: action.payload,
        loading: false,
      };

    case ActionTypes.FETCH_SUMMARY_SUCCESS:
      return {
        ...state,
        currentSummary: action.payload,
        loading: false,
        editHistory: [], // Reset edit history when loading a new summary
      };

    case ActionTypes.FINALIZE_SUMMARY_SUCCESS:
      return {
        ...state,
        currentSummary: action.payload,
        loading: false,
        editHistory: [], // Reset edit history after finalizing
      };

    case ActionTypes.GENERATE_SUMMARY_SUCCESS:
      return {
        ...state,
        handoffSummaries: [action.payload, ...state.handoffSummaries],
        loading: false,
      };

    case ActionTypes.FETCH_SUMMARIES_FAILURE:
    case ActionTypes.FETCH_SUMMARY_FAILURE:
    case ActionTypes.FINALIZE_SUMMARY_FAILURE:
    case ActionTypes.GENERATE_SUMMARY_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case ActionTypes.UPDATE_SUMMARY_FIELD:
      return {
        ...state,
        currentSummary: {
          ...state.currentSummary,
          summaryOutput: {
            ...state.currentSummary.summaryOutput,
            [action.payload.field]: action.payload.value,
          },
        },
      };

    case ActionTypes.ADD_EDIT_HISTORY:
      return {
        ...state,
        editHistory: [...state.editHistory, action.payload],
      };

    case ActionTypes.CLEAR_EDIT_HISTORY:
      return {
        ...state,
        editHistory: [],
      };

    default:
      return state;
  }
};

// Create context
const HandoffContext = createContext(null);

// Context provider
export const HandoffContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(handoffReducer, initialState);

  return (
    <HandoffContext.Provider value={{ state, dispatch, ActionTypes }}>
      {children}
    </HandoffContext.Provider>
  );
};

// Custom hook to use the context
export const useHandoffContext = () => {
  const context = useContext(HandoffContext);

  if (!context) {
    throw new Error(
      "useHandoffContext must be used within a HandoffContextProvider"
    );
  }

  return context;
};
