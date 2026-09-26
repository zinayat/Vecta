import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/db";
import { getCurrentUser } from "../../../../lib/auth";
import { runDueRecreations } from "../../../../lib/taskRecurrenceEngine";

// Called whenever the Tasks hub loads - checks every recurring task/list
// for this company and creates any instance that's now due. See
// lib/taskRecurrenceEngine.js for why this is a "checked on open," not a
// real-time scheduler.
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await connectDB();
  const result = await runDueRecreations(user.companyId, user._id);
  return NextResponse.json({ createdTaskCount: result.createdTasks.length, createdListCount: result.createdLists.length });
}
