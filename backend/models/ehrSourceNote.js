import mongoose from "mongoose";

const EHRSourceNoteSchema = new mongoose.Schema(
  {
    encounterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Encounter",
      required: true,
    },
    noteType: {
      type: String,
      enum: ["EM Clinician", "Consult", "Progress", "Procedure"],
      required: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    authorRole: {
      type: String,
      required: true,
    },
    creationTimestamp: {
      type: Date,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

// For very large notes, consider implementing GridFS pattern here
// or create a reference to another collection that uses GridFS

export default mongoose.model("EHRSourceNote", EHRSourceNoteSchema);
