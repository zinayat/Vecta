"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Plus, Loader2, X } from "lucide-react";
import AppShell from "../../components/AppShell";
import { apiFetch } from "../../lib/apiClient";

export default function DashboardsPage() {
  const router = useRouter();
  const [dashboards, setDashboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch("/api/dashboards")
      .then((data) => setDashboards(data.dashboards))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function createDashboard(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSubmitting(true);
    try {
      const data = await apiFetch("/api/dashboards", { method: "POST", body: { name: newName.trim() } });
      router.push(`/dashboards/${data.dashboard._id}`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
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
          <button onClick={() => setCreating(true)} className="btn-primary">
            <Plus className="h-4 w-4" /> New Dashboard
          </button>
        </div>

        {creating && (
          <form onSubmit={createDashboard} className="card p-4 mb-4 flex items-center gap-2">
            <input
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
              <button
                key={d._id}
                onClick={() => router.push(`/dashboards/${d._id}`)}
                className="card p-4 text-left hover:shadow-md transition"
              >
                <p className="text-sm font-bold mb-1">{d.name}</p>
                <p className="text-xs opacity-40">{d.widgets.length} widget{d.widgets.length === 1 ? "" : "s"}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
