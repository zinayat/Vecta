import mongoose from "mongoose";

// An observation's photos are stored as data URIs directly on the
// document rather than in a separate file/blob store - there's no file
// storage service configured anywhere else in this app, and a handful of
// client-compressed photos per observation stays well within Mongo's
// document size limit. Simpler than standing up storage infrastructure
// for what's meant to be a quick "snap a photo, note what you saw" flow.
const observationSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true, trim: true }, // YYYY-MM-DD - when it was observed, not necessarily today
    text: { type: String, default: "" },
    tagIds: { type: [mongoose.Schema.Types.ObjectId], ref: "Tag", default: [] },
    images: { type: [String], default: [] }, // data: URIs
    // Which dashboards this observation should show up on - deliberately
    // a plain array of ids rather than one tier/team, since the same
    // observation can matter to several teams' boards at once (e.g. a
    // safety issue that belongs on both the line's T1 and the plant's T2).
    dashboardIds: { type: [mongoose.Schema.Types.ObjectId], ref: "Dashboard", default: [] },
    status: { type: String, enum: ["open", "converted"], default: "open" },
    // Set once converted - the observation itself becomes a read-only
    // record at that point (see Task.observationId for the other side of
    // the link); everything about actually resolving it moves to the task.
    convertedTaskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", default: null },
    convertedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.Observation || mongoose.model("Observation", observationSchema);
