import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/db";
import User from "../../../../lib/models/User";
import { getCurrentUser, isAdmin } from "../../../../lib/auth";

export async function DELETE(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!isAdmin(user)) return NextResponse.json({ error: "Only an Admin can remove teammates" }, { status: 403 });

  const { id } = await params;
  if (id === user._id) {
    return NextResponse.json({ error: "You can't remove your own account" }, { status: 400 });
  }

  await connectDB();
  const target = await User.findOne({ _id: id, companyId: user.companyId });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (target.role === "Admin") {
    const adminCount = await User.countDocuments({ companyId: user.companyId, role: "Admin" });
    if (adminCount <= 1) {
      return NextResponse.json({ error: "Can't remove the only Admin - promote someone else first" }, { status: 400 });
    }
  }

  await target.deleteOne();
  return NextResponse.json({ ok: true });
}
