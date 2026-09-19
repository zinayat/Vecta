import mongoose from "mongoose";

// A simplified X-Matrix: four lists (long-term breakthrough objectives, this
// year's annual objectives, the improvement priorities/tactics that will
// move them, and the metrics used to track it) plus a correlation grid
// linking Annual Objectives (rows) to Improvement Priorities (columns) -
// the catchball linkage most Hoshin practice actually runs on day to day.
const listItemSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    ownerName: { type: String, default: "" },
    target: { type: String, default: "" },
  },
  { _id: true, timestamps: false }
);

const correlationSchema = new mongoose.Schema(
  {
    rowId: { type: String, required: true }, // annualObjectives[]._id
    colId: { type: String, required: true }, // improvementPriorities[]._id
    strength: { type: String, enum: ["primary", "secondary"], required: true },
  },
  { _id: false }
);

const hoshinPlanSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    name: { type: String, required: true, trim: true },
    fiscalYear: { type: Number, required: true },
    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    longTermObjectives: { type: [listItemSchema], default: [] },
    annualObjectives: { type: [listItemSchema], default: [] },
    improvementPriorities: { type: [listItemSchema], default: [] },
    metrics: { type: [listItemSchema], default: [] },
    correlations: { type: [correlationSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.HoshinPlan || mongoose.model("HoshinPlan", hoshinPlanSchema);
