import mongoose from "mongoose";
import { TIME_FACTORS } from "../processConstants";

// Shared by both a step and its equipment - "engineered" is the designed/
// rated capacity, "observed" is what's actually been measured running,
// so the two can be compared to see where a process is under- or
// over-performing its design. Free-text unit (not an enum) since plants
// measure capacity in whatever makes sense for that step - units, kg,
// batches, etc. - kept separate from `timeFactor` (the "per Hour/Shift/
// Day/Week/Month" period a value is measured over), a fixed set since a
// value only means something when it's read together with the period
// it's rated over, and comparing engineered vs. observed only makes
// sense when both sides share the same period.
const capacitySchema = new mongoose.Schema(
  {
    value: { type: Number, default: null },
    unit: { type: String, default: "" },
    timeFactor: { type: String, enum: [...TIME_FACTORS, ""], default: "" },
  },
  { _id: false }
);
const observedCapacitySchema = new mongoose.Schema(
  {
    value: { type: Number, default: null },
    unit: { type: String, default: "" },
    timeFactor: { type: String, enum: [...TIME_FACTORS, ""], default: "" },
    // Plain "YYYY-MM-DD" string, same convention as every other date field
    // in the app (task due dates, observation dates) - avoids timezone
    // shifting a date-only value back and forth through a JS Date.
    measuredAt: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { _id: false }
);

const equipmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    engineeredCapacity: { type: capacitySchema, default: () => ({}) },
    observedCapacity: { type: observedCapacitySchema, default: () => ({}) },
  },
  { _id: true, timestamps: false }
);

const stepSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    equipment: { type: [equipmentSchema], default: [] },
    engineeredCapacity: { type: capacitySchema, default: () => ({}) },
    observedCapacity: { type: observedCapacitySchema, default: () => ({}) },
  },
  { _id: true, timestamps: false }
);

// A raw material or other input the process consumes - not tied to a
// specific step, since the same input (e.g. a base material) is often
// drawn on throughout the whole process rather than at one point in it.
const inputSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    quantity: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { _id: true, timestamps: false }
);

const processSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    product: { type: String, default: "" },
    teamIds: { type: [mongoose.Schema.Types.ObjectId], ref: "Team", default: [] },
    peopleIds: { type: [mongoose.Schema.Types.ObjectId], ref: "User", default: [] },
    inputs: { type: [inputSchema], default: [] },
    steps: { type: [stepSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.Process || mongoose.model("Process", processSchema);
