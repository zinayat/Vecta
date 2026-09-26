"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Boxes, Loader2, ArrowLeft, CalendarRange, Grid2x2 } from "lucide-react";
import AppShell from "../../../../components/AppShell";
import { apiFetch } from "../../../../lib/apiClient";
import { rolloutWeekly, rolloutDaily, sumQuantities, todayStr } from "../../../../lib/planningRollout";

const SAVE_DEBOUNCE_MS = 600;

function fmtWeek(weekStart) {
  const start = new Date(`${weekStart}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${end.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}
function fmtDay(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export default function ProductionPlanDetailPage() {
  const { id } = useParams();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const saveTimer = useRef(null);

  useEffect(() => {
    apiFetch(`/api/production-plans/${id}`)
      .then((data) => setPlan(data.plan))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    return () => clearTimeout(saveTimer.current);
  }, [id]);

  function persist(lines, { immediate } = {}) {
    clearTimeout(saveTimer.current);
    const run = () => apiFetch(`/api/production-plans/${id}`, { method: "PUT", body: { lines } }).catch((err) => setError(err.message));
    if (immediate) run();
    else saveTimer.current = setTimeout(run, SAVE_DEBOUNCE_MS);
  }

  // Every mutation below builds a new `lines` array immutably, updates
  // local state right away (so typing/clicking feels instant), then
  // persists - debounced for free-text edits, immediate for button
  // actions that only fire once per click.
  function updateLines(next, opts) {
    setPlan((prev) => ({ ...prev, lines: next }));
    persist(next, opts);
  }

  function setLineField(lineIdx, field, value) {
    const lines = plan.lines.map((l, i) => (i === lineIdx ? { ...l, [field]: value } : l));
    updateLines(lines);
  }

  function rolloutLineWeekly(lineIdx) {
    const line = plan.lines[lineIdx];
    const weeklyBreakdown = rolloutWeekly(line.totalQuantity, line.deliveryDate, todayStr());
    const lines = plan.lines.map((l, i) => (i === lineIdx ? { ...l, weeklyBreakdown } : l));
    updateLines(lines, { immediate: true });
  }

  function setWeekQuantity(lineIdx, weekIdx, value) {
    const lines = plan.lines.map((l, i) => {
      if (i !== lineIdx) return l;
      const weeklyBreakdown = l.weeklyBreakdown.map((w, wi) => (wi === weekIdx ? { ...w, quantity: value } : w));
      return { ...l, weeklyBreakdown };
    });
    updateLines(lines);
  }

  function rolloutWeekDaily(lineIdx, weekIdx) {
    const week = plan.lines[lineIdx].weeklyBreakdown[weekIdx];
    const dailyBreakdown = rolloutDaily(week.quantity, week.weekStart);
    const lines = plan.lines.map((l, i) => {
      if (i !== lineIdx) return l;
      const weeklyBreakdown = l.weeklyBreakdown.map((w, wi) => (wi === weekIdx ? { ...w, dailyBreakdown } : w));
      return { ...l, weeklyBreakdown };
    });
    updateLines(lines, { immediate: true });
  }

  function setDayQuantity(lineIdx, weekIdx, dayIdx, value) {
    const lines = plan.lines.map((l, i) => {
      if (i !== lineIdx) return l;
      const weeklyBreakdown = l.weeklyBreakdown.map((w, wi) => {
        if (wi !== weekIdx) return w;
        const dailyBreakdown = w.dailyBreakdown.map((d, di) => (di === dayIdx ? { ...d, quantity: value } : d));
        return { ...w, dailyBreakdown };
      });
      return { ...l, weeklyBreakdown };
    });
    updateLines(lines);
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin opacity-40" /></div>
      </AppShell>
    );
  }
  if (!plan) {
    return (
      <AppShell>
        <p className="text-xs text-red-500">{error || "Production plan not found"}</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto pb-10">
        <Link href="/planning" className="inline-flex items-center gap-1 text-xs opacity-50 hover:opacity-80 mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Planning
        </Link>

        <div className="flex items-center gap-2 mb-1 min-w-0">
          <Boxes className="h-5 w-5 opacity-40 flex-shrink-0" />
          <h1 className="text-lg font-bold break-words min-w-0">{plan.name}</h1>
        </div>
        <Link href={`/planning/demand/${plan.demandPlanId}`} className="text-[11px] opacity-40 hover:opacity-70 underline">
          View source demand plan
        </Link>

        {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

        <div className="space-y-4 mt-4">
          {plan.lines.map((line, lineIdx) => (
            <div key={lineIdx} className="card p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                <input className="input text-xs py-1.5" placeholder="Product type" value={line.productType} onChange={(e) => setLineField(lineIdx, "productType", e.target.value)} />
                <input className="input text-xs py-1.5" placeholder="Total quantity" inputMode="decimal" value={line.totalQuantity} onChange={(e) => setLineField(lineIdx, "totalQuantity", e.target.value)} />
                <input className="input text-xs py-1.5" placeholder="Unit" value={line.unit} onChange={(e) => setLineField(lineIdx, "unit", e.target.value)} />
                <input className="input text-xs py-1.5" type="date" value={line.deliveryDate || ""} onChange={(e) => setLineField(lineIdx, "deliveryDate", e.target.value)} />
              </div>

              {line.weeklyBreakdown.length === 0 ? (
                <button onClick={() => rolloutLineWeekly(lineIdx)} className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--color-accent)" }}>
                  <CalendarRange className="h-3.5 w-3.5" /> Roll out weekly
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-[11px] opacity-40">
                    Weekly total: {sumQuantities(line.weeklyBreakdown, "quantity")} {line.unit} (of {line.totalQuantity} {line.unit})
                  </p>
                  {line.weeklyBreakdown.map((week, weekIdx) => (
                    <div key={week.weekStart} className="rounded-xl border p-2.5" style={{ borderColor: "var(--color-border)" }}>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-xs font-medium opacity-70">Week of {fmtWeek(week.weekStart)}</p>
                        <div className="flex items-center gap-2">
                          <input className="input text-xs py-1 w-24" inputMode="decimal" value={week.quantity} onChange={(e) => setWeekQuantity(lineIdx, weekIdx, e.target.value)} />
                          {week.dailyBreakdown.length === 0 && (
                            <button onClick={() => rolloutWeekDaily(lineIdx, weekIdx)} className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: "var(--color-accent)" }}>
                              <Grid2x2 className="h-3 w-3" /> Break into days
                            </button>
                          )}
                        </div>
                      </div>
                      {week.dailyBreakdown.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5 mt-2">
                          {week.dailyBreakdown.map((day, dayIdx) => (
                            <div key={day.date} className="min-w-0">
                              <p className="text-[10px] opacity-40 mb-0.5 truncate">{fmtDay(day.date)}</p>
                              <input className="input text-xs py-1 w-full" inputMode="decimal" value={day.quantity} onChange={(e) => setDayQuantity(lineIdx, weekIdx, dayIdx, e.target.value)} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
