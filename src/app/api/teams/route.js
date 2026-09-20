import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/db";
import Team from "../../../lib/models/Team";
import { getCurrentUser, canManageTeams } from "../../../lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await connectDB();
  const teams = await Team.find({ companyId: user.companyId }).sort({ name: 1 });
  return NextResponse.json({ teams });
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!canManageTeams(user)) return NextResponse.json({ error: "Only Admins and Managers can create teams" }, { status: 403 });

  try {
    const { name, purpose } = await request.json();
    if (!name?.trim()) return NextResponse.json({ error: "name is required" }, { status: 400 });

    await connectDB();
    const team = await Team.create({
      companyId: user.companyId,
      name: name.trim(),
      purpose: purpose?.trim() || "",
      createdByUserId: user._id,
    });
    return NextResponse.json({ team }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
