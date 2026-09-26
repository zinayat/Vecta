import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/db";
import ProductionPlan from "../../../lib/models/ProductionPlan";
import DemandPlan from "../../../lib/models/DemandPlan";
import { getCurrentUser } from "../../../lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await connectDB();
  const plans = await ProductionPlan.find({ companyId: user.companyId }).sort({ createdAt: -1 });
  return NextResponse.json({ plans });
}

// Seeds a production plan's lines straight from its source demand plan -
// one line per demand line, quantities/dates copied in as the starting
// point, weeklyBreakdown left empty until the user rolls a line out.
export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const body = await request.json();
    if (!body.demandPlanId) return NextResponse.json({ error: "demandPlanId is required" }, { status: 400 });

    await connectDB();
    const demandPlan = await DemandPlan.findOne({ _id: body.demandPlanId, companyId: user.companyId });
    if (!demandPlan) return NextResponse.json({ error: "Demand plan not found" }, { status: 404 });

    const name = body.name?.trim() || `Production Plan for ${demandPlan.name}`;
    const plan = await ProductionPlan.create({
      companyId: user.companyId,
      createdByUserId: user._id,
      name,
      demandPlanId: demandPlan._id,
      lines: demandPlan.lines.map((line) => ({
        productType: line.productType,
        unit: line.unit,
        totalQuantity: line.estimatedDemand,
        deliveryDate: line.estimatedDeliveryDate,
        weeklyBreakdown: [],
      })),
    });
    return NextResponse.json({ plan }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
