import mongoose, { Schema, Document } from "mongoose";

const analyticsSchema = new Schema()(
  {
    type: {
      type: String,
      required: true,
      enum: ["daily", "weekly", "monthly"],
    },
    date: {
      type: Date,
      required: true,
    },
    metrics: {
      totalUsers: { type: Number, default: 0 },
      activeUsers: { type: Number, default: 0 },
      totalPatients: { type: Number, default: 0 },
      clinicalNotes: { type: Number, default: 0 },
      labReports: { type: Number, default: 0 },
      pendingReports: { type: Number, default: 0 },
      averageBurnoutRisk: { type: Number, default: 0 },
      departmentStats: [
        {
          department: String,
          userCount: Number,
          noteCount: Number,
          reportCount: Number,
        },
      ],
      userActivity: [
        {
          userId: { type: Schema.Types.ObjectId, ref: "User" },
          noteCount: Number,
          reportCount: Number,
          loginCount: Number,
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient querying
analyticsSchema.index({ type: 1, date: -1 });

export default mongoose.model("Analytics", analyticsSchema);
