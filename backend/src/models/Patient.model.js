import mongoose, { Schema } from "mongoose";

const patientSchema = new Schema(
  {
    clinicalNotes: [
      { type: mongoose.Schema.Types.ObjectId, ref: "ClinicalNote" },
    ],
    labReports: [{ type: mongoose.Schema.Types.ObjectId, ref: "LabReport" }],
    patientId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      required: true,
      min: 0,
      max: 150,
    },
    gender: {
      type: String,
      required: true,
      enum: ["male", "female", "other"],
    },
    contact: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    medicalHistory: {
      type: String,
    },
    allergies: [
      {
        type: String,
        trim: true,
      },
    ],
    bloodGroup: {
      type: String,
    },
    cardNumber: {
      type: String,
      trim: true,
      required: false,
    },
    assignedClinician: {
      type: String,
    },
    registeredBy: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// patientSchema.index({ patientId: 1 });
patientSchema.index({ name: 1 });

export default mongoose.model("Patient", patientSchema);
