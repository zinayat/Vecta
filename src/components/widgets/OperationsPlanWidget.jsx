"use client";

import { useEffect, useState } from "react";
import { Loader2, Clock, Users as UsersIcon } from "lucide-react";
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

  if (!planId) return <p className="text-xs opacity-40">Choose an operations plan in the widget's settings.</p>;
  if (plan === false) return <p className="text-xs text-red-500">Couldn't load this operations plan.</p>;
  if (plan === null) return <Loader2 className="h-4 w-4 animate-spin opacity-40" />;

  const processName = (id) => processes.find((p) => p._id === id)?.name || "Unknown process";
  const teamNames = (ids) => (ids || []).map((id) => teams.find((t) => t._id === id)?.name).filter(Boolean).join(", ");
  const personName = (id) => people.find((p) => p._id === id)?.name;

  const rows = plan.assignments
    .map((a) => ({ ...a, shifts: onlyThisWeek ? a.shifts.filter(shiftInCurrentWeek) : a.shifts }))
    .filter((a) => !onlyThisWeek || a.shifts.length > 0);

  if (rows.length === 0) {
    return <p className="text-xs opacity-40 italic">{onlyThisWeek ? "No shifts scheduled this week." : "No assignments yet."}</p>;
  }

  return (
    <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
      {rows.map((a, i) => {
        const process = processes.find((p) => p._id === a.processId);
        const stepLines = (a.stepAssignments || [])
          .map((sa) => {
            const step = process?.steps.find((st) => st._id === sa.stepId);
            const names = (sa.userIds || []).map(personName).filter(Boolean);
            return step && names.length > 0 ? `${step.name}: ${names.join(", ")}` : null;
          })
          .filter(Boolean);

        return (
          <div key={a._id || i} className="rounded-lg border p-2" style={{ borderColor: "var(--color-border)" }}>
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-xs font-semibold truncate">{processName(a.processId)}</p>
              {a.teamIds?.length > 0 && <span className="text-[10px] opacity-50 flex-shrink-0 truncate max-w-[45%]">{teamNames(a.teamIds)}</span>}
            </div>

            {a.shifts.length > 0 && (
              <div className="space-y-0.5 mb-1">
                {a.shifts.map((s, si) => (
                  <p key={s._id || si} className="text-[10px] opacity-60 flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5 flex-shrink-0" />
                    <span className="truncate">
                      {s.name || "Shift"}: {s.startDate}{s.endDate && s.endDate !== s.startDate ? `–${s.endDate}` : ""}
                      {(s.startTime || s.endTime) ? `, ${s.startTime || "?"}–${s.endTime || "?"}` : ""}
                    </span>
                  </p>
                ))}
              </div>
            )}

            {stepLines.length > 0 && (
              <div className="text-[10px] opacity-60 flex items-start gap-1">
                <UsersIcon className="h-2.5 w-2.5 flex-shrink-0 mt-0.5" />
                <span>{stepLines.join(" · ")}</span>
              </div>
            )}

            {(a.plannedOutput || a.plannedDowntime) && (
              <p className="text-[10px] opacity-40 mt-1 truncate">
                {a.plannedOutput && `Output: ${a.plannedOutput}`}
                {a.plannedOutput && a.plannedDowntime ? " · " : ""}
                {a.plannedDowntime && `Downtime: ${a.plannedDowntime}`}
              </p>
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
