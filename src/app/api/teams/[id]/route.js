import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/db";
import Team from "../../../../lib/models/Team";
import { getCurrentUser, canManageTeams } from "../../../../lib/auth";

const EDITABLE_FIELDS = ["name", "purpose", "outcomes", "dashboardIds", "mainDashboardId"];

export async function GET(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  await connectDB();
  const team = await Team.findOne({ _id: id, companyId: user.companyId });
  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
  return NextResponse.json({ team });
}

export async function PUT(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!canManageTeams(user)) return NextResponse.json({ error: "Only Admins and Managers can edit teams" }, { status: 403 });

  try {
    const { id } = await params;
    const body = await request.json();

    const update = {};
    for (const field of EDITABLE_FIELDS) {
      if (body[field] !== undefined) update[field] = body[field];
    }

    await connectDB();
    const team = await Team.findOneAndUpdate({ _id: id, companyId: user.companyId }, update, { new: true });
    if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
    return NextResponse.json({ team });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!canManageTeams(user)) return NextResponse.json({ error: "Only Admins and Managers can delete teams" }, { status: 403 });

  const { id } = await params;
  await connectDB();
  const team = await Team.findOneAndDelete({ _id: id, companyId: user.companyId });
  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
