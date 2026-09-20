import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/db";
import HoshinPlan from "../../../../lib/models/HoshinPlan";
import { getCurrentUser, canEditHoshin } from "../../../../lib/auth";

const EDITABLE_FIELDS = [
  "name",
  "fiscalYear",
  "longTermObjectives",
  "annualObjectives",
  "improvementPriorities",
  "metrics",
  "correlations",
  "projectCorrelations",
  "raci",
];

export async function GET(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  await connectDB();
  // No .lean() here on purpose - a plan created before a field (e.g.
  // projectCorrelations, raci) was added to the schema won't have it in the
  // stored document, and .lean() skips Mongoose's schema-default
  // backfilling that a hydrated document gets for free.
  const plan = await HoshinPlan.findOne({ _id: id, companyId: user.companyId });
  if (!plan) return NextResponse.json({ error: "Hoshin plan not found" }, { status: 404 });
  return NextResponse.json({ plan });
}

// Full-document-style update, same pattern as dashboards: the client sends
// only the field(s) it changed and everything else is left alone.
export async function PUT(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!canEditHoshin(user)) return NextResponse.json({ error: "Only Admins and Managers can edit Hoshin plans" }, { status: 403 });

  try {
    const { id } = await params;
    const body = await request.json();

    const update = {};
    for (const field of EDITABLE_FIELDS) {
      if (body[field] !== undefined) update[field] = body[field];
    }

    await connectDB();
    const plan = await HoshinPlan.findOneAndUpdate({ _id: id, companyId: user.companyId }, update, { new: true });
    if (!plan) return NextResponse.json({ error: "Hoshin plan not found" }, { status: 404 });
    return NextResponse.json({ plan });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!canEditHoshin(user)) return NextResponse.json({ error: "Only Admins and Managers can delete Hoshin plans" }, { status: 403 });

  const { id } = await params;
  await connectDB();
  const plan = await HoshinPlan.findOneAndDelete({ _id: id, companyId: user.companyId });
  if (!plan) return NextResponse.json({ error: "Hoshin plan not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
