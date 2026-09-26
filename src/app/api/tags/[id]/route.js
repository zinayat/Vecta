import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/db";
import Tag from "../../../../lib/models/Tag";
import Task from "../../../../lib/models/Task";
import TaskList from "../../../../lib/models/TaskList";
import Observation from "../../../../lib/models/Observation";
import Project from "../../../../lib/models/Project";
import { getCurrentUser } from "../../../../lib/auth";

export async function PUT(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    const update = {};
    if (body.name !== undefined) {
      if (!body.name.trim()) return NextResponse.json({ error: "name is required" }, { status: 400 });
      update.name = body.name.trim();
    }
    if (body.color !== undefined) update.color = body.color;

    await connectDB();
    const tag = await Tag.findOneAndUpdate({ _id: id, companyId: user.companyId }, update, { new: true });
    if (!tag) return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    return NextResponse.json({ tag });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  await connectDB();
  const tag = await Tag.findOneAndDelete({ _id: id, companyId: user.companyId });
  if (!tag) return NextResponse.json({ error: "Tag not found" }, { status: 404 });

  // A deleted tag shouldn't leave a dangling id anywhere it was applied -
  // pull it out of every task, task list, observation, and project that
  // had it, across all four collections it can live on.
  const pull = { $pull: { tagIds: id } };
  await Promise.all([
    Task.updateMany({ companyId: user.companyId, tagIds: id }, pull),
    TaskList.updateMany({ companyId: user.companyId, tagIds: id }, pull),
    Observation.updateMany({ companyId: user.companyId, tagIds: id }, pull),
    Project.updateMany({ companyId: user.companyId, tagIds: id }, pull),
  ]);

  return NextResponse.json({ ok: true });
}
