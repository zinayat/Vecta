import { NextResponse } from "next/server";
import { connectDB } from "../../../../../lib/db";
import User from "../../../../../lib/models/User";
import { getCurrentUser, isAdmin } from "../../../../../lib/auth";

const VALID_ROLES = ["Admin", "Manager", "Member"];

export async function PUT(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!isAdmin(user)) return NextResponse.json({ error: "Only an Admin can change roles" }, { status: 403 });

  try {
    const { id } = await params;
    const { role } = await request.json();
    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    await connectDB();

    if (id === user._id && role !== "Admin") {
      const adminCount = await User.countDocuments({ companyId: user.companyId, role: "Admin" });
      if (adminCount <= 1) {
        return NextResponse.json({ error: "Can't demote the only Admin - promote someone else first" }, { status: 400 });
      }
    }

    const target = await User.findOneAndUpdate(
      { _id: id, companyId: user.companyId },
      { role },
      { new: true }
    ).select("name email role");
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({ user: target });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
