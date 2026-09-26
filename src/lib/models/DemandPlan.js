import mongoose from "mongoose";

const demandLineSchema = new mongoose.Schema(
  {
    productType: { type: String, required: true, trim: true },
    estimatedDemand: { type: String, default: "" },
    unit: { type: String, default: "" },
    estimatedDeliveryDate: { type: String, default: "" },
  },
  { _id: false }
);

// A demand plan is revised, not edited-in-place: `name` stays the same
// string across a whole chain ("Demand Plan #1"), while each revision is
// its own document pointing at the one it replaces via previousVersionId.
// The hub lists every plan and shows "(Revision N)" next to the name -
// there's no separate chain-root lookup table, since for this volume a
// client-side "newest first" list is simpler than building history
// browsing.
const demandPlanSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    revisionNumber: { type: Number, default: 1 },
    previousVersionId: { type: mongoose.Schema.Types.ObjectId, ref: "DemandPlan", default: null },
    lines: { type: [demandLineSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.DemandPlan || mongoose.model("DemandPlan", demandPlanSchema);
