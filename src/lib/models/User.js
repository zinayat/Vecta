import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["Admin", "Manager", "Member"], default: "Member" },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", userSchema);
