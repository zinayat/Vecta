import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/db";
import Tag from "../../../lib/models/Tag";
import { getCurrentUser } from "../../../lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await connectDB();
  const tags = await Tag.find({ companyId: user.companyId }).sort({ name: 1 });
  return NextResponse.json({ tags });
}

// Anyone signed in can create a tag - tags are just filter labels, not
// something that needs Admin/Manager gatekeeping the way team creation does.
export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const { name, color } = await request.json();
    if (!name?.trim()) return NextResponse.json({ error: "name is required" }, { status: 400 });

    await connectDB();
    const tag = await Tag.create({
      companyId: user.companyId,
      name: name.trim(),
      color: color || "#2563eb",
      createdByUserId: user._id,
    });
    return NextResponse.json({ tag }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
