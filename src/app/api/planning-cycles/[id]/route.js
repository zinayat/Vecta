import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/db";
import PlanningCycle from "../../../../lib/models/PlanningCycle";
import { getCurrentUser } from "../../../../lib/auth";
import { PHASES } from "../../../../lib/planningMeta";

export async function GET(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  await connectDB();
  const planningCycle = await PlanningCycle.findOne({ _id: id, companyId: user.companyId });
  if (!planningCycle) return NextResponse.json({ error: "Planning cycle not found" }, { status: 404 });
  return NextResponse.json({ planningCycle });
}

// Full-document update, same shape as a dashboard's PUT - the client
// sends whichever top-level fields changed (name, route, or one of the
// five phase objects) and this just $sets them.
export async function PUT(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    const update = {};
    if (body.name !== undefined) {
      if (!body.name.trim()) return NextResponse.json({ error: "name is required" }, { status: 400 });
      update.name = body.name.trim();
    }
    if (body.route !== undefined) {
      if (!["MTS", "MTO"].includes(body.route)) return NextResponse.json({ error: "route must be MTS or MTO" }, { status: 400 });
      update.route = body.route;
    }
    for (const phase of PHASES) {
      if (body[phase] !== undefined) update[phase] = body[phase];
    }

    await connectDB();
    const planningCycle = await PlanningCycle.findOneAndUpdate({ _id: id, companyId: user.companyId }, update, { new: true });
    if (!planningCycle) return NextResponse.json({ error: "Planning cycle not found" }, { status: 404 });
    return NextResponse.json({ planningCycle });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  await connectDB();
  const planningCycle = await PlanningCycle.findOneAndDelete({ _id: id, companyId: user.companyId });
  if (!planningCycle) return NextResponse.json({ error: "Planning cycle not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
