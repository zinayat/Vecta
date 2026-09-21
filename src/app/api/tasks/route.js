import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/db";
import Task from "../../../lib/models/Task";
import { getCurrentUser } from "../../../lib/auth";

// Every list-shaped page (the Tasks hub, a task list's page, "my tasks")
// reads the whole company's tasks and filters/groups client-side, same
// pattern as Teams and Dashboards - the dataset is small per company, and
// this keeps dependency/blocked-by resolution (which needs every task and
// list in memory at once) in one shared client-side helper rather than
// duplicated across query variants.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await connectDB();
  const tasks = await Task.find({ companyId: user.companyId }).sort({ dueDate: 1, createdAt: 1 });
  return NextResponse.json({ tasks });
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const body = await request.json();
    if (!body.title?.trim()) return NextResponse.json({ error: "title is required" }, { status: 400 });

    await connectDB();
    const task = await Task.create({
      companyId: user.companyId,
      createdByUserId: user._id,
      title: body.title.trim(),
      description: body.description || "",
      taskListId: body.taskListId || null,
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
    });
    return NextResponse.json({ task }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
