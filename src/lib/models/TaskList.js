import mongoose from "mongoose";

// A named, one-off collection of tasks ("Plant startup task list", "Daily
// gemba walk task list") - the tasks themselves live in the Task
// collection with a taskListId back-reference, rather than embedded here,
// so a task's own page/API doesn't need to reach into a parent list's
// subdocument array to update it. A list can itself depend on another
// task or list, same {type, id} shape as a task's own dependencies.
const dependencySchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["task", "list"], required: true },
    id: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { _id: false }
);

// Same one-clock-per-series shape as a Task's own recurrence (see
// Task.js) - recreating a recurring list clones the whole list (name,
// description) and every task currently in it, fresh, into a brand new
// TaskList, rather than resetting the original in place.
const recurrenceSchema = new mongoose.Schema(
  {
    frequency: { type: String, enum: ["daily", "weekly", "monthly", "quarterly", "annually"], default: null },
    active: { type: Boolean, default: true },
    nextOccurrenceDate: { type: String, default: null },
  },
  { _id: false }
);

// A list carries the same scheduling/ownership info a task does - its own
// start/due date, status, RACI, tags - on top of being a container for
// individual task items. The two are independent signals: the list's own
// status is "is this checklist as a whole on track," separate from how
// many of its individual items are done.
const taskListSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    startDate: { type: String, default: "" },
    dueDate: { type: String, default: "" },
    status: { type: String, enum: ["notStarted", "inProgress", "done"], default: "notStarted" },
    assigneeUserIds: { type: [mongoose.Schema.Types.ObjectId], ref: "User", default: [] },
    assigneeTeamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
    raci: {
      accountableUserIds: { type: [mongoose.Schema.Types.ObjectId], ref: "User", default: [] },
      consultedUserIds: { type: [mongoose.Schema.Types.ObjectId], ref: "User", default: [] },
      informedUserIds: { type: [mongoose.Schema.Types.ObjectId], ref: "User", default: [] },
    },
    tagIds: { type: [mongoose.Schema.Types.ObjectId], ref: "Tag", default: [] },
    dependencies: { type: [dependencySchema], default: [] },
    recurrence: { type: recurrenceSchema, default: () => ({}) },
    recurrenceRootId: { type: mongoose.Schema.Types.ObjectId, ref: "TaskList", default: null },
  },
  { timestamps: true }
);

export default mongoose.models.TaskList || mongoose.model("TaskList", taskListSchema);
