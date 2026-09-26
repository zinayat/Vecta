import mongoose from "mongoose";

const dailyEntrySchema = new mongoose.Schema(
  { date: { type: String, required: true }, quantity: { type: String, default: "0" } },
  { _id: false }
);

const weeklyEntrySchema = new mongoose.Schema(
  {
    weekStart: { type: String, required: true },
    quantity: { type: String, default: "0" },
    // Empty until the user explicitly rolls THIS week out to days - daily
    // detail is an on-demand drill-down per week, not something generated
    // for the whole horizon up front.
    dailyBreakdown: { type: [dailyEntrySchema], default: [] },
  },
  { _id: false }
);

const productionLineSchema = new mongoose.Schema(
  {
    productType: { type: String, required: true, trim: true },
    unit: { type: String, default: "" },
    totalQuantity: { type: String, default: "" },
    deliveryDate: { type: String, default: "" },
    // Empty until the user rolls this line out to weeks.
    weeklyBreakdown: { type: [weeklyEntrySchema], default: [] },
  },
  { _id: false }
);

const productionPlanSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    demandPlanId: { type: mongoose.Schema.Types.ObjectId, ref: "DemandPlan", required: true, index: true },
    lines: { type: [productionLineSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.ProductionPlan || mongoose.model("ProductionPlan", productionPlanSchema);
