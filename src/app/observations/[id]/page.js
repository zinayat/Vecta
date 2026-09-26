"use client";

import { useEffect, useRef, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Trash2, AlertTriangle, ArrowRightCircle, CheckCircle2 } from "lucide-react";
import AppShell from "../../../components/AppShell";
import { apiFetch } from "../../../lib/apiClient";
import { STATUS_LABELS, STATUS_COLORS, daysSince, daysBetween, pendingLabel } from "../../../lib/observationMeta";
import ObservationForm from "../../../components/observations/ObservationForm";
import ConvertToTaskModal from "../../../components/observations/ConvertToTaskModal";

const SAVE_DEBOUNCE_MS = 600;

export default function ObservationDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [observation, setObservation] = useState(null);
  const [tags, setTags] = useState([]);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [converting, setConverting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    Promise.all([
      apiFetch(`/api/observations/${id}`),
      apiFetch("/api/tags"),
      apiFetch("/api/users"),
      apiFetch("/api/teams"),
    ])
      .then(([o, t, u, tm]) => { setObservation(o.observation); setTags(t.tags); setUsers(u.users); setTeams(tm.teams); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    return () => clearTimeout(saveTimer.current);
  }, [id]);

  // Optimistic local update, debounced persist - same pattern used by the
  // Planning module's demand plan editor, so typing in the text field
  // doesn't fire one request per keystroke.
  function updateDraft(next) {
    setObservation(next);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      apiFetch(`/api/observations/${id}`, { method: "PUT", body: next }).catch((err) => setError(err.message));
    }, SAVE_DEBOUNCE_MS);
  }

  async function convert({ title, dueDate, assigneeUserIds }) {
    const { task, observation: updated } = await apiFetch(`/api/observations/${id}/convert`, {
      method: "POST",
      body: { title, dueDate, assigneeUserIds },
    });
    setObservation(updated);
    setConverting(false);
    router.push(`/tasks/${task._id}`);
  }

  async function confirmDelete() {
    setDeleteBusy(true);
    try {
      await apiFetch(`/api/observations/${id}`, { method: "DELETE" });
      router.push("/observations");
    } catch (err) {
      setError(err.message);
      setDeleteBusy(false);
    }
  }

  if (loading) {
    return <AppShell><div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin opacity-40" /></div></AppShell>;
  }
  if (!observation) {
    return <AppShell><p className="text-sm opacity-50">{error || "Observation not found"}</p></AppShell>;
  }

  const converted = observation.status === "converted";

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto pb-10">
        <Link href="/observations" className="inline-flex items-center gap-1.5 text-xs opacity-50 hover:opacity-80 mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Observations
        </Link>

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        <div className="card p-5">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_COLORS[observation.status]}`}>
                {converted && <CheckCircle2 className="h-3 w-3 inline mr-0.5" />}
                {STATUS_LABELS[observation.status]}
              </span>
              <span className="text-[11px] opacity-40">{pendingLabel(daysSince(observation.createdAt))}</span>
            </div>
            <button onClick={() => setDeleting(true)} className="p-1.5 opacity-40 hover:text-red-500 flex-shrink-0"><Trash2 className="h-4 w-4" /></button>
          </div>

          {converted ? (
            <Link href={`/tasks/${observation.convertedTaskId}`} className="flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-2 mb-4 text-xs text-emerald-700 hover:bg-emerald-100 transition">
              <ArrowRightCircle className="h-4 w-4 flex-shrink-0" />
              <span>
                Converted to a task {daysBetween(observation.createdAt, observation.convertedAt)} day{daysBetween(observation.createdAt, observation.convertedAt) === 1 ? "" : "s"} after it was logged - open the task
              </span>
            </Link>
          ) : (
            <button onClick={() => setConverting(true)} className="btn-primary w-full mb-4 text-xs">
              <ArrowRightCircle className="h-3.5 w-3.5" /> Convert to task
            </button>
          )}

          <ObservationForm
            value={observation}
            onChange={updateDraft}
            tags={tags}
            onTagCreated={(tag) => setTags((prev) => [...prev, tag])}
            readOnlyContent={converted}
          />
        </div>
      </div>

      {converting && (
        <ConvertToTaskModal observation={observation} users={users} teams={teams} onConvert={convert} onClose={() => setConverting(false)} />
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
          <div className="card w-full max-w-sm p-5 max-h-full overflow-y-auto">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-9 w-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
              <p className="text-sm font-bold">Delete this observation?</p>
            </div>
            <p className="text-xs opacity-60 leading-relaxed mb-5">
              {converted
                ? "This won't delete the task it was converted into, only this observation record."
                : "This observation will be deleted permanently."} This action cannot be undone.
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
