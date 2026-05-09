import mongoose from "mongoose";

const HandoffSummarySchema = new mongoose.Schema(
  {
    encounterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Encounter",
      required: true,
    },
    shiftType: {
      type: String,
      enum: ["Day", "Night"],
      required: true,
    },
    generationTimestamp: {
      type: Date,
      default: Date.now,
    },
    nurseReviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Required only when finalized
    },
    nurseReviewStatus: {
      type: String,
      enum: ["Draft", "Reviewed", "Finalized"],
      default: "Draft",
    },
    sourceNotesRefs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "EHRSourceNote",
      },
    ],
    summaryOutput: {
      situation: {
        type: String,
        required: true,
      },
      background: {
        type: String,
        required: true,
      },
      assessment: {
        type: String,
        required: true,
      },
      recommendation: {
        type: String,
        required: true,
      },
    },
    vitalsAndMetrics: [
      {
        category: String,
        name: String,
        value: mongoose.Schema.Types.Mixed,
        unit: String,
        timestamp: Date,
      },
    ],
    reviewEdits: [
      {
        field: String, // Path to the edited field (e.g., 'summaryOutput.situation')
        previousValue: String,
        newValue: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        editedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("HandoffSummary", HandoffSummarySchema);
