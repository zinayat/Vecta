import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/db";
import DemandPlan from "../../../lib/models/DemandPlan";
import { getCurrentUser } from "../../../lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await connectDB();
  const plans = await DemandPlan.find({ companyId: user.companyId }).sort({ createdAt: -1 });
  return NextResponse.json({ plans });
}

export async function POST(request) {
  const { getCurrentUser } = await import("../../../lib/auth");
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const body = await request.json();
    await connectDB();

    let name = body.name?.trim();
    if (!name) {
      // Auto-number a new chain as "Demand Plan #N", N = count of existing
      // root plans (no previousVersionId) for this company, + 1 - a
      // revision never hits this path since it always inherits its
      // source's name.
      const rootCount = await DemandPlan.countDocuments({ companyId: user.companyId, previousVersionId: null });
      name = `Demand Plan #${rootCount + 1}`;
    }

    const plan = await DemandPlan.create({
      companyId: user.companyId,
      createdByUserId: user._id,
      name,
      revisionNumber: 1,
      previousVersionId: null,
      lines: Array.isArray(body.lines) ? body.lines : [],
    });
    return NextResponse.json({ plan }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
