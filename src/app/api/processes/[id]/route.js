import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/db";
import Process from "../../../../lib/models/Process";
import { getCurrentUser } from "../../../../lib/auth";

const EDITABLE_FIELDS = ["name", "product", "teamIds", "peopleIds", "inputs", "steps"];

export async function GET(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  await connectDB();
  const process = await Process.findOne({ _id: id, companyId: user.companyId });
  if (!process) return NextResponse.json({ error: "Process not found" }, { status: 404 });
  return NextResponse.json({ process });
}

export async function PUT(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();

    const update = {};
    for (const field of EDITABLE_FIELDS) {
      if (body[field] !== undefined) update[field] = body[field];
    }

    await connectDB();
    const process = await Process.findOneAndUpdate({ _id: id, companyId: user.companyId }, update, { new: true, runValidators: true });
    if (!process) return NextResponse.json({ error: "Process not found" }, { status: 404 });
    return NextResponse.json({ process });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  await connectDB();
  const process = await Process.findOneAndDelete({ _id: id, companyId: user.companyId });
  if (!process) return NextResponse.json({ error: "Process not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
