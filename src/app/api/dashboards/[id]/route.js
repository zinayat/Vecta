import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/db";
import Dashboard from "../../../../lib/models/Dashboard";
import { getCurrentUser } from "../../../../lib/auth";

export async function GET(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  await connectDB();
  const dashboard = await Dashboard.findOne({ _id: id, companyId: user.companyId }).lean();
  if (!dashboard) return NextResponse.json({ error: "Dashboard not found" }, { status: 404 });
  return NextResponse.json({ dashboard });
}

// Full-document update - the client sends the whole {name, widgets} shape it
// wants to persist, which keeps the widget add/remove/edit/reorder logic
// entirely client-side rather than needing a sub-resource endpoint per action.
export async function PUT(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const { id } = await params;
    const { name, widgets } = await request.json();

    await connectDB();
    const update = {};
    if (name !== undefined) update.name = name.trim();
    if (widgets !== undefined) update.widgets = widgets;

    const dashboard = await Dashboard.findOneAndUpdate(
      { _id: id, companyId: user.companyId },
      update,
      { new: true }
    );
    if (!dashboard) return NextResponse.json({ error: "Dashboard not found" }, { status: 404 });
    return NextResponse.json({ dashboard });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  await connectDB();
  const dashboard = await Dashboard.findOneAndDelete({ _id: id, companyId: user.companyId });
  if (!dashboard) return NextResponse.json({ error: "Dashboard not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
