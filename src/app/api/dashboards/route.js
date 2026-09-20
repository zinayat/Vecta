import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/db";
import Dashboard from "../../../lib/models/Dashboard";
import { getCurrentUser } from "../../../lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await connectDB();
  // No .lean() - dashboards created before theme/tier/hoshinPlanId were
  // added to the schema need Mongoose's default-backfilling for those
  // fields, which .lean() skips (see the same fix on the Hoshin routes).
  const dashboards = await Dashboard.find({ companyId: user.companyId })
    .select("name widgets theme tier hoshinPlanId createdAt updatedAt")
    .sort({ updatedAt: -1 });
  return NextResponse.json({ dashboards });
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const { name, widgets, theme, tier, hoshinPlanId } = await request.json();
    if (!name?.trim()) return NextResponse.json({ error: "name is required" }, { status: 400 });

    await connectDB();
    const dashboard = await Dashboard.create({
      companyId: user.companyId,
      name: name.trim(),
      createdByUserId: user._id,
      widgets: widgets || [],
      theme: theme || "default",
      tier: tier || null,
      hoshinPlanId: hoshinPlanId || null,
    });
    return NextResponse.json({ dashboard }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
