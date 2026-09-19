import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/db";
import Dashboard from "../../../lib/models/Dashboard";
import { getCurrentUser } from "../../../lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await connectDB();
  const dashboards = await Dashboard.find({ companyId: user.companyId })
    .select("name widgets createdAt updatedAt")
    .sort({ updatedAt: -1 })
    .lean();
  return NextResponse.json({ dashboards });
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const { name } = await request.json();
    if (!name?.trim()) return NextResponse.json({ error: "name is required" }, { status: 400 });

    await connectDB();
    const dashboard = await Dashboard.create({
      companyId: user.companyId,
      name: name.trim(),
      createdByUserId: user._id,
      widgets: [],
    });
    return NextResponse.json({ dashboard }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
