"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import AppShell from "../../../components/AppShell";

// A static reference table, not data tied to any specific plan - which
// planning "route" a company runs (or a blend of both, by product line)
// shapes how its Strategy Deployment priorities and KPIs should actually
// be framed, so this lives one click from the plans list rather than
// buried in a specific plan.
const ROWS = [
  {
    phase: "1. Demand Planning",
    mts: "Driven by statistical forecasting and historical sales trends. You build to a forecast before the customer orders.",
    mto: "Driven by sales pipelines, quotes, and market trends. You forecast macro-capacity, not exact items.",
  },
  {
    phase: "2. S&OP",
    mts: "Focuses on balancing inventory levels so you don't stock out or overproduce.",
    mto: "Focuses on balancing backlog (order queue), lead times, and engineering resource capacity.",
  },
  {
    phase: "3. Master Scheduling (MPS)",
    mts: "Orders trigger when inventory drops below a safety threshold (Reorder points).",
    mto: "Orders trigger the moment a customer signs a contract.",
  },
  {
    phase: "4. Capacity Planning",
    mts: "Uses predictable, fixed routing times. Easy to schedule in blocks.",
    mto: "Highly variable routing times. Requires buffer capacity for emergency customer orders.",
  },
  {
    phase: "5. Material Planning (MRP)",
    mts: "Raw materials and components are bought in bulk based on the forecast.",
    mto: "Raw materials might be stocked, but unique components are only ordered when the job is won.",
  },
];

export default function PlanningGuidePage() {
  return (
    <AppShell>
      <div className="max-w-4xl mx-auto pb-10">
        <Link href="/hoshin" className="inline-flex items-center gap-1.5 text-xs opacity-50 hover:opacity-80 mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Strategy Deployment
        </Link>

        <div className="flex items-center gap-2.5 mb-6">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--color-primary) 10%, transparent)" }}>
            <BookOpen className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
          </div>
          <div>
            <h1 className="text-lg font-bold">Planning Guide</h1>
            <p className="text-xs opacity-50">Make-to-Stock vs. Make-to-Order - how each planning phase differs by route</p>
          </div>
        </div>

        <div className="card overflow-x-auto">
          <table className="w-full text-xs border-collapse min-w-[640px]">
            <thead>
              <tr style={{ background: "var(--color-bg)" }}>
                <th className="text-left font-semibold p-3 w-1/5 border-b" style={{ borderColor: "var(--color-border)" }}>Planning Phase</th>
                <th className="text-left font-semibold p-3 w-2/5 border-b" style={{ borderColor: "var(--color-border)" }}>Make-to-Stock (MTS) Route 📦</th>
                <th className="text-left font-semibold p-3 w-2/5 border-b" style={{ borderColor: "var(--color-border)" }}>Make-to-Order (MTO) Route ⚙️</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <tr key={row.phase} className={i < ROWS.length - 1 ? "border-b" : ""} style={{ borderColor: "var(--color-border)" }}>
                  <td className="p-3 font-semibold align-top">{row.phase}</td>
                  <td className="p-3 opacity-70 leading-relaxed align-top">{row.mts}</td>
                  <td className="p-3 opacity-70 leading-relaxed align-top">{row.mto}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-[11px] opacity-40 mt-3">
          Most companies aren't purely one or the other - a product line can run MTS while another,
          lower-volume line runs MTO. Use whichever column matches how a given priority or KPI is
          actually being planned when framing it on a Strategy Deployment plan.
        </p>
      </div>
    </AppShell>
  );
}
