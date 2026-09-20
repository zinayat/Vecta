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
    colId: { type: String, required: true }, // improvementPriorities[]._id, or a Project._id for projectCorrelations
    strength: { type: String, enum: ["primary", "secondary"], required: true },
  },
  { _id: false }
);

// A stakeholder's accountability on this plan - Responsible/Accountable/
// Consulted/Informed. Plan-level (not per-project), matching how the small
// "who" panel on a classic X-Matrix is normally used.
const raciEntrySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["Responsible", "Accountable", "Consulted", "Informed"], required: true },
  },
  { _id: true, timestamps: false }
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
    // The classic X-Matrix view's own linkage - Annual Objectives x actual
    // linked Projects (not the free-text improvementPriorities list), since
    // the X-Matrix's "north" axis is live Project records.
    projectCorrelations: { type: [correlationSchema], default: [] },
    raci: { type: [raciEntrySchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.HoshinPlan || mongoose.model("HoshinPlan", hoshinPlanSchema);
