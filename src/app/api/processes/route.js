import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/db";
import Process from "../../../lib/models/Process";
import { getCurrentUser } from "../../../lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await connectDB();
  const processes = await Process.find({ companyId: user.companyId })
    .select("name product teamIds peopleIds steps updatedAt")
    .sort({ updatedAt: -1 });
  return NextResponse.json({ processes });
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const { name, product } = await request.json();
    if (!name?.trim()) return NextResponse.json({ error: "name is required" }, { status: 400 });

    await connectDB();
    const process = await Process.create({
      companyId: user.companyId,
      createdByUserId: user._id,
      name: name.trim(),
      product: product?.trim() || "",
    });
    return NextResponse.json({ process }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
