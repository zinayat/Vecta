import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/db";
import Project from "../../../../lib/models/Project";
import { getCurrentUser } from "../../../../lib/auth";

const EDITABLE_FIELDS = ["name", "category", "status", "ownerName", "hoshinPlanId", "hoshinPriorityId", "a3", "capex", "successMeasure"];

export async function GET(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  await connectDB();
  // No .lean() - see /api/projects: a project older than `category` needs
  // Mongoose's default-backfilling for it.
  const project = await Project.findOne({ _id: id, companyId: user.companyId });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  return NextResponse.json({ project });
}

export async function PUT(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();

    const update = {};
    for (const field of EDITABLE_FIELDS) {
      if (body[field] !== undefined) update[field] = body[field];
    }

    await connectDB();
    const project = await Project.findOneAndUpdate({ _id: id, companyId: user.companyId }, update, { new: true });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    return NextResponse.json({ project });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  await connectDB();
  const project = await Project.findOneAndDelete({ _id: id, companyId: user.companyId });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
