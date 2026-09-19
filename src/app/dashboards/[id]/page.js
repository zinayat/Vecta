"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Loader2 } from "lucide-react";
import AppShell from "../../../components/AppShell";
import WidgetCard from "../../../components/widgets/WidgetCard";
import AddWidgetModal from "../../../components/widgets/AddWidgetModal";
import { apiFetch } from "../../../lib/apiClient";

export default function DashboardDetailPage({ params }) {
  const { id } = use(params);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch(`/api/dashboards/${id}`)
      .then((data) => setDashboard(data.dashboard))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function persistWidgets(widgets) {
    setSaving(true);
    try {
      const data = await apiFetch(`/api/dashboards/${id}`, { method: "PUT", body: { widgets } });
      setDashboard(data.dashboard);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function addWidget(widget) {
    persistWidgets([...(dashboard.widgets || []), widget]);
    setAdding(false);
  }

  function saveWidget(updated) {
    persistWidgets(dashboard.widgets.map((w) => (w._id === updated._id ? updated : w)));
  }

  function removeWidget(widgetId) {
    persistWidgets(dashboard.widgets.filter((w) => w._id !== widgetId));
  }

  if (loading) {
    return <AppShell><div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin opacity-40" /></div></AppShell>;
  }
  if (!dashboard) {
    return <AppShell><p className="text-sm opacity-50">{error || "Dashboard not found"}</p></AppShell>;
  }

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto">
        <Link href="/dashboards" className="inline-flex items-center gap-1.5 text-xs opacity-40 hover:opacity-70 transition mb-3">
          <ArrowLeft className="h-3.5 w-3.5" /> All dashboards
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-bold">{dashboard.name}</h1>
          <button onClick={() => setAdding(true)} className="btn-primary">
            <Plus className="h-4 w-4" /> Add Widget
          </button>
        </div>

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
        {saving && <p className="text-xs opacity-40 mb-3">Saving...</p>}

        {dashboard.widgets.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-sm opacity-50">This dashboard is empty. Add a KPI, note, project list, or Hoshin summary widget.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {dashboard.widgets.map((w) => (
              <WidgetCard key={w._id} widget={w} onSave={saveWidget} onRemove={() => removeWidget(w._id)} />
            ))}
          </div>
        )}
      </div>

      {adding && <AddWidgetModal onAdd={addWidget} onClose={() => setAdding(false)} />}
    </AppShell>
  );
}
