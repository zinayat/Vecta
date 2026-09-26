"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Plus, Loader2, Camera, CheckCircle2 } from "lucide-react";
import AppShell from "../../components/AppShell";
import { apiFetch } from "../../lib/apiClient";
import { STATUS_LABELS, STATUS_COLORS, daysSince, pendingLabel } from "../../lib/observationMeta";
import ObservationForm from "../../components/observations/ObservationForm";

export default function ObservationsHubPage() {
  const router = useRouter();
  const [observations, setObservations] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ date: new Date().toISOString().slice(0, 10), text: "", tagIds: [], images: [], dashboardIds: [] });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [statusFilter, setStatusFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");

  function loadAll() {
    setLoading(true);
    return Promise.all([apiFetch("/api/observations"), apiFetch("/api/tags")])
      .then(([o, t]) => { setObservations(o.observations); setTags(t.tags); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadAll(); }, []);

  async function createObservation() {
    if (!draft.text.trim() && draft.images.length === 0) {
      setSaveError("Add either some text or a photo");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      const { observation } = await apiFetch("/api/observations", { method: "POST", body: draft });
      setAdding(false);
      router.push(`/observations/${observation._id}`);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const filtered = observations.filter((o) => {
    if (statusFilter && o.status !== statusFilter) return false;
    if (tagFilter && !(o.tagIds || []).some((id) => String(id) === tagFilter)) return false;
    return true;
  });

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto pb-10">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--color-primary) 10%, transparent)" }}>
              <Eye className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
            </div>
            <div>
              <h1 className="text-lg font-bold">Observations</h1>
              <p className="text-xs opacity-50">Log what you see on the floor, tag it, and convert it into a task when it needs action</p>
            </div>
          </div>
          <button onClick={() => setAdding(true)} className="btn-primary text-xs">
            <Plus className="h-3.5 w-3.5" /> New observation
          </button>
        </div>

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin opacity-40" /></div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <select className="input text-xs py-1.5 w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All statuses</option>
                <option value="open">Open</option>
                <option value="converted">Converted to task</option>
              </select>
              <select className="input text-xs py-1.5 w-auto" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
                <option value="">All tags</option>
                {tags.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </div>

            {filtered.length === 0 ? (
              <div className="card p-10 text-center">
                <p className="text-sm opacity-50">
                  {observations.length === 0 ? "No observations logged yet." : "Nothing matches your filters."}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((o) => (
                  <Link key={o._id} href={`/observations/${o._id}`} className="card p-3.5 flex items-start gap-3 hover:opacity-90 transition">
                    {o.images?.[0] ? (
                      <img src={o.images[0]} alt="" className="h-12 w-12 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--color-bg)" }}>
                        <Camera className="h-4 w-4 opacity-25" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <span className="text-xs font-medium opacity-60">{o.date}</span>
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold flex-shrink-0 ${STATUS_COLORS[o.status]}`}>
                          {o.status === "converted" && <CheckCircle2 className="h-2.5 w-2.5 inline mr-0.5" />}
                          {STATUS_LABELS[o.status]}
                        </span>
                        {o.status === "open" && (
                          <span className="text-[10px] opacity-40">{pendingLabel(daysSince(o.createdAt))}</span>
                        )}
                      </div>
                      <p className="text-sm break-words line-clamp-2">{o.text || <span className="opacity-40 italic">No description - see photo</span>}</p>
                      {(o.tagIds || []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {tags.filter((t) => (o.tagIds || []).some((id) => String(id) === String(t._id))).map((t) => (
                            <span key={t._id} className="rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={{ background: `color-mix(in srgb, ${t.color} 14%, transparent)`, color: t.color }}>{t.name}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {adding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
          <div className="card w-full max-w-md p-5 max-h-full overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold">New observation</p>
              <button onClick={() => setAdding(false)} className="opacity-40 hover:opacity-80 text-xs">Cancel</button>
            </div>
            <ObservationForm value={draft} onChange={setDraft} tags={tags} onTagCreated={(tag) => setTags((prev) => [...prev, tag])} />
            {saveError && <p className="text-xs text-red-500 mt-2">{saveError}</p>}
            <button onClick={createObservation} disabled={saving} className="btn-primary w-full mt-3 disabled:opacity-50">
              {saving ? "Saving..." : "Save observation"}
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
