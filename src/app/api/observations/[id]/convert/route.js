import { NextResponse } from "next/server";
import { connectDB } from "../../../../../lib/db";
import Observation from "../../../../../lib/models/Observation";
import Task from "../../../../../lib/models/Task";
import { getCurrentUser } from "../../../../../lib/auth";

// Creates a real Task from an observation and freezes the observation as
// a historical record pointing at it - from here on, status/assignment/
// due dates/everything else about actually resolving this happens on the
// task. observationCreatedAt is snapshotted onto the task (not just the
// id) so "how long has this been pending" can be computed from when the
// issue was first observed, all the way through, without a second lookup.
export async function POST(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    if (!body.title?.trim()) return NextResponse.json({ error: "title is required" }, { status: 400 });

    await connectDB();
    const observation = await Observation.findOne({ _id: id, companyId: user.companyId });
    if (!observation) return NextResponse.json({ error: "Observation not found" }, { status: 404 });
    if (observation.status === "converted") {
      return NextResponse.json({ error: "This observation has already been converted to a task" }, { status: 400 });
    }

    const task = await Task.create({
      companyId: user.companyId,
      createdByUserId: user._id,
      title: body.title.trim(),
      description: observation.text || "",
      dueDate: body.dueDate || "",
      assigneeUserIds: body.assigneeUserIds || [],
      assigneeTeamId: body.assigneeTeamId || null,
      tagIds: observation.tagIds,
      observationId: observation._id,
      observationDate: observation.date,
      observationCreatedAt: observation.createdAt,
    });

    observation.status = "converted";
    observation.convertedTaskId = task._id;
    observation.convertedAt = new Date();
    await observation.save();

    return NextResponse.json({ task, observation }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
