import mongoose from "mongoose";

// One line of the plan: "this process runs, staffed by these teams and/or
// these people, on this schedule, targeting this output." A process can
// appear in more than one assignment (e.g. different shifts), and an
// assignment can name teams, individual people, or both at once.
const assignmentSchema = new mongoose.Schema(
  {
    processId: { type: mongoose.Schema.Types.ObjectId, ref: "Process", required: true },
    teamIds: { type: [mongoose.Schema.Types.ObjectId], ref: "Team", default: [] },
    userIds: { type: [mongoose.Schema.Types.ObjectId], ref: "User", default: [] },
    schedule: { type: String, default: "" },
    plannedOutput: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { _id: true, timestamps: false }
);

const operationsPlanSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    assignments: { type: [assignmentSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.OperationsPlan || mongoose.model("OperationsPlan", operationsPlanSchema);
