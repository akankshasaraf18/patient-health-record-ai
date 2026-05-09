import mongoose from "mongoose";

const PatientSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "Patient first name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Patient last name is required"],
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: [true, "Date of birth is required"],
      validate: {
        validator: function (value) {
          return value <= new Date();
        },
        message: "Date of birth cannot be in the future",
      },
    },
    mrn: {
      type: String,
      required: [true, "MRN (Medical Record Number) is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    diagnosis: {
      type: String,
      required: [true, "Diagnosis is required"],
      trim: true,
    },
    assignedDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Assigned doctor is required"],
    },
    dayNurse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      validate: {
        validator: async function (value) {
          if (!value) return true; // Optional field
          const User = mongoose.model("User");
          const nurse = await User.findById(value);
          return nurse && nurse.role === "nurse" && nurse.shift === "day";
        },
        message: "Assigned day nurse must have day shift",
      },
    },
    nightNurse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      validate: {
        validator: async function (value) {
          if (!value) return true; // Optional field
          const User = mongoose.model("User");
          const nurse = await User.findById(value);
          return nurse && nurse.role === "nurse" && nurse.shift === "night";
        },
        message: "Assigned night nurse must have night shift",
      },
    },
    admissionDate: {
      type: Date,
      required: [true, "Admission date is required"],
      default: Date.now,
    },
    dischargeDate: {
      type: Date,
      default: null,
      validate: {
        validator: function (value) {
          if (!value) return true;
          return value >= this.admissionDate;
        },
        message: "Discharge date must be after admission date",
      },
    },
    status: {
      type: String,
      enum: ["active", "discharged", "transferred"],
      default: "active",
    },
    metadata: {
      age: Number,
      gender: {
        type: String,
        enum: ["M", "F", "Other", "Prefer not to say"],
      },
      allergies: [String],
      code_status: String,
      isolation_precautions: [String],
      room: String,
      bed: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
PatientSchema.index({ mrn: 1 }, { unique: true });
PatientSchema.index({ status: 1, createdAt: -1 });
PatientSchema.index({ assignedDoctor: 1 });
PatientSchema.index({ dayNurse: 1 });
PatientSchema.index({ nightNurse: 1 });

// Virtual for age calculation
PatientSchema.virtual("age").get(function () {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
});

// Virtual for length of stay
PatientSchema.virtual("lengthOfStay").get(function () {
  if (!this.admissionDate) return 0;
  const endTime = this.dischargeDate || new Date();
  const diffMs = endTime - this.admissionDate;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)); // days
});

// Method to discharge patient
PatientSchema.methods.discharge = async function () {
  this.dischargeDate = new Date();
  this.status = "discharged";
  return await this.save();
};

// Method to update nurse assignment
PatientSchema.methods.updateNurseAssignment = async function (shift, nurseId) {
  const User = mongoose.model("User");
  const nurse = await User.findById(nurseId);

  if (!nurse || nurse.role !== "nurse" || nurse.shift !== shift) {
    throw new Error(`Invalid ${shift} nurse assignment`);
  }

  if (shift === "day") {
    this.dayNurse = nurseId;
  } else if (shift === "night") {
    this.nightNurse = nurseId;
  }

  return await this.save();
};

// Method to check if user has access to patient
PatientSchema.methods.hasAccess = function (userId, userRole) {
  const userIdStr = userId.toString();

  if (userRole === "admin") return true;

  if (userRole === "doctor") {
    // Handle both populated (object) and unpopulated (ObjectId) assignedDoctor
    const doctorId = this.assignedDoctor?._id || this.assignedDoctor;
    return doctorId?.toString() === userIdStr;
  }

  if (userRole === "nurse") {
    // Handle both populated and unpopulated nurse fields
    const dayNurseId = this.dayNurse?._id || this.dayNurse;
    const nightNurseId = this.nightNurse?._id || this.nightNurse;

    return (
      dayNurseId?.toString() === userIdStr ||
      nightNurseId?.toString() === userIdStr
    );
  }

  return false;
};

// Static method to find patients by nurse
PatientSchema.statics.findByNurse = function (nurseId, shift = null) {
  const query = { status: "active" };

  if (shift === "day") {
    query.dayNurse = nurseId;
  } else if (shift === "night") {
    query.nightNurse = nurseId;
  } else {
    query.$or = [{ dayNurse: nurseId }, { nightNurse: nurseId }];
  }

  return this.find(query)
    .populate("assignedDoctor", "firstName lastName email")
    .populate("dayNurse", "firstName lastName email shift")
    .populate("nightNurse", "firstName lastName email shift")
    .sort({ admissionDate: -1 });
};

// Static method to find patients by doctor
PatientSchema.statics.findByDoctor = function (doctorId) {
  return this.find({
    assignedDoctor: doctorId,
    status: "active",
  })
    .populate("dayNurse", "firstName lastName email shift")
    .populate("nightNurse", "firstName lastName email shift")
    .sort({ admissionDate: -1 });
};

export default mongoose.model("Patient", PatientSchema);
