import { NextResponse } from "next/server";
import { connectDB } from "../../../../../lib/db";
import DemandPlan from "../../../../../lib/models/DemandPlan";
import { getCurrentUser } from "../../../../../lib/auth";

// Revising a plan never edits it in place - it creates a new document
// carrying the same `name` forward, bumps revisionNumber, and points
// previousVersionId back at the source, so the original stays exactly as
// it was when it was current.
export async function POST(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  await connectDB();
  const source = await DemandPlan.findOne({ _id: id, companyId: user.companyId });
  if (!source) return NextResponse.json({ error: "Demand plan not found" }, { status: 404 });

  const revision = await DemandPlan.create({
    companyId: user.companyId,
    createdByUserId: user._id,
    name: source.name,
    revisionNumber: source.revisionNumber + 1,
    previousVersionId: source._id,
    lines: source.lines,
  });
  return NextResponse.json({ plan: revision }, { status: 201 });
}
