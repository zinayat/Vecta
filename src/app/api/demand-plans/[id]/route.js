import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/db";
import DemandPlan from "../../../../lib/models/DemandPlan";
import { getCurrentUser } from "../../../../lib/auth";

export async function GET(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  await connectDB();
  const plan = await DemandPlan.findOne({ _id: id, companyId: user.companyId });
  if (!plan) return NextResponse.json({ error: "Demand plan not found" }, { status: 404 });
  return NextResponse.json({ plan });
}

export async function PUT(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    const update = {};
    if (Array.isArray(body.lines)) update.lines = body.lines;
    if (body.name !== undefined) {
      if (!body.name.trim()) return NextResponse.json({ error: "name is required" }, { status: 400 });
      update.name = body.name.trim();
    }

    await connectDB();
    const plan = await DemandPlan.findOneAndUpdate({ _id: id, companyId: user.companyId }, update, { new: true });
    if (!plan) return NextResponse.json({ error: "Demand plan not found" }, { status: 404 });
    return NextResponse.json({ plan });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  await connectDB();
  const plan = await DemandPlan.findOneAndDelete({ _id: id, companyId: user.companyId });
  if (!plan) return NextResponse.json({ error: "Demand plan not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
