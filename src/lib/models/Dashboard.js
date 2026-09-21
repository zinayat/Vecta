import mongoose from "mongoose";

// A dashboard is just a named collection of widgets - the "building block"
// idea: each widget is a self-contained type + config, so new widget types
// can be added later without touching the dashboards that already exist.
const widgetSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["kpi", "stat", "note", "projectList", "hoshinSummary", "timer", "section"], required: true },
    title: { type: String, default: "" },
    config: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: true, timestamps: false }
);

const dashboardSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    name: { type: String, required: true, trim: true },
    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    widgets: { type: [widgetSchema], default: [] },
    // Purely visual - "executive" gets larger numbers, more whitespace, a
    // muted palette. Set automatically on one-click-generated dashboards.
    theme: { type: String, enum: ["default", "executive"], default: "default" },
    // Set when this dashboard was created by the one-click tier-board
    // generator, so generated dashboards can be recognized/grouped and
    // traced back to the Hoshin plan they were built from.
    tier: { type: String, enum: ["T1", "T2", "T3"], default: null },
    hoshinPlanId: { type: mongoose.Schema.Types.ObjectId, ref: "HoshinPlan", default: null },
    // Set when this dashboard was created from a Team's page (its main
    // dashboard or one of its tier boards) - teams drive dashboard/tier
    // board creation, so a dashboard traces back to its owning team the
    // same way it traces back to a Hoshin plan.
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
  },
  { timestamps: true }
);

export default mongoose.models.Dashboard || mongoose.model("Dashboard", dashboardSchema);
