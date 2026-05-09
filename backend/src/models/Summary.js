import mongoose from "mongoose";

const SummarySchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "Patient ID is required"],
      index: true,
    },
    periodStart: {
      type: Date,
      required: [true, "Period start time is required"],
    },
    periodEnd: {
      type: Date,
      required: [true, "Period end time is required"],
      validate: {
        validator: function (value) {
          return value >= this.periodStart;
        },
        message: "Period end must be after period start",
      },
    },
    generatedBy: {
      type: String,
      enum: {
        values: ["model", "user", "system", "llm-model"],
        message: "{VALUE} is not a valid generator",
      },
      default: "model",
    },
    status: {
      type: String,
      enum: {
        values: ["draft", "reviewed", "final"],
        message: "{VALUE} is not a valid status",
      },
      default: "draft",
      index: true,
    },

    // Structured summary output following SBAR-like format
    summaryOutput: {
      header: {
        patient_info: String,
        admit_time: Date,
        encounter_id: String,
      },
      situation: {
        hpi: String, // History of Present Illness
        chief_complaint: String,
      },
      background: {
        diagnosis: String,
        differential_diagnoses: [String],
        past_medical_history: String,
      },
      assessment: {
        events: String, // InEDEvents
        vitals: [
          {
            timestamp: Date,
            HR: Number,
            BP: String,
            Temp: Number,
            RR: Number,
            O2Sat: Number,
          },
        ],
        labs: [
          {
            name: String,
            value: mongoose.Schema.Types.Mixed,
            unit: String,
            abnormal: Boolean,
            timestamp: Date,
          },
        ],
        medications: [
          {
            name: String,
            dose: String,
            route: String,
            frequency: String,
            timestamp: Date,
          },
        ],
        imaging: [
          {
            type: String,
            result: String,
            timestamp: Date,
          },
        ],
        procedures: [
          {
            name: String,
            notes: String,
            timestamp: Date,
          },
        ],
      },
      recommendation: {
        immediate_care_plans: String,
        consults: String,
        disposition: String,
        follow_up: String,
      },
    },

    // Provenance and audit trail
    sources: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Entry",
      },
    ],

    saliencyMap: [
      {
        sourceId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Entry",
        },
        score: {
          type: Number,
          min: 0,
          max: 1,
        },
        text: String,
        timestamp: Date,
        reasoning: String,
      },
    ],

    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5,
    },

    modelMetadata: {
      saliency_model: String,
      summarization_model: String,
      model_version: String,
      generation_time_ms: Number,
      token_count: Number,
      flags: [String], // e.g., ['low_confidence', 'missing_data', 'hallucination_risk']
    },

    // LLM evaluation metadata
    metadata: {
      model_version: String,
      confidence_score: Number,
      generation_time_ms: Number,
      llm_accuracy: Number,
      evaluation: mongoose.Schema.Types.Mixed,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    signedOffBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    signedOffAt: {
      type: Date,
      default: null,
    },

    // Edit tracking for physician-in-the-loop
    originalDraft: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    editHistory: [
      {
        editedAt: {
          type: Date,
          default: Date.now,
        },
        editedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        field: String,
        previousValue: mongoose.Schema.Types.Mixed,
        newValue: mongoose.Schema.Types.Mixed,
        reason: String,
      },
    ],

    reviewNotes: {
      type: String,
      default: "",
    },

    qualityMetrics: {
      completeness_score: Number,
      accuracy_score: Number,
      rouge_score: Number,
      bertscore: Number,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
SummarySchema.index({ patientId: 1, periodStart: -1 });
SummarySchema.index({ status: 1, createdAt: -1 });
SummarySchema.index({ signedOffBy: 1, signedOffAt: -1 });
SummarySchema.index({ "modelMetadata.flags": 1 });

// Virtual for period duration
SummarySchema.virtual("periodDuration").get(function () {
  if (!this.periodStart || !this.periodEnd) return 0;
  return (this.periodEnd - this.periodStart) / (1000 * 60 * 60); // hours
});

// Virtual for time since creation
SummarySchema.virtual("timeSinceCreation").get(function () {
  if (!this.createdAt) return 0;
  return (new Date() - this.createdAt) / (1000 * 60); // minutes
});

// Method to update summary field
SummarySchema.methods.updateField = async function (
  userId,
  fieldPath,
  newValue,
  reason
) {
  // Store original draft on first edit
  if (!this.originalDraft) {
    this.originalDraft = this.summaryOutput.toObject();
  }

  // Get current value
  const parts = fieldPath.split(".");
  let currentObj = this.summaryOutput;
  let previousValue = currentObj;

  for (let i = 0; i < parts.length - 1; i++) {
    currentObj = currentObj[parts[i]];
  }
  previousValue = currentObj[parts[parts.length - 1]];

  // Update value
  currentObj[parts[parts.length - 1]] = newValue;

  // Record edit
  this.editHistory.push({
    editedBy: userId,
    field: fieldPath,
    previousValue,
    newValue,
    reason: reason || "Manual edit",
  });

  this.markModified("summaryOutput");
  return await this.save();
};

// Method to approve summary (physician sign-off)
SummarySchema.methods.approve = async function (doctorId, notes) {
  if (this.status === "final") {
    throw new Error("Summary is already finalized");
  }

  // Verify user is a doctor
  const User = mongoose.model("User");
  const doctor = await User.findById(doctorId);

  if (!doctor || doctor.role !== "doctor") {
    throw new Error("Only doctors can sign off summaries");
  }

  this.status = "final";
  this.signedOffBy = doctorId;
  this.signedOffAt = new Date();

  if (notes) {
    this.reviewNotes = notes;
  }

  return await this.save();
};

// Method to mark as reviewed (intermediate step)
SummarySchema.methods.markReviewed = async function (userId, notes) {
  this.status = "reviewed";

  if (notes) {
    this.reviewNotes = notes;
  }

  this.editHistory.push({
    editedBy: userId,
    field: "status",
    previousValue: "draft",
    newValue: "reviewed",
    reason: "Marked as reviewed",
  });

  return await this.save();
};

// Static method to get pending summaries for doctor
SummarySchema.statics.getPendingSummaries = function (doctorId = null) {
  const query = {
    status: { $in: ["draft", "reviewed"] },
  };

  const queryBuilder = this.find(query)
    .populate("patientId", "firstName lastName mrn")
    .populate("createdBy", "firstName lastName email")
    .sort({ createdAt: -1 });

  // If doctorId provided, filter by assigned doctor
  if (doctorId) {
    return queryBuilder.then(async (summaries) => {
      const Patient = mongoose.model("Patient");
      const filtered = [];

      for (const summary of summaries) {
        const patient = await Patient.findById(summary.patientId);
        if (
          patient &&
          patient.assigned.doctorId.toString() === doctorId.toString()
        ) {
          filtered.push(summary);
        }
      }

      return filtered;
    });
  }

  return queryBuilder;
};

// Static method to get summary statistics
SummarySchema.statics.getStatistics = async function (
  patientId,
  startDate,
  endDate
) {
  const pipeline = [
    {
      $match: {
        patientId: mongoose.Types.ObjectId(patientId),
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        avgConfidence: { $avg: "$confidence" },
        avgGenerationTime: { $avg: "$modelMetadata.generation_time_ms" },
      },
    },
  ];

  return await this.aggregate(pipeline);
};

// Pre-save hook to validate and compute metrics
SummarySchema.pre("save", function (next) {
  // Compute confidence based on saliency scores
  if (this.saliencyMap && this.saliencyMap.length > 0) {
    const avgSaliency =
      this.saliencyMap.reduce((sum, item) => sum + item.score, 0) /
      this.saliencyMap.length;

    // If confidence not set, use average saliency
    if (!this.confidence || this.confidence === 0.5) {
      this.confidence = avgSaliency;
    }
  }

  // Flag low confidence summaries
  if (this.confidence < 0.5 && !this.modelMetadata.flags) {
    this.modelMetadata.flags = ["low_confidence"];
  }

  next();
});

export default mongoose.model("Summary", SummarySchema);
