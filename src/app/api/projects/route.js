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
  const hoshinPriorityId = searchParams.get("hoshinPriorityId");
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);
  if (type) filter.type = type;
  if (status) filter.status = status;
  if (hoshinPriorityId) filter.hoshinPriorityId = hoshinPriorityId;

  await connectDB();
  const projects = await Project.find(filter)
    .select("name type status ownerName hoshinPlanId hoshinPriorityId updatedAt")
    .sort({ updatedAt: -1 })
    .limit(limit)
    .lean();
  return NextResponse.json({ projects });
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const { name, type, ownerName, hoshinPlanId, hoshinPriorityId } = await request.json();
    if (!name?.trim() || !["A3", "CapEx"].includes(type)) {
      return NextResponse.json({ error: "name and a valid type (A3 or CapEx) are required" }, { status: 400 });
    }

    await connectDB();
    const project = await Project.create({
      companyId: user.companyId,
      name: name.trim(),
      type,
      ownerName: ownerName?.trim() || "",
      hoshinPlanId: hoshinPlanId || null,
      hoshinPriorityId: hoshinPriorityId || null,
      createdByUserId: user._id,
    });
    return NextResponse.json({ project }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
