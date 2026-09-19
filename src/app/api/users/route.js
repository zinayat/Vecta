import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/db";
import User from "../../../lib/models/User";
import { getCurrentUser } from "../../../lib/auth";

// Anyone signed in can see their teammates (name/email/role) - just not
// invite, remove, or change roles, which stay Admin-only.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await connectDB();
  const users = await User.find({ companyId: user.companyId })
    .select("name email role createdAt")
    .sort({ createdAt: 1 })
    .lean();
  return NextResponse.json({ users });
}
