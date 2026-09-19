import mongoose from "mongoose";

// One Project model covers both improvement templates the product needs to
// support (A3 problem-solving and CapEx requests) - type picks which of the
// two embedded sub-shapes is actually in use. Keeping them in one collection
// lets a single dashboard "Project List" widget and a single Hoshin linkage
// list either kind of project without a union query.
const a3Schema = new mongoose.Schema(
  {
    background: { type: String, default: "" },
    currentCondition: { type: String, default: "" },
    goal: { type: String, default: "" },
    rootCause: { type: String, default: "" },
    countermeasures: { type: String, default: "" },
    implementationPlan: { type: String, default: "" },
    followUp: { type: String, default: "" },
  },
  { _id: false }
);

const capexSchema = new mongoose.Schema(
  {
    budgetRequested: { type: Number, default: null },
    budgetApproved: { type: Number, default: null },
    expectedROI: { type: String, default: "" },
    paybackPeriodMonths: { type: Number, default: null },
    approvalStatus: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
    justification: { type: String, default: "" },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["A3", "CapEx"], required: true },
    status: { type: String, enum: ["Draft", "Active", "OnHold", "Completed", "Cancelled"], default: "Draft" },
    ownerName: { type: String, default: "" },
    // improvementPriorities/annualObjectives are subdocuments of HoshinPlan, not
    // their own collection, so hoshinPriorityId is just the subdocument's _id
    // as a string rather than a $ref-able ObjectId.
    hoshinPlanId: { type: mongoose.Schema.Types.ObjectId, ref: "HoshinPlan", default: null },
    hoshinPriorityId: { type: String, default: null },
    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    a3: { type: a3Schema, default: () => ({}) },
    capex: { type: capexSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export default mongoose.models.Project || mongoose.model("Project", projectSchema);
