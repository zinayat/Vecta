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

const taskListSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    dependencies: { type: [dependencySchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.TaskList || mongoose.model("TaskList", taskListSchema);
