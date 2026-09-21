import mongoose from "mongoose";

// A dependency can point at either another Task or an entire TaskList -
// stored as a loose {type, id} pointer rather than two separate arrays, so
// "depends on" reads as one list regardless of what kind of thing it
// points to. Informational only (a "Blocked by" note on the task) - Vecta
// doesn't hard-enforce it, same honest approach as everywhere else nothing
// here is a real workflow engine.
const dependencySchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["task", "list"], required: true },
    id: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { _id: false }
);

// "Assigned to" IS the RACI Responsible role, not a separate field - one
// set of people/team to manage instead of two that could quietly drift
// apart. RACI's other three roles (Accountable/Consulted/Informed) are
// real User references, not free-text names like Hoshin's RACI - a task's
// whole point is tracking who-does-what against actual accounts, so
// "my tasks" can be a real query instead of a name-matching guess.
const taskSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    // Null for a standalone task - set when this task belongs to a
    // TaskList ("Plant startup task list", "Daily gemba walk task list").
    taskListId: { type: mongoose.Schema.Types.ObjectId, ref: "TaskList", default: null, index: true },
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
  },
  { timestamps: true }
);

export default mongoose.models.Task || mongoose.model("Task", taskSchema);
