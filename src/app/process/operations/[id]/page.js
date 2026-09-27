"use client";

import { useEffect, useMemo, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Trash2, AlertTriangle, Plus, X, Save, GitBranch, Clock } from "lucide-react";
import AppShell from "../../../../components/AppShell";
import { apiFetch } from "../../../../lib/apiClient";
import EntityChecklist from "../../../../components/process/EntityChecklist";

const MAX_SHIFTS = 10;

function newAssignment(defaultProcessId) {
  return { processId: defaultProcessId || "", teamIds: [], shifts: [], stepAssignments: [], plannedOutput: "", plannedDowntime: "", notes: "" };
}

export default function OperationsPlanPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [plan, setPlan] = useState(null);
  const [draft, setDraft] = useState(null);
  const [processes, setProcesses] = useState([]);
  const [teams, setTeams] = useState([]);
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    apiFetch(`/api/operations-plans/${id}`)
      .then((data) => { setPlan(data.plan); setDraft(data.plan); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    apiFetch("/api/processes").then((d) => setProcesses(d.processes)).catch(() => setProcesses([]));
    apiFetch("/api/teams").then((d) => setTeams(d.teams)).catch(() => setTeams([]));
    apiFetch("/api/users").then((d) => setPeople(d.users)).catch(() => setPeople([]));
  }, [id]);

  const dirty = useMemo(() => plan && draft && JSON.stringify(plan) !== JSON.stringify(draft), [plan, draft]);

  function patch(fields) {
    setDraft((d) => ({ ...d, ...fields }));
  }

  async function save() {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      const { plan: updated } = await apiFetch(`/api/operations-plans/${id}`, { method: "PUT", body: { name: draft.name, assignments: draft.assignments } });
      setPlan(updated);
      setDraft(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    setDeleteBusy(true);
    try {
      await apiFetch(`/api/operations-plans/${id}`, { method: "DELETE" });
      router.push("/process/operations");
    } catch (err) {
      setError(err.message);
      setDeleteBusy(false);
    }
  }

  function updateAssignment(i, fields) {
    patch({ assignments: draft.assignments.map((a, idx) => (idx === i ? { ...a, ...fields } : a)) });
  }
  function addAssignment() {
    patch({ assignments: [...draft.assignments, newAssignment(processes[0]?._id)] });
  }
  function removeAssignment(i) {
    patch({ assignments: draft.assignments.filter((_, idx) => idx !== i) });
  }

  // Shifts are driven by a "how many" count - typing 3 creates 3 blank
  // rows, typing 1 truncates back down to 1 (from the end) - rather than
  // a separate add-one-at-a-time button, since the user asked to set the
  // number of shifts directly. A row can still be removed individually
  // for precise control (e.g. dropping the middle one).
  function setShiftCount(assignIdx, rawCount) {
    const count = Math.max(0, Math.min(MAX_SHIFTS, Number(rawCount) || 0));
    const current = draft.assignments[assignIdx].shifts;
    let next = current;
    if (count > current.length) {
      next = [...current];
      while (next.length < count) next.push({ name: `Shift ${next.length + 1}`, startDate: "", endDate: "", startTime: "", endTime: "" });
    } else if (count < current.length) {
      next = current.slice(0, count);
    }
    updateAssignment(assignIdx, { shifts: next });
  }
  function updateShift(assignIdx, shiftIdx, fields) {
    const shifts = draft.assignments[assignIdx].shifts.map((s, idx) => (idx === shiftIdx ? { ...s, ...fields } : s));
    updateAssignment(assignIdx, { shifts });
  }
  function removeShift(assignIdx, shiftIdx) {
    updateAssignment(assignIdx, { shifts: draft.assignments[assignIdx].shifts.filter((_, idx) => idx !== shiftIdx) });
  }

  // Per-step staffing - one or more people per step of the linked
  // process, keyed by that step's own _id. Rows are derived from the
  // process's current step list (not stored blank ahead of time), so a
  // step added to the process after this assignment was created still
  // shows up here, and one that's since been removed just stops showing.
  function stepUserIds(assignment, stepId) {
    return assignment.stepAssignments?.find((sa) => sa.stepId === stepId)?.userIds || [];
  }
  function updateStepAssignment(assignIdx, stepId, userIds) {
    const assignment = draft.assignments[assignIdx];
    const existing = assignment.stepAssignments || [];
    const next = existing.some((sa) => sa.stepId === stepId)
      ? existing.map((sa) => (sa.stepId === stepId ? { ...sa, userIds } : sa))
      : [...existing, { stepId, userIds }];
    updateAssignment(assignIdx, { stepAssignments: next });
  }

  if (loading) return <AppShell><div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin opacity-40" /></div></AppShell>;
  if (!plan || !draft) return <AppShell><p className="text-sm opacity-50">{error || "Operations plan not found"}</p></AppShell>;

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto pb-10">
        <div className="flex items-center justify-between mb-3">
          <Link href="/process/operations" className="inline-flex items-center gap-1.5 text-xs opacity-40 hover:opacity-70 transition">
            <ArrowLeft className="h-3.5 w-3.5" /> Operations Plan
          </Link>
          <button onClick={() => setDeleting(true)} className="inline-flex items-center gap-1 text-xs opacity-30 hover:opacity-80 hover:text-red-500 transition">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>

        <div className="card p-5 mb-4">
          <input
            className="text-xl font-black bg-transparent outline-none w-full"
            value={draft.name}
            onChange={(e) => patch({ name: e.target.value })}
          />
        </div>

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        <div className="flex items-center justify-end mb-3">
          <button onClick={save} disabled={!dirty || saving} className="btn-primary text-xs disabled:opacity-40">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {dirty ? "Save changes" : "Saved"}
          </button>
        </div>

        {processes.length === 0 && (
          <p className="text-xs opacity-50 mb-3">
            No processes have been designed yet - <Link href="/process/design" className="underline">design one first</Link> so it can be assigned here.
          </p>
        )}

        <div className="space-y-3">
          {draft.assignments.map((a, i) => {
            const process = processes.find((p) => p._id === a.processId);
            const steps = process?.steps || [];
            return (
              <div key={a._id || `new-${i}`} className="card p-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <GitBranch className="h-3.5 w-3.5 opacity-40 flex-shrink-0" />
                    <select className="input text-xs py-1.5" value={a.processId} onChange={(e) => updateAssignment(i, { processId: e.target.value })}>
                      <option value="" disabled>Choose a process...</option>
                      {processes.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                  </div>
                  <button onClick={() => removeAssignment(i)} className="p-1 opacity-30 hover:opacity-80 hover:text-red-500 flex-shrink-0"><X className="h-3.5 w-3.5" /></button>
                </div>

                <div className="mb-3">
                  <label className="text-[11px] font-medium opacity-60 mb-1 block">Team(s)</label>
                  <EntityChecklist
                    items={teams}
                    selectedIds={a.teamIds}
                    onChange={(teamIds) => updateAssignment(i, { teamIds })}
                    getLabel={(t) => t.name}
                    emptyLabel="No teams exist yet."
                  />
                </div>

                <div className="rounded-lg border p-3 mb-3" style={{ borderColor: "var(--color-border)" }}>
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-wide opacity-40 flex items-center gap-1"><Clock className="h-3 w-3" /> Shifts</p>
                    <div className="flex items-center gap-1.5">
                      <label className="text-[11px] opacity-50">Number of shifts</label>
                      <input
                        type="number"
                        min={0}
                        max={MAX_SHIFTS}
                        className="input text-xs py-1"
                        style={{ width: "3.5rem" }}
                        value={a.shifts.length}
                        onChange={(e) => setShiftCount(i, e.target.value)}
                      />
                    </div>
                  </div>
                  {a.shifts.length === 0 ? (
                    <p className="text-[11px] opacity-40 italic">No shifts defined yet - set a number above to add some.</p>
                  ) : (
                    <div className="space-y-2">
                      {a.shifts.map((shift, shiftIdx) => (
                        <div key={shift._id || `new-${shiftIdx}`} className="rounded-lg p-2" style={{ background: "color-mix(in srgb, var(--color-text) 3%, transparent)" }}>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <input
                              className="input text-xs py-1 flex-1 min-w-0"
                              placeholder="Shift name"
                              value={shift.name}
                              onChange={(e) => updateShift(i, shiftIdx, { name: e.target.value })}
                            />
                            <input
                              type="date"
                              className="input text-xs py-1 flex-1 min-w-0"
                              value={shift.startDate}
                              onChange={(e) => updateShift(i, shiftIdx, { startDate: e.target.value })}
                            />
                            <span className="text-[11px] opacity-30 flex-shrink-0">to</span>
                            <input
                              type="date"
                              className="input text-xs py-1 flex-1 min-w-0"
                              value={shift.endDate}
                              onChange={(e) => updateShift(i, shiftIdx, { endDate: e.target.value })}
                            />
                            <button onClick={() => removeShift(i, shiftIdx)} className="p-1 opacity-30 hover:opacity-80 hover:text-red-500 flex-shrink-0"><X className="h-3.5 w-3.5" /></button>
                          </div>
                          <div className="flex items-center gap-1.5 pl-0.5">
                            <Clock className="h-3 w-3 opacity-30 flex-shrink-0" />
                            <input
                              type="time"
                              className="input text-xs py-1 flex-1 min-w-0"
                              value={shift.startTime}
                              onChange={(e) => updateShift(i, shiftIdx, { startTime: e.target.value })}
                            />
                            <span className="text-[11px] opacity-30 flex-shrink-0">to</span>
                            <input
                              type="time"
                              className="input text-xs py-1 flex-1 min-w-0"
                              value={shift.endTime}
                              onChange={(e) => updateShift(i, shiftIdx, { endTime: e.target.value })}
                            />
                            <div className="flex-shrink-0" style={{ width: "1.75rem" }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <p className="text-[11px] font-medium opacity-60 mb-1.5">Person/people per step</p>
                  {!process ? (
                    <p className="text-[11px] opacity-40 italic">Choose a process above to staff its steps.</p>
                  ) : steps.length === 0 ? (
                    <p className="text-[11px] opacity-40 italic">This process has no steps designed yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {steps.map((step, stepIdx) => (
                        <div key={step._id} className="rounded-lg p-2" style={{ background: "color-mix(in srgb, var(--color-text) 3%, transparent)" }}>
                          <p className="text-[11px] font-semibold mb-1">#{stepIdx + 1} {step.name}</p>
                          <EntityChecklist
                            items={people}
                            selectedIds={stepUserIds(a, step._id)}
                            onChange={(userIds) => updateStepAssignment(i, step._id, userIds)}
                            getLabel={(u) => u.name}
                            getSublabel={(u) => u.role}
                            emptyLabel="No people found."
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input className="input text-xs py-1.5" placeholder="Planned output (e.g. 500 units/day)" value={a.plannedOutput} onChange={(e) => updateAssignment(i, { plannedOutput: e.target.value })} />
                  <input className="input text-xs py-1.5" placeholder="Planned downtime (e.g. 30 min changeover)" value={a.plannedDowntime} onChange={(e) => updateAssignment(i, { plannedDowntime: e.target.value })} />
                </div>
                <input className="input text-xs py-1.5 mt-2 w-full" placeholder="Notes (optional)" value={a.notes} onChange={(e) => updateAssignment(i, { notes: e.target.value })} />
              </div>
            );
          })}

          <button onClick={addAssignment} disabled={processes.length === 0} className="inline-flex items-center gap-1 text-xs opacity-50 hover:opacity-90 disabled:opacity-30">
            <Plus className="h-3.5 w-3.5" /> Add assignment
          </button>
        </div>
      </div>

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="card w-full max-w-sm p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-9 w-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
              <p className="text-sm font-bold">Delete "{plan.name}"?</p>
            </div>
            <p className="text-xs opacity-60 leading-relaxed mb-5">
              This operations plan will be deleted permanently. This action cannot be undone.
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setDeleting(false)} disabled={deleteBusy} className="flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition hover:bg-black/[0.03]" style={{ borderColor: "var(--color-border)" }}>
                Cancel
              </button>
              <button onClick={confirmDelete} disabled={deleteBusy} className="flex-1 rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 flex items-center justify-center gap-1.5">
                {deleteBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
