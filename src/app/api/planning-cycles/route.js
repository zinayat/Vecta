import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/db";
import PlanningCycle from "../../../lib/models/PlanningCycle";
import { getCurrentUser } from "../../../lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await connectDB();
  const planningCycles = await PlanningCycle.find({ companyId: user.companyId }).sort({ createdAt: -1 });
  return NextResponse.json({ planningCycles });
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const body = await request.json();
    if (!body.name?.trim()) return NextResponse.json({ error: "name is required" }, { status: 400 });
    if (!["MTS", "MTO"].includes(body.route)) return NextResponse.json({ error: "route must be MTS or MTO" }, { status: 400 });

    await connectDB();
    const planningCycle = await PlanningCycle.create({
      companyId: user.companyId,
      createdByUserId: user._id,
      name: body.name.trim(),
      route: body.route,
    });
    return NextResponse.json({ planningCycle }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
