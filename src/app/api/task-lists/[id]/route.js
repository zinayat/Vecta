import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/db";
import TaskList from "../../../../lib/models/TaskList";
import Task from "../../../../lib/models/Task";
import { getCurrentUser } from "../../../../lib/auth";
import { resolveRecurrenceUpdate } from "../../../../lib/recurrence";

export async function GET(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  await connectDB();
  const taskList = await TaskList.findOne({ _id: id, companyId: user.companyId });
  if (!taskList) return NextResponse.json({ error: "Task list not found" }, { status: 404 });
  return NextResponse.json({ taskList });
}

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
    for (const field of ["description", "startDate", "dueDate", "status", "assigneeUserIds", "assigneeTeamId", "raci", "tagIds", "dependencies"]) {
      if (body[field] !== undefined) update[field] = body[field];
    }

    await connectDB();
    const existing = await TaskList.findOne({ _id: id, companyId: user.companyId });
    if (!existing) return NextResponse.json({ error: "Task list not found" }, { status: 404 });

    if (body.recurrence !== undefined) {
      const anchor = update.dueDate !== undefined ? update.dueDate : (update.startDate !== undefined ? update.startDate : (existing.dueDate || existing.startDate));
      update.recurrence = resolveRecurrenceUpdate(existing.recurrence, body.recurrence, anchor);
    }

    const taskList = await TaskList.findOneAndUpdate({ _id: id, companyId: user.companyId }, update, { new: true });
    return NextResponse.json({ taskList });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// A task list's tasks have no meaningful life on their own outside it -
// deleting the list takes its tasks with it, same "will be deleted
// permanently" pattern the UI already confirms for a dashboard.
export async function DELETE(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  await connectDB();
  const taskList = await TaskList.findOneAndDelete({ _id: id, companyId: user.companyId });
  if (!taskList) return NextResponse.json({ error: "Task list not found" }, { status: 404 });

  await Task.deleteMany({ companyId: user.companyId, taskListId: id });

  return NextResponse.json({ ok: true });
}
