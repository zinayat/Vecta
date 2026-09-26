import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/db";
import TaskList from "../../../lib/models/TaskList";
import { getCurrentUser } from "../../../lib/auth";
import { resolveRecurrenceUpdate } from "../../../lib/recurrence";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await connectDB();
  const taskLists = await TaskList.find({ companyId: user.companyId }).sort({ name: 1 });
  return NextResponse.json({ taskLists });
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const body = await request.json();
    if (!body.name?.trim()) return NextResponse.json({ error: "name is required" }, { status: 400 });

    await connectDB();
    const taskList = await TaskList.create({
      companyId: user.companyId,
      createdByUserId: user._id,
      name: body.name.trim(),
      description: body.description || "",
      startDate: body.startDate || "",
      dueDate: body.dueDate || "",
      status: body.status || "notStarted",
      assigneeUserIds: body.assigneeUserIds || [],
      assigneeTeamId: body.assigneeTeamId || null,
      raci: {
        accountableUserIds: body.raci?.accountableUserIds || [],
        consultedUserIds: body.raci?.consultedUserIds || [],
        informedUserIds: body.raci?.informedUserIds || [],
      },
      tagIds: body.tagIds || [],
      dependencies: body.dependencies || [],
      recurrence: resolveRecurrenceUpdate(null, body.recurrence, body.dueDate || body.startDate),
    });
    return NextResponse.json({ taskList }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
