import mongoose from "mongoose";

// A team's outcome can optionally trace back to a specific Breakthrough
// Objective on a Hoshin plan - denormalized (planId/planName/text snapshot
// at link time), same pattern as a dashboard KPI tile's hoshinLink, so
// rendering never needs to resolve a nested subdocument by id across
// collections.
const hoshinLinkSchema = new mongoose.Schema(
  {
    planId: { type: mongoose.Schema.Types.ObjectId, ref: "HoshinPlan", required: true },
    planName: { type: String, required: true },
    breakthroughObjectiveId: { type: String, required: true },
    breakthroughObjectiveText: { type: String, required: true },
  },
  { _id: false }
);

const outcomeSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    cadence: { type: String, enum: ["Annual", "Quarterly"], required: true },
    hoshinLink: { type: hoshinLinkSchema, default: null },
  },
  { _id: true, timestamps: false }
);

const teamSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    name: { type: String, required: true, trim: true },
    purpose: { type: String, default: "" }, // why this team exists
    outcomes: { type: [outcomeSchema], default: [] },
    // The team's single general-purpose dashboard - distinct from its tier
    // boards below, which are specifically the T1/T2/T3 meeting cadence.
    mainDashboardId: { type: mongoose.Schema.Types.ObjectId, ref: "Dashboard", default: null },
    dashboardIds: { type: [mongoose.Schema.Types.ObjectId], ref: "Dashboard", default: [] }, // linked tier boards
    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Team || mongoose.model("Team", teamSchema);
