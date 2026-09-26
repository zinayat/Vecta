"use client";

import { useEffect, useMemo, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Trash2, AlertTriangle, PenTool, Map, Plus, X, ChevronUp, ChevronDown, Wrench, Save } from "lucide-react";
import AppShell from "../../../../components/AppShell";
import { apiFetch } from "../../../../lib/apiClient";
import EntityChecklist from "../../../../components/process/EntityChecklist";
import CapacityFields from "../../../../components/process/CapacityFields";
import ProcessMap from "../../../../components/process/ProcessMap";

const emptyCapacity = () => ({ value: null, unit: "" });
const emptyObserved = () => ({ value: null, unit: "", measuredAt: "", notes: "" });

function newStep() {
  return { name: "New step", description: "", equipment: [], engineeredCapacity: emptyCapacity(), observedCapacity: emptyObserved() };
}
function newEquipment() {
  return { name: "New equipment", engineeredCapacity: emptyCapacity(), observedCapacity: emptyObserved() };
}
function newInput() {
  return { name: "", quantity: "", notes: "" };
}

export default function ProcessDesignPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [process, setProcess] = useState(null);
  const [draft, setDraft] = useState(null);
  const [teams, setTeams] = useState([]);
  const [people, setPeople] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState("design");
  const [deleting, setDeleting] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    apiFetch(`/api/processes/${id}`)
      .then((data) => { setProcess(data.process); setDraft(data.process); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    apiFetch("/api/teams").then((d) => setTeams(d.teams)).catch(() => setTeams([]));
    apiFetch("/api/users").then((d) => setPeople(d.users)).catch(() => setPeople([]));
    apiFetch("/api/operations-plans")
      .then((d) => setAssignments(d.plans.flatMap((p) => p.assignments).filter((a) => a.processId === id)))
      .catch(() => setAssignments([]));
  }, [id]);

  const dirty = useMemo(() => process && draft && JSON.stringify(process) !== JSON.stringify(draft), [process, draft]);

  function patch(fields) {
    setDraft((d) => ({ ...d, ...fields }));
  }

  async function save() {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      const { process: updated } = await apiFetch(`/api/processes/${id}`, {
        method: "PUT",
        body: { name: draft.name, product: draft.product, teamIds: draft.teamIds, peopleIds: draft.peopleIds, inputs: draft.inputs, steps: draft.steps },
      });
      setProcess(updated);
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
      await apiFetch(`/api/processes/${id}`, { method: "DELETE" });
      router.push("/process/design");
    } catch (err) {
      setError(err.message);
      setDeleteBusy(false);
    }
  }

  // Step helpers - all operate on the local draft only, saved together
  // when "Save changes" is clicked (nested step/equipment edits are too
  // fine-grained to round-trip the server on every keystroke).
  function updateStep(i, fields) {
    patch({ steps: draft.steps.map((s, idx) => (idx === i ? { ...s, ...fields } : s)) });
  }
  function addStep() {
    patch({ steps: [...draft.steps, newStep()] });
  }
  function removeStep(i) {
    patch({ steps: draft.steps.filter((_, idx) => idx !== i) });
  }
  function moveStep(i, dir) {
    const next = [...draft.steps];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    patch({ steps: next });
  }
  function updateEquipment(stepIdx, eqIdx, fields) {
    const step = draft.steps[stepIdx];
    const equipment = step.equipment.map((eq, idx) => (idx === eqIdx ? { ...eq, ...fields } : eq));
    updateStep(stepIdx, { equipment });
  }
  function addEquipment(stepIdx) {
    updateStep(stepIdx, { equipment: [...draft.steps[stepIdx].equipment, newEquipment()] });
  }
  function removeEquipment(stepIdx, eqIdx) {
    updateStep(stepIdx, { equipment: draft.steps[stepIdx].equipment.filter((_, idx) => idx !== eqIdx) });
  }
  function updateInput(i, fields) {
    patch({ inputs: draft.inputs.map((inp, idx) => (idx === i ? { ...inp, ...fields } : inp)) });
  }
  function addInput() {
    patch({ inputs: [...draft.inputs, newInput()] });
  }
  function removeInput(i) {
    patch({ inputs: draft.inputs.filter((_, idx) => idx !== i) });
  }

  if (loading) return <AppShell><div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin opacity-40" /></div></AppShell>;
  if (!process || !draft) return <AppShell><p className="text-sm opacity-50">{error || "Process not found"}</p></AppShell>;

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto pb-10">
        <div className="flex items-center justify-between mb-3">
          <Link href="/process/design" className="inline-flex items-center gap-1.5 text-xs opacity-40 hover:opacity-70 transition">
            <ArrowLeft className="h-3.5 w-3.5" /> Design
          </Link>
          <button onClick={() => setDeleting(true)} className="inline-flex items-center gap-1 text-xs opacity-30 hover:opacity-80 hover:text-red-500 transition">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>

        <div className="card p-5 mb-4">
          <input
            className="text-xl font-black bg-transparent outline-none w-full mb-1"
            value={draft.name}
            onChange={(e) => patch({ name: e.target.value })}
          />
          <input
            className="input text-sm"
            placeholder="Product this process makes"
            value={draft.product || ""}
            onChange={(e) => patch({ product: e.target.value })}
          />
        </div>

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-1 p-0.5 rounded-lg" style={{ border: "1px solid var(--color-border)" }}>
            <button
              onClick={() => setMode("design")}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition"
              style={mode === "design" ? { background: "var(--color-bg)" } : { opacity: 0.5 }}
            >
              <PenTool className="h-3.5 w-3.5" /> Design
            </button>
            <button
              onClick={() => setMode("map")}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition"
              style={mode === "map" ? { background: "var(--color-bg)" } : { opacity: 0.5 }}
            >
              <Map className="h-3.5 w-3.5" /> Process Map
            </button>
          </div>
          {mode === "design" && (
            <button onClick={save} disabled={!dirty || saving} className="btn-primary text-xs disabled:opacity-40">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {dirty ? "Save changes" : "Saved"}
            </button>
          )}
        </div>

        {mode === "map" ? (
          <ProcessMap process={draft} teams={teams} people={people} assignments={assignments} />
        ) : (
          <div className="space-y-3">
            <div className="card p-4">
              <p className="text-xs font-bold uppercase tracking-wide opacity-50 mb-3">People &amp; Teams</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-medium opacity-60 mb-1 block">Teams involved</label>
                  <EntityChecklist
                    items={teams}
                    selectedIds={draft.teamIds}
                    onChange={(teamIds) => patch({ teamIds })}
                    getLabel={(t) => t.name}
                    emptyLabel="No teams exist yet."
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium opacity-60 mb-1 block">People involved</label>
                  <EntityChecklist
                    items={people}
                    selectedIds={draft.peopleIds}
                    onChange={(peopleIds) => patch({ peopleIds })}
                    getLabel={(u) => u.name}
                    getSublabel={(u) => u.role}
                    emptyLabel="No people found."
                  />
                </div>
              </div>
            </div>

            <div className="card p-4">
              <p className="text-xs font-bold uppercase tracking-wide opacity-50 mb-3">Inputs (raw materials)</p>
              <div className="space-y-2">
                {draft.inputs.map((inp, i) => (
                  <div key={inp._id || `new-${i}`} className="flex items-center gap-1.5">
                    <input className="input text-xs py-1.5 flex-1 min-w-0" placeholder="Material name" value={inp.name} onChange={(e) => updateInput(i, { name: e.target.value })} />
                    <input
                      className="input text-xs py-1.5 flex-shrink-0"
                      style={{ width: "8rem" }}
                      placeholder="Quantity"
                      value={inp.quantity}
                      onChange={(e) => updateInput(i, { quantity: e.target.value })}
                    />
                    <input className="input text-xs py-1.5 flex-1 min-w-0" placeholder="Notes" value={inp.notes} onChange={(e) => updateInput(i, { notes: e.target.value })} />
                    <button onClick={() => removeInput(i)} className="p-1 opacity-30 hover:opacity-80 hover:text-red-500 flex-shrink-0"><X className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
                <button onClick={addInput} className="inline-flex items-center gap-1 text-xs opacity-50 hover:opacity-90"><Plus className="h-3.5 w-3.5" /> Add input</button>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-wide opacity-50">Steps</p>
              </div>
              <div className="space-y-3">
                {draft.steps.map((step, i) => (
                  <div key={step._id || `new-${i}`} className="rounded-xl border p-3" style={{ borderColor: "var(--color-border)" }}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-[10px] font-bold opacity-40 flex-shrink-0">#{i + 1}</span>
                      <input className="input text-xs py-1.5 flex-1 min-w-0" placeholder="Step name" value={step.name} onChange={(e) => updateStep(i, { name: e.target.value })} />
                      <button onClick={() => moveStep(i, -1)} disabled={i === 0} className="p-1 opacity-40 hover:opacity-80 disabled:opacity-15 flex-shrink-0"><ChevronUp className="h-3.5 w-3.5" /></button>
                      <button onClick={() => moveStep(i, 1)} disabled={i === draft.steps.length - 1} className="p-1 opacity-40 hover:opacity-80 disabled:opacity-15 flex-shrink-0"><ChevronDown className="h-3.5 w-3.5" /></button>
                      <button onClick={() => removeStep(i)} className="p-1 opacity-30 hover:opacity-80 hover:text-red-500 flex-shrink-0"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                    <textarea
                      className="input text-xs py-1.5 mb-2 w-full resize-none"
                      rows={2}
                      placeholder="Description (optional)"
                      value={step.description}
                      onChange={(e) => updateStep(i, { description: e.target.value })}
                    />
                    <CapacityFields
                      engineered={step.engineeredCapacity}
                      observed={step.observedCapacity}
                      onChangeEngineered={(v) => updateStep(i, { engineeredCapacity: v })}
                      onChangeObserved={(v) => updateStep(i, { observedCapacity: v })}
                    />

                    <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--color-border)" }}>
                      <p className="text-[10px] font-bold uppercase tracking-wide opacity-40 mb-2 flex items-center gap-1"><Wrench className="h-3 w-3" /> Equipment</p>
                      <div className="space-y-2">
                        {step.equipment.map((eq, eqIdx) => (
                          <div key={eq._id || `new-${eqIdx}`} className="rounded-lg p-2" style={{ background: "color-mix(in srgb, var(--color-text) 3%, transparent)" }}>
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <input className="input text-xs py-1 flex-1 min-w-0" placeholder="Equipment name" value={eq.name} onChange={(e) => updateEquipment(i, eqIdx, { name: e.target.value })} />
                              <button onClick={() => removeEquipment(i, eqIdx)} className="p-1 opacity-30 hover:opacity-80 hover:text-red-500 flex-shrink-0"><X className="h-3.5 w-3.5" /></button>
                            </div>
                            <CapacityFields
                              engineered={eq.engineeredCapacity}
                              observed={eq.observedCapacity}
                              onChangeEngineered={(v) => updateEquipment(i, eqIdx, { engineeredCapacity: v })}
                              onChangeObserved={(v) => updateEquipment(i, eqIdx, { observedCapacity: v })}
                            />
                          </div>
                        ))}
                        <button onClick={() => addEquipment(i)} className="inline-flex items-center gap-1 text-[11px] opacity-50 hover:opacity-90"><Plus className="h-3 w-3" /> Add equipment</button>
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={addStep} className="inline-flex items-center gap-1 text-xs opacity-50 hover:opacity-90"><Plus className="h-3.5 w-3.5" /> Add step</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="card w-full max-w-sm p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-9 w-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
              <p className="text-sm font-bold">Delete "{process.name}"?</p>
            </div>
            <p className="text-xs opacity-60 leading-relaxed mb-5">
              This process will be deleted permanently. This action cannot be undone.
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
