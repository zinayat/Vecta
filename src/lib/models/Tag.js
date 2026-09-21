import mongoose from "mongoose";

// User-created, company-scoped labels for filtering tasks - deliberately
// separate from a task's category or list, since the same tag ("Safety",
// "Shift 1") might cut across many different lists and standalone tasks.
const tagSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    name: { type: String, required: true, trim: true },
    color: { type: String, default: "#2563eb" },
    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Tag || mongoose.model("Tag", tagSchema);
