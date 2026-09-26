import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/db";
import OperationsPlan from "../../../lib/models/OperationsPlan";
import { getCurrentUser } from "../../../lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await connectDB();
  const plans = await OperationsPlan.find({ companyId: user.companyId })
    .select("name assignments updatedAt")
    .sort({ updatedAt: -1 });
  return NextResponse.json({ plans });
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const { name } = await request.json();
    if (!name?.trim()) return NextResponse.json({ error: "name is required" }, { status: 400 });

    await connectDB();
    const plan = await OperationsPlan.create({
      companyId: user.companyId,
      createdByUserId: user._id,
      name: name.trim(),
    });
    return NextResponse.json({ plan }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
