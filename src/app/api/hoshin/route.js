import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/db";
import HoshinPlan from "../../../lib/models/HoshinPlan";
import { getCurrentUser, canEditHoshin } from "../../../lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await connectDB();
  // No .lean() - see the comment in [id]/route.js: plans created before a
  // field was added to the schema need Mongoose's default-backfilling,
  // which .lean() skips.
  const plans = await HoshinPlan.find({ companyId: user.companyId }).sort({ updatedAt: -1 });
  return NextResponse.json({ plans });
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!canEditHoshin(user)) return NextResponse.json({ error: "Only Admins and Managers can create Hoshin plans" }, { status: 403 });

  try {
    const { name, fiscalYear } = await request.json();
    if (!name?.trim() || !fiscalYear) {
      return NextResponse.json({ error: "name and fiscalYear are required" }, { status: 400 });
    }

    await connectDB();
    const plan = await HoshinPlan.create({
      companyId: user.companyId,
      name: name.trim(),
      fiscalYear: Number(fiscalYear),
      createdByUserId: user._id,
    });
    return NextResponse.json({ plan }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
