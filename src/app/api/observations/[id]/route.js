import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/db";
import Observation from "../../../../lib/models/Observation";
import { getCurrentUser } from "../../../../lib/auth";
import { MAX_IMAGES } from "../../../../lib/observationMeta";

export async function GET(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  await connectDB();
  const observation = await Observation.findOne({ _id: id, companyId: user.companyId });
  if (!observation) return NextResponse.json({ error: "Observation not found" }, { status: 404 });
  return NextResponse.json({ observation });
}

// Once converted, an observation's own content (date/text/tags/images) is
// frozen - "the rest of the process happens on the task" means edits from
// here on go through the task, not back through the observation it came
// from. dashboardIds stays editable either way since that's just a
// display preference, not part of the observation's record.
const EDITABLE_WHILE_OPEN = ["date", "text", "tagIds", "images"];

export async function PUT(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();

    await connectDB();
    const existing = await Observation.findOne({ _id: id, companyId: user.companyId });
    if (!existing) return NextResponse.json({ error: "Observation not found" }, { status: 404 });

    const update = {};
    if (body.dashboardIds !== undefined) update.dashboardIds = body.dashboardIds;
    if (existing.status === "open") {
      for (const field of EDITABLE_WHILE_OPEN) {
        if (body[field] !== undefined) update[field] = field === "images" ? body[field].slice(0, MAX_IMAGES) : body[field];
      }
    }

    const observation = await Observation.findOneAndUpdate({ _id: id, companyId: user.companyId }, update, { new: true });
    return NextResponse.json({ observation });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  await connectDB();
  const observation = await Observation.findOneAndDelete({ _id: id, companyId: user.companyId });
  if (!observation) return NextResponse.json({ error: "Observation not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
