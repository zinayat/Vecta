import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/db";
import Observation from "../../../lib/models/Observation";
import { getCurrentUser } from "../../../lib/auth";
import { MAX_IMAGES } from "../../../lib/observationMeta";

// Supports an optional ?dashboardId= filter so the Observations dashboard
// widget can ask for just the observations targeted at ITS board, instead
// of every widget instance fetching the company's whole list and
// filtering client-side.
export async function GET(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const dashboardId = searchParams.get("dashboardId");

  await connectDB();
  const query = { companyId: user.companyId };
  if (dashboardId) query.dashboardIds = dashboardId;
  const observations = await Observation.find(query).sort({ createdAt: -1 });
  return NextResponse.json({ observations });
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const body = await request.json();
    if (!body.date) return NextResponse.json({ error: "date is required" }, { status: 400 });
    if (!body.text?.trim() && (!body.images || body.images.length === 0)) {
      return NextResponse.json({ error: "Add either some text or a photo" }, { status: 400 });
    }

    await connectDB();
    const observation = await Observation.create({
      companyId: user.companyId,
      createdByUserId: user._id,
      date: body.date,
      text: body.text || "",
      tagIds: body.tagIds || [],
      images: (body.images || []).slice(0, MAX_IMAGES),
      dashboardIds: body.dashboardIds || [],
    });
    return NextResponse.json({ observation }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
