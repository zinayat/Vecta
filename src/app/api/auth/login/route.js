import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/db";
import User from "../../../../lib/models/User";
import { verifyPassword, signToken, setAuthCookie } from "../../../../lib/auth";

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    if (!email?.trim() || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = signToken({ userId: String(user._id), companyId: String(user.companyId) });
    await setAuthCookie(token);

    return NextResponse.json({
      user: { id: String(user._id), name: user.name, email: user.email, role: user.role, companyId: String(user.companyId) },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
