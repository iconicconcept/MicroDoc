import mongoose, { Schema } from "mongoose";

const labReportSchema = new Schema(
  {
    sampleId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    microbiologistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    testType: {
      type: String,
      required: true,
      trim: true,
      // enum: [
      //   "gram_stain",
      //   "culture_sensitivity",
      //   "pcr",
      //   "antigen",
      //   "other",
      // ],
    },

    specimenType: {
      type: String,
      trim: true,
    },

    testDate: {
      type: Date,
      default: Date.now,
    },

    requestedBy: {
      type: String,
      trim: true,
    },

    pathogen: {
      type: String,
      trim: true,
    },

    resultSummary: {
      type: String,
      trim: true,
    },

    results: {
      type: String,
      trim: true,
    },

    antibioticSensitivity: [
      {
        type: String,
        trim: true,
      },
    ],

    findings: {
      type: String,
      trim: true,
    },

    remarks: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ["pending", "completed", "reviewed", "cancelled"],
      default: "pending",
    },

    aiSuggestions: [
      {
        type: String,
        trim: true,
      },
    ],

    isSynced: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast queries
labReportSchema.index({ patientId: 1 });
labReportSchema.index({ microbiologistId: 1 });
labReportSchema.index({ status: 1 });
labReportSchema.index({ isSynced: 1 });

export default mongoose.model("LabReport", labReportSchema);
