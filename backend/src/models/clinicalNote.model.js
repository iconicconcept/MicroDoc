import mongoose from "mongoose";

const clinicalNoteSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    clinicianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["clinical", "lab", "procedure"],
      default: "clinical",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    transcript: {
      type: String,
      trim: true,
    },
    summary: {
      type: String,
      trim: true,
    },
    chiefComplaint: { type: String },
    diagnosis: { type: String },
    plan: { type: String },
    isSynced: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Indexes for fast search
clinicalNoteSchema.index({ patientId: 1, createdAt: -1 });
clinicalNoteSchema.index({ clinicianId: 1, createdAt: -1 });

export default mongoose.model("ClinicalNote", clinicalNoteSchema);
