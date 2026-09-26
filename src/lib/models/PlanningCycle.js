import mongoose from "mongoose";

// One phase's tracking + its route-specific inputs. `inputs` is Mixed
// (like a dashboard widget's config) since its actual shape depends on
// both which phase this is and which route the cycle is on - see
// lib/planningMeta.js's PHASE_FIELD_CONFIG for what each combination
// collects, and lib/planningCalc.js for what gets computed from it.
const phaseSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ["notStarted", "inProgress", "done"], default: "notStarted" },
    ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    date: { type: String, default: "" },
    notes: { type: String, default: "" },
    inputs: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
  },
  { _id: false }
);

// A functioning planning cycle - not just a reference table. Picks one
// route (Make-to-Stock or Make-to-Order) and tracks the five core
// planning phases against it, each with real data entry and a computed
// result (lib/planningCalc.js), not just descriptive text. Switching
// `route` doesn't clear or migrate a phase's `inputs` - the old route's
// keys are just left unread until re-entered under the new one.
const planningCycleSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    route: { type: String, enum: ["MTS", "MTO"], required: true },
    demandPlanning: { type: phaseSchema, default: () => ({}) },
    sop: { type: phaseSchema, default: () => ({}) },
    masterScheduling: { type: phaseSchema, default: () => ({}) },
    capacityPlanning: { type: phaseSchema, default: () => ({}) },
    materialPlanning: { type: phaseSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export default mongoose.models.PlanningCycle || mongoose.model("PlanningCycle", planningCycleSchema);
