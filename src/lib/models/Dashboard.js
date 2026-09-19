import mongoose from "mongoose";

// A dashboard is just a named collection of widgets - the "building block"
// idea: each widget is a self-contained type + config, so new widget types
// can be added later without touching the dashboards that already exist.
const widgetSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["kpi", "note", "projectList", "hoshinSummary"], required: true },
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
  },
  { timestamps: true }
);

export default mongoose.models.Dashboard || mongoose.model("Dashboard", dashboardSchema);
