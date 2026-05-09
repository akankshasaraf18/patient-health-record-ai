import mongoose from "mongoose";

const EntrySchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "Patient ID is required"],
      index: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author ID is required"],
    },
    timestamp: {
      type: Date,
      required: [true, "Timestamp is required"],
      default: Date.now,
      index: true,
    },
    shift: {
      type: String,
      enum: {
        values: ["day", "night"],
        message: "{VALUE} is not a valid shift",
      },
      required: [true, "Shift is required"],
    },
    type: {
      type: String,
      enum: {
        values: [
          "vital",
          "medication",
          "note",
          "assessment",
          "event",
          "lab",
          "procedure",
          "intake_output",
        ],
        message: "{VALUE} is not a valid entry type",
      },
      required: [true, "Entry type is required"],
      index: true,
    },
    payload: {
      // For vitals
      HR: {
        type: Number,
        min: 0,
        max: 300,
      },
      BP: String, // e.g., "120/80"
      BP_systolic: {
        type: Number,
        min: 0,
        max: 300,
      },
      BP_diastolic: {
        type: Number,
        min: 0,
        max: 200,
      },
      Temp: {
        type: Number,
        min: 20,
        max: 115, // Supports both Celsius (20-45) and Fahrenheit (95-115)
      },
      RR: {
        type: Number,
        min: 0,
        max: 100,
      },
      O2Sat: {
        type: Number,
        min: 0,
        max: 100,
      },
      pain_scale: {
        type: Number,
        min: 0,
        max: 10,
      },

      // For medications
      medication_name: String,
      dose: String,
      route: {
        type: String,
        enum: [
          "PO",
          "IV",
          "IM",
          "SC",
          "SL",
          "PR",
          "Topical",
          "Inhaled",
          "Other",
          "subcutaneous",
        ],
      },
      frequency: String,
      administered_time: Date,
      reason: String,

      // For labs
      lab_name: String,
      lab_value: mongoose.Schema.Types.Mixed,
      lab_unit: String,
      lab_reference_range: String,
      abnormal: Boolean,

      // For imaging
      imaging_type: String,
      imaging_result: String,
      imaging_report: String,

      // For procedures
      procedure_name: String,
      procedure_notes: String,

      // For consults
      consult_specialty: String,
      consult_provider: String,
      consult_recommendation: String,

      // For notes and events
      text: String,
      category: String,
      severity: {
        type: String,
        enum: ["routine", "important", "urgent", "critical"],
      },

      // Additional flexible data
      custom_fields: mongoose.Schema.Types.Mixed,
    },
    // Optional notes field for additional context on any entry type
    notes: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      enum: {
        values: ["nurse", "system", "import", "doctor"],
        message: "{VALUE} is not a valid source",
      },
      default: "nurse",
    },
    edited: {
      type: Boolean,
      default: false,
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
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
EntrySchema.index({ patientId: 1, timestamp: -1 });
EntrySchema.index({ patientId: 1, type: 1, timestamp: -1 });
EntrySchema.index({ patientId: 1, shift: 1, timestamp: -1 });
EntrySchema.index({ authorId: 1, timestamp: -1 });
EntrySchema.index({ isDeleted: 1, timestamp: -1 });

// Virtual for formatted timestamp
EntrySchema.virtual("formattedTimestamp").get(function () {
  return this.timestamp.toLocaleString();
});

// Method to edit entry
EntrySchema.methods.editEntry = async function (userId, updates, reason) {
  const changes = [];

  for (const [key, value] of Object.entries(updates)) {
    if (key.startsWith("payload.")) {
      const field = key.split(".")[1];
      if (this.payload[field] !== value) {
        changes.push({
          editedBy: userId,
          field: key,
          previousValue: this.payload[field],
          newValue: value,
          reason,
        });
        this.payload[field] = value;
      }
    } else if (this[key] !== value) {
      changes.push({
        editedBy: userId,
        field: key,
        previousValue: this[key],
        newValue: value,
        reason,
      });
      this[key] = value;
    }
  }

  if (changes.length > 0) {
    this.editHistory.push(...changes);
    this.edited = true;
  }

  return await this.save();
};

// Method to soft delete
EntrySchema.methods.softDelete = async function (userId, reason) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;

  this.editHistory.push({
    editedBy: userId,
    field: "isDeleted",
    previousValue: false,
    newValue: true,
    reason: reason || "Entry deleted",
  });

  return await this.save();
};

// Static method to get entries for a patient in a time range
EntrySchema.statics.findByPatientAndTimeRange = function (
  patientId,
  startTime,
  endTime,
  options = {}
) {
  const query = {
    patientId,
    timestamp: { $gte: startTime, $lte: endTime },
    isDeleted: false,
  };

  if (options.type) {
    query.type = options.type;
  }

  if (options.shift) {
    query.shift = options.shift;
  }

  return this.find(query)
    .populate("authorId", "firstName lastName role shift")
    .sort({ timestamp: options.sortOrder === "asc" ? 1 : -1 });
};

// Static method to get latest vitals
EntrySchema.statics.getLatestVitals = function (patientId) {
  return this.findOne({
    patientId,
    type: "vitals",
    isDeleted: false,
  })
    .sort({ timestamp: -1 })
    .populate("authorId", "firstName lastName role");
};

// Static method to get all medications in time range
EntrySchema.statics.getMedicationHistory = function (
  patientId,
  startTime,
  endTime
) {
  return this.find({
    patientId,
    type: "medication",
    timestamp: { $gte: startTime, $lte: endTime },
    isDeleted: false,
  })
    .sort({ timestamp: -1 })
    .populate("authorId", "firstName lastName role");
};

// Pre-save hook to validate payload based on type
EntrySchema.pre("save", function (next) {
  // Validate payload based on type
  if (this.type === "vitals") {
    if (
      !this.payload.HR &&
      !this.payload.BP &&
      !this.payload.Temp &&
      !this.payload.RR &&
      !this.payload.O2Sat
    ) {
      return next(new Error("Vitals entry must have at least one vital sign"));
    }
  }

  if (this.type === "medication") {
    if (!this.payload.medication_name) {
      return next(new Error("Medication entry must have medication_name"));
    }
  }

  if (this.type === "note" || this.type === "event") {
    if (!this.payload.text) {
      return next(new Error("Note/Event entry must have text"));
    }
  }

  next();
});

export default mongoose.model("Entry", EntrySchema);
