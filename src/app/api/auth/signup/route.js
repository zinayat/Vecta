import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/db";
import Company from "../../../../lib/models/Company";
import User from "../../../../lib/models/User";
import { hashPassword, signToken, setAuthCookie } from "../../../../lib/auth";

// First user for a new company always becomes Admin - there's no invite flow
// yet, so signup both creates the tenant and its first member in one step.
export async function POST(request) {
  try {
    const { companyName, name, email, password } = await request.json();
    if (!companyName?.trim() || !name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: "Company name, name, email, and password are all required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    await connectDB();

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json({ error: "That email is already registered" }, { status: 409 });
    }

    const company = await Company.create({ name: companyName.trim() });
    const passwordHash = await hashPassword(password);
    const user = await User.create({
      companyId: company._id,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: "Admin",
    });

    const token = signToken({ userId: String(user._id), companyId: String(company._id) });
    await setAuthCookie(token);

    return NextResponse.json({
      user: { id: String(user._id), name: user.name, email: user.email, role: user.role, companyId: String(company._id) },
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
