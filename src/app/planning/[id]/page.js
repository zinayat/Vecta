"use client";

import { useEffect, useState, useRef, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, AlertTriangle, Trash2, Package, Wrench } from "lucide-react";
import AppShell from "../../../components/AppShell";
import { apiFetch } from "../../../lib/apiClient";
import { PHASES } from "../../../lib/planningMeta";
import PhaseCard from "../../../components/planning/PhaseCard";

const ROUTE_META = {
  MTS: { label: "Make-to-Stock", icon: Package },
  MTO: { label: "Make-to-Order", icon: Wrench },
};

export default function PlanningCycleDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [cycle, setCycle] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingPhase, setSavingPhase] = useState(null);
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const saveTimers = useRef({});

  useEffect(() => {
    Promise.all([apiFetch(`/api/planning-cycles/${id}`), apiFetch("/api/users")])
      .then(([c, u]) => { setCycle(c.planningCycle); setUsers(u.users); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    return () => { Object.values(saveTimers.current).forEach(clearTimeout); };
  }, [id]);

  async function persist(patch) {
    try {
      await apiFetch(`/api/planning-cycles/${id}`, { method: "PUT", body: patch });
    } catch (err) {
      setError(err.message);
    }
  }

  // A phase card's fields update on every keystroke (typing a note,
  // adding a list row), so saving to the server on every change would
  // fire a request per character - the field updates the local `cycle`
  // state immediately (so it always feels responsive) but the actual
  // save is debounced per phase, so a burst of edits to the same phase
  // becomes one request shortly after the user pauses.
  function savePhase(phaseKey, phaseValue) {
    setCycle((prev) => ({ ...prev, [phaseKey]: phaseValue }));
    setSavingPhase(phaseKey);
    clearTimeout(saveTimers.current[phaseKey]);
    saveTimers.current[phaseKey] = setTimeout(async () => {
      await persist({ [phaseKey]: phaseValue });
      setSavingPhase((cur) => (cur === phaseKey ? null : cur));
    }, 600);
  }

  async function saveName() {
    if (!nameDraft.trim()) return;
    setCycle((prev) => ({ ...prev, name: nameDraft.trim() }));
    setRenaming(false);
    await persist({ name: nameDraft.trim() });
  }

  async function setRoute(route) {
    setCycle((prev) => ({ ...prev, route }));
    await persist({ route });
  }

  async function confirmDelete() {
    setDeleteBusy(true);
    try {
      await apiFetch(`/api/planning-cycles/${id}`, { method: "DELETE" });
      router.push("/planning");
    } catch (err) {
      setError(err.message);
      setDeleteBusy(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin opacity-40" /></div>
      </AppShell>
    );
  }

  if (!cycle) {
    return (
      <AppShell>
        <p className="text-sm opacity-50">Planning cycle not found.</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto pb-10">
        <Link href="/planning" className="inline-flex items-center gap-1.5 text-xs opacity-50 hover:opacity-80 mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Planning
        </Link>

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
          {renaming ? (
            <input
              className="input text-lg font-bold py-1 flex-1 min-w-[12rem]"
              value={nameDraft}
              autoFocus
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => e.key === "Enter" && saveName()}
            />
          ) : (
            <h1
              className="text-lg font-bold break-words min-w-0 cursor-text"
              onClick={() => { setNameDraft(cycle.name); setRenaming(true); }}
              title="Click to rename"
            >
              {cycle.name}
            </h1>
          )}
          <button onClick={() => setDeleting(true)} className="p-1.5 opacity-40 hover:text-red-500 flex-shrink-0"><Trash2 className="h-4 w-4" /></button>
        </div>

        <div className="flex items-center gap-2 mb-6">
          {Object.entries(ROUTE_META).map(([key, meta]) => {
            const Icon = meta.icon;
            const active = cycle.route === key;
            return (
              <button
                key={key}
                onClick={() => setRoute(key)}
                className="rounded-xl border px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition"
                style={{ borderColor: active ? "var(--color-accent)" : "var(--color-border)", background: active ? "color-mix(in srgb, var(--color-accent) 10%, transparent)" : "transparent" }}
              >
                <Icon className="h-3.5 w-3.5" /> {meta.label}
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          {PHASES.map((phaseKey) => (
            <PhaseCard
              key={phaseKey}
              phaseKey={phaseKey}
              route={cycle.route}
              value={cycle[phaseKey]}
              onChange={(v) => savePhase(phaseKey, v)}
              users={users}
              saving={savingPhase === phaseKey}
            />
          ))}
        </div>
      </div>

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
          <div className="card w-full max-w-sm p-5 max-h-full overflow-y-auto">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-9 w-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
              <p className="text-sm font-bold break-words min-w-0">Delete "{cycle.name}"?</p>
            </div>
            <p className="text-xs opacity-60 leading-relaxed mb-5">
              This planning cycle and everything entered in its five phases will be deleted permanently. This action cannot be undone.
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
