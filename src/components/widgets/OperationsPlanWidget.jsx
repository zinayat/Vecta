"use client";

import { useEffect, useState } from "react";
import { Loader2, Clock, Users as UsersIcon, TrendingUp, PauseCircle, GitBranch } from "lucide-react";
import { apiFetch } from "../../lib/apiClient";

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1) - day);
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfWeek(date) {
  const end = startOfWeek(date);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}
// A shift's date range only means "this week" if it actually overlaps
// the calendar week containing today - a shift with no startDate hasn't
// been scheduled yet and never counts as current.
function shiftInCurrentWeek(shift) {
  if (!shift.startDate) return false;
  const weekStart = startOfWeek(new Date());
  const weekEnd = endOfWeek(new Date());
  const shiftStart = new Date(shift.startDate);
  const shiftEnd = shift.endDate ? new Date(shift.endDate) : shiftStart;
  return shiftStart <= weekEnd && shiftEnd >= weekStart;
}
function initials(name) {
  return (name || "")
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// A person chip (initials + name) - deliberately the most visually
// prominent element in the widget, since the entire point of putting
// this on a tier board is someone glancing at it to find their own name
// against a step.
function PersonChip({ name }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full pl-1 pr-2.5 py-1"
      style={{ background: "color-mix(in srgb, var(--color-accent) 12%, transparent)" }}
    >
      <span
        className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
        style={{ background: "var(--color-accent)" }}
      >
        {initials(name)}
      </span>
      <span className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>{name}</span>
    </span>
  );
}

export function OperationsPlanWidgetDisplay({ config }) {
  const { planId, onlyThisWeek = true } = config || {};
  const [plan, setPlan] = useState(null);
  const [processes, setProcesses] = useState(null);
  const [teams, setTeams] = useState(null);
  const [people, setPeople] = useState(null);

  useEffect(() => {
    if (!planId) return;
    setPlan(null);
    Promise.all([
      apiFetch(`/api/operations-plans/${planId}`).then((d) => d.plan),
      apiFetch("/api/processes").then((d) => d.processes),
      apiFetch("/api/teams").then((d) => d.teams),
      apiFetch("/api/users").then((d) => d.users),
    ])
      .then(([p, pr, t, u]) => { setPlan(p); setProcesses(pr); setTeams(t); setPeople(u); })
      .catch(() => setPlan(false));
  }, [planId]);

  if (!planId) return <p className="text-sm opacity-40">Choose an operations plan in the widget's settings.</p>;
  if (plan === false) return <p className="text-sm text-red-500">Couldn't load this operations plan.</p>;
  if (plan === null) return <Loader2 className="h-5 w-5 animate-spin opacity-40" />;

  const processName = (id) => processes.find((p) => p._id === id)?.name || "Unknown process";
  const teamNames = (ids) => (ids || []).map((id) => teams.find((t) => t._id === id)?.name).filter(Boolean).join(", ");
  const personName = (id) => people.find((p) => p._id === id)?.name;

  const rows = plan.assignments
    .map((a) => ({ ...a, shifts: onlyThisWeek ? a.shifts.filter(shiftInCurrentWeek) : a.shifts }))
    .filter((a) => !onlyThisWeek || a.shifts.length > 0);

  if (rows.length === 0) {
    return <p className="text-sm opacity-40 italic">{onlyThisWeek ? "No shifts scheduled this week." : "No assignments yet."}</p>;
  }

  return (
    <div className="space-y-3">
      {rows.map((a, i) => {
        const process = processes.find((p) => p._id === a.processId);
        const stepRows = (a.stepAssignments || [])
          .map((sa) => {
            const step = process?.steps.find((st) => st._id === sa.stepId);
            const names = (sa.userIds || []).map(personName).filter(Boolean);
            return step && names.length > 0 ? { stepName: step.name, names } : null;
          })
          .filter(Boolean);

        return (
          <div
            key={a._id || i}
            className="rounded-xl border pl-3.5 pr-4 py-3.5"
            style={{ borderColor: "var(--color-border)", borderLeft: "4px solid var(--color-accent)", background: "var(--color-surface)" }}
          >
            <div className="flex items-start justify-between gap-3 flex-wrap mb-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <GitBranch className="h-4 w-4 opacity-40 flex-shrink-0" />
                <p className="text-lg font-bold leading-tight truncate">{processName(a.processId)}</p>
              </div>
              {a.teamIds?.length > 0 && (
                <span className="rounded-full px-2.5 py-1 text-xs font-semibold flex-shrink-0" style={{ background: "color-mix(in srgb, var(--color-primary) 10%, transparent)" }}>
                  {teamNames(a.teamIds)}
                </span>
              )}
            </div>

            {a.shifts.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {a.shifts.map((s, si) => (
                  <span key={s._id || si} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium" style={{ background: "var(--color-bg)" }}>
                    <Clock className="h-3.5 w-3.5 opacity-50 flex-shrink-0" />
                    <span className="font-semibold">{s.name || "Shift"}</span>
                    <span className="opacity-60">
                      {s.startDate}{s.endDate && s.endDate !== s.startDate ? `–${s.endDate}` : ""}
                      {(s.startTime || s.endTime) ? ` · ${s.startTime || "?"}–${s.endTime || "?"}` : ""}
                    </span>
                  </span>
                ))}
              </div>
            )}

            {stepRows.length > 0 && (
              <div className="space-y-2 mb-3">
                {stepRows.map((row, ri) => (
                  <div key={ri} className="flex items-start gap-2.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide opacity-45 pt-1.5 flex-shrink-0">
                      <UsersIcon className="h-3 w-3" /> {row.stepName}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {row.names.map((name, ni) => <PersonChip key={ni} name={name} />)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(a.plannedOutput || a.plannedDowntime) && (
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 pt-2.5 border-t text-sm" style={{ borderColor: "var(--color-border)" }}>
                {a.plannedOutput && (
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <TrendingUp className="h-4 w-4 flex-shrink-0" style={{ color: "#16a34a" }} /> {a.plannedOutput}
                  </span>
                )}
                {a.plannedDowntime && (
                  <span className="inline-flex items-center gap-1.5 font-medium opacity-70">
                    <PauseCircle className="h-4 w-4 flex-shrink-0" /> {a.plannedDowntime}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function OperationsPlanWidgetForm({ config, onChange }) {
  const c = config || {};
  const [plans, setPlans] = useState(null);

  useEffect(() => {
    apiFetch("/api/operations-plans").then((d) => setPlans(d.plans)).catch(() => setPlans([]));
  }, []);

  return (
    <div className="space-y-2">
      {plans === null ? (
        <p className="text-[11px] opacity-40">Loading operations plans...</p>
      ) : plans.length === 0 ? (
        <p className="text-[11px] opacity-40 italic">No operations plans exist yet - create one under Process &gt; Operations Plan first.</p>
      ) : (
        <select className="input" value={c.planId || ""} onChange={(e) => onChange({ ...c, planId: e.target.value })}>
          <option value="" disabled>Choose an operations plan...</option>
          {plans.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
      )}
      <label className="flex items-center gap-1.5 text-xs opacity-80">
        <input type="checkbox" checked={c.onlyThisWeek !== false} onChange={(e) => onChange({ ...c, onlyThisWeek: e.target.checked })} />
        Only show shifts scheduled for this week
      </label>
      <p className="text-[10px] opacity-35">
        A shift counts as "this week" when its start/end date range overlaps the current Monday-Sunday week. Turn
        this off to show every assignment and shift on the plan, regardless of date.
      </p>
    </div>
  );
}
