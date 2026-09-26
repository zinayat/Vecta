"use client";

import Link from "next/link";
import { Workflow, PenTool, CalendarCheck } from "lucide-react";
import AppShell from "../../components/AppShell";

export default function ProcessHubPage() {
  return (
    <AppShell>
      <div className="max-w-4xl mx-auto pb-10">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--color-primary) 10%, transparent)" }}>
            <Workflow className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
          </div>
          <div>
            <h1 className="text-lg font-bold">Process</h1>
            <p className="text-xs opacity-50">Design how work gets done, then plan who runs it and when</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/process/design" className="card p-5 hover:opacity-90 transition">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-3" style={{ background: "color-mix(in srgb, #2563eb 12%, transparent)" }}>
              <PenTool className="h-5 w-5" style={{ color: "#2563eb" }} />
            </div>
            <p className="text-sm font-bold mb-1">Design</p>
            <p className="text-xs opacity-50 leading-relaxed">
              Lay out a process - its product, the people and teams behind it, its steps and their equipment, the
              raw material inputs it needs, and each step's engineered vs. actual observed capacity.
            </p>
          </Link>

          <Link href="/process/operations" className="card p-5 hover:opacity-90 transition">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-3" style={{ background: "color-mix(in srgb, #16a34a 12%, transparent)" }}>
              <CalendarCheck className="h-5 w-5" style={{ color: "#16a34a" }} />
            </div>
            <p className="text-sm font-bold mb-1">Operations Plan</p>
            <p className="text-xs opacity-50 leading-relaxed">
              Plan how each designed process actually runs - assign it to a team, teams, or specific people, and
              set its schedule and planned output.
            </p>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
