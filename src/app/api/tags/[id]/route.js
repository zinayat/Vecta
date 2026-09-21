import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/db";
import Tag from "../../../../lib/models/Tag";
import Task from "../../../../lib/models/Task";
import { getCurrentUser } from "../../../../lib/auth";

export async function DELETE(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  await connectDB();
  const tag = await Tag.findOneAndDelete({ _id: id, companyId: user.companyId });
  if (!tag) return NextResponse.json({ error: "Tag not found" }, { status: 404 });

  // A deleted tag shouldn't leave a dangling id on every task that had it -
  // pull it out of every task's tagIds rather than letting a filter-by-tag
  // dropdown quietly point at nothing.
  await Task.updateMany({ companyId: user.companyId, tagIds: id }, { $pull: { tagIds: id } });

  return NextResponse.json({ ok: true });
}
