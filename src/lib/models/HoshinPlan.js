import mongoose from "mongoose";

// The primary structure: a standard spreadsheet-style cascade rather than
// four independent lists. Breakthrough Objective (3-5yr) -> Annual
// Objective (1yr) -> Strategy/Project row, and each strategy row carries
// its own Target/KPI and Owner - exactly the 5-column Hoshin catchball
// table (Breakthrough | Annual | Strategy | Target/KPI | Owner), just
// expressed as nested arrays so the UI can group rows by objective instead
// of repeating text in every row.
const strategySchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true }, // Strategy / Project / Improvement Priority
    target: { type: String, default: "" }, // Target / KPI value
    ownerName: { type: String, default: "" }, // Owner / Accountability
    // KPI Builder fields - same shape used on a Dashboard KPI tile's
    // config and a Project's successMeasure, so "define a KPI" is
    // consistent everywhere it appears.
    unit: { type: String, default: "" },
    measurementType: { type: String, enum: ["Percentage", "Count", "Currency", "Duration", "Ratio"], default: "Count" },
    direction: { type: String, enum: ["higherIsBetter", "lowerIsBetter"], default: "higherIsBetter" },
    whatSuccessLooksLike: { type: String, default: "" },
  },
  { _id: true, timestamps: false }
);

const annualObjectiveNodeSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    strategies: { type: [strategySchema], default: [] },
  },
  { _id: true, timestamps: false }
);

const breakthroughObjectiveSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    annualObjectives: { type: [annualObjectiveNodeSchema], default: [] },
  },
  { _id: true, timestamps: false }
);

// Legacy flat-list shape, kept only so plans created before this redesign
// don't lose their old data. The new editor UI no longer reads or writes
// these - see breakthroughObjectives instead.
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
    rowId: { type: String, required: true }, // an annual objective node's _id
    colId: { type: String, required: true }, // improvementPriorities[]._id (legacy), or a Project._id for projectCorrelations
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

    breakthroughObjectives: { type: [breakthroughObjectiveSchema], default: [] },

    // Legacy fields - untouched by the new editor, kept for plans created
    // before this redesign.
    longTermObjectives: { type: [listItemSchema], default: [] },
    annualObjectives: { type: [listItemSchema], default: [] },
    improvementPriorities: { type: [listItemSchema], default: [] },
    metrics: { type: [listItemSchema], default: [] },
    correlations: { type: [correlationSchema], default: [] },

    // The X-Matrix view's own linkage - (flattened) Annual Objectives x
    // actual linked Projects, since the X-Matrix's "north" axis is live
    // Project records rather than a free-text list.
    projectCorrelations: { type: [correlationSchema], default: [] },
    raci: { type: [raciEntrySchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.HoshinPlan || mongoose.model("HoshinPlan", hoshinPlanSchema);
