"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Plus, Loader2, X, Sparkles, Trash2, AlertTriangle } from "lucide-react";
import AppShell from "../../components/AppShell";
import { apiFetch } from "../../lib/apiClient";

const TIER_COLORS = { T1: "bg-blue-100 text-blue-700", T2: "bg-violet-100 text-violet-700", T3: "bg-amber-100 text-amber-700" };

export default function DashboardsPage() {
  const router = useRouter();
  const [dashboards, setDashboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    apiFetch("/api/dashboards")
      .then((data) => setDashboards(data.dashboards))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function createDashboard(e) {
    e.preventDefault();
    if (!newName.trim()) {
      setError("Give the dashboard a name before creating it");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const data = await apiFetch("/api/dashboards", { method: "POST", body: { name: newName.trim() } });
      router.push(`/dashboards/${data.dashboard._id}`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await apiFetch(`/api/dashboards/${deleting._id}`, { method: "DELETE" });
      setDashboards((prev) => prev.filter((d) => d._id !== deleting._id));
      setDeleting(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--color-primary) 10%, transparent)" }}>
              <LayoutDashboard className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
            </div>
            <div>
              <h1 className="text-lg font-bold">Dashboards</h1>
              <p className="text-xs opacity-50">Compose boards from KPI, note, and project widgets</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/dashboards/one-click" className="btn-primary" style={{ background: "var(--color-accent)" }}>
              <Sparkles className="h-4 w-4" /> One-Click Tier Boards
            </Link>
            <button onClick={() => setCreating(true)} className="btn-primary">
              <Plus className="h-4 w-4" /> New Dashboard
            </button>
          </div>
        </div>

        {creating && (
          <form onSubmit={createDashboard} className="card p-4 mb-4 flex items-center gap-2">
            <input
              required
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Dashboard name"
              className="input flex-1"
            />
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
            </button>
            <button type="button" onClick={() => setCreating(false)} className="p-2 opacity-40 hover:opacity-80">
              <X className="h-4 w-4" />
            </button>
          </form>
        )}

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin opacity-40" /></div>
        ) : dashboards.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-sm opacity-50">No dashboards yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {dashboards.map((d) => (
              <div
                key={d._id}
                onClick={() => router.push(`/dashboards/${d._id}`)}
                className="card p-4 text-left hover:shadow-md transition cursor-pointer relative group"
              >
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleting(d); }}
                  className="absolute top-3 right-3 p-1 rounded-lg opacity-0 group-hover:opacity-40 hover:!opacity-100 hover:text-red-500 hover:bg-red-50 transition"
                  title="Delete dashboard"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                {d.tier && (
                  <span className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-bold mb-1.5 ${TIER_COLORS[d.tier]}`}>{d.tier}</span>
                )}
                <p className="text-sm font-bold mb-1 pr-6">{d.name}</p>
                <p className="text-xs opacity-40">{d.widgets.length} widget{d.widgets.length === 1 ? "" : "s"}</p>
              </div>
            ))}
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
              <p className="text-sm font-bold">Delete "{deleting.name}"?</p>
            </div>
            <p className="text-xs opacity-60 leading-relaxed mb-5">
              {deleting.tier ? "This tier board" : "This dashboard"} will be deleted permanently. This action cannot be undone.
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setDeleting(null)} disabled={deleteBusy} className="flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition hover:bg-black/[0.03]" style={{ borderColor: "var(--color-border)" }}>
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
