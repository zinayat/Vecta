import mongoose from "mongoose";

// A shift is a week-long window this assignment runs in (start/end date),
// not a recurring daily time-of-day pattern - a plan is built one shift
// at a time as the schedule for that specific week takes shape.
const shiftSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    startDate: { type: String, default: "" },
    endDate: { type: String, default: "" },
  },
  { _id: true, timestamps: false }
);

// Which people run a given step of the linked process - keyed by that
// step's own _id (a step lives on the Process document, not here), so
// staffing is tracked per step rather than one flat list of people for
// the whole assignment. stepId isn't `ref`'d since it points at a
// subdocument (Process.steps[]._id), not another top-level collection.
const stepAssignmentSchema = new mongoose.Schema(
  {
    stepId: { type: mongoose.Schema.Types.ObjectId, required: true },
    userIds: { type: [mongoose.Schema.Types.ObjectId], ref: "User", default: [] },
  },
  { _id: false }
);

// One line of the plan: "this process runs, staffed by these teams (and,
// per step, these people), across these shifts, targeting this output
// and downtime." A process can appear in more than one assignment (e.g.
// different weeks or different shift patterns).
const assignmentSchema = new mongoose.Schema(
  {
    processId: { type: mongoose.Schema.Types.ObjectId, ref: "Process", required: true },
    teamIds: { type: [mongoose.Schema.Types.ObjectId], ref: "Team", default: [] },
    shifts: { type: [shiftSchema], default: [] },
    stepAssignments: { type: [stepAssignmentSchema], default: [] },
    plannedOutput: { type: String, default: "" },
    plannedDowntime: { type: String, default: "" },
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
