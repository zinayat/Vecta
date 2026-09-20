import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/db";
import Project from "../../../lib/models/Project";
import { getCurrentUser } from "../../../lib/auth";

export async function GET(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const filter = { companyId: user.companyId };
  const type = searchParams.get("type");
  const status = searchParams.get("status");
  const hoshinPlanId = searchParams.get("hoshinPlanId");
  const hoshinPriorityId = searchParams.get("hoshinPriorityId");
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);
  if (type) filter.type = type;
  if (status) filter.status = status;
  if (hoshinPlanId) filter.hoshinPlanId = hoshinPlanId;
  if (hoshinPriorityId) filter.hoshinPriorityId = hoshinPriorityId;

  await connectDB();
  // No .lean() - a project created before `category` existed needs
  // Mongoose's default-backfilling for it, same reasoning as the other
  // routes that had this fixed already.
  const projects = await Project.find(filter)
    .select("name type category status ownerName hoshinPlanId hoshinPriorityId successMeasure a3 updatedAt")
    .sort({ updatedAt: -1 })
    .limit(limit);
  return NextResponse.json({ projects });
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const { name, type, category, ownerName, hoshinPlanId, hoshinPriorityId, a3, capex, successMeasure } = await request.json();
    if (!name?.trim() || !["A3", "CapEx"].includes(type)) {
      return NextResponse.json({ error: "name and a valid type (A3 or CapEx) are required" }, { status: 400 });
    }

    await connectDB();
    const project = await Project.create({
      companyId: user.companyId,
      name: name.trim(),
      type,
      category: category || null,
      ownerName: ownerName?.trim() || "",
      hoshinPlanId: hoshinPlanId || null,
      hoshinPriorityId: hoshinPriorityId || null,
      createdByUserId: user._id,
      // Vecta Live collects the whole project (A3 fields, CapEx financials,
      // success measure) before creating it, rather than the plain form's
      // create-then-fill-in-later flow - both still work, since these are
      // simply omitted (and fall back to schema defaults) when absent.
      a3: a3 || undefined,
      capex: capex || undefined,
      successMeasure: successMeasure || undefined,
    });
    return NextResponse.json({ project }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
