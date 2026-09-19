import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/db";
import User from "../../../../lib/models/User";
import { getCurrentUser, isAdmin, hashPassword } from "../../../../lib/auth";

// No email service is wired up yet, so an Admin sets the new teammate's
// initial password directly here and shares it with them out of band -
// same stopgap Smart Factories used before it had one either.
export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!isAdmin(user)) return NextResponse.json({ error: "Only an Admin can invite teammates" }, { status: 403 });

  try {
    const { name, email, password, role } = await request.json();
    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: "name, email, and password are required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }
    const validRoles = ["Admin", "Manager", "Member"];
    const finalRole = validRoles.includes(role) ? role : "Member";

    await connectDB();
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) return NextResponse.json({ error: "That email is already registered" }, { status: 409 });

    const passwordHash = await hashPassword(password);
    const newUser = await User.create({
      companyId: user.companyId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: finalRole,
    });

    return NextResponse.json({
      user: { id: String(newUser._id), name: newUser.name, email: newUser.email, role: newUser.role },
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
