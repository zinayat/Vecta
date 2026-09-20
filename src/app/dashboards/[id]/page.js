"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Loader2, Pencil, Eye, Target, Wand2 } from "lucide-react";
import AppShell from "../../../components/AppShell";
import WidgetCard from "../../../components/widgets/WidgetCard";
import AddWidgetModal from "../../../components/widgets/AddWidgetModal";
import { CATEGORY_COLORS } from "../../../components/widgets/KpiWidget";
import { buildHoshinCorpus, suggestHoshinLink } from "../../../lib/hoshinAutoLink";
import { apiFetch } from "../../../lib/apiClient";

export default function DashboardDetailPage({ params }) {
  const { id } = use(params);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState("view");
  const [linking, setLinking] = useState(false);
  const [linkResult, setLinkResult] = useState("");

  useEffect(() => {
    apiFetch(`/api/dashboards/${id}`)
      .then((data) => {
        setDashboard(data.dashboard);
        setMode(data.dashboard.widgets?.length ? "view" : "edit");
      })
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

  // Bulk version of what the one-click generator already does for its own
  // tiles - matches every unlinked KPI tile on this dashboard against
  // Hoshin metrics/objectives/priorities (scoped to this dashboard's plan
  // if it has one, otherwise across all of the company's plans) and links
  // the best confident match. Rule-based, same as one-click - no LLM call.
  async function autoLinkKpis() {
    setLinking(true);
    setLinkResult("");
    setError("");
    try {
      const plans = dashboard.hoshinPlanId
        ? [(await apiFetch(`/api/hoshin/${dashboard.hoshinPlanId}`)).plan]
        : (await apiFetch("/api/hoshin")).plans;
      const corpus = buildHoshinCorpus(plans);

      let linkedCount = 0;
      const updatedWidgets = dashboard.widgets.map((w) => {
        if (w.type !== "kpi" || w.config?.hoshinLink) return w;
        const match = suggestHoshinLink(w.config?.label, w.config?.category, corpus);
        if (!match) return w;
        linkedCount++;
        const nextConfig = {
          ...w.config,
          hoshinLink: { planId: match.planId, planName: match.planName, itemType: match.itemType, itemId: match.itemId, itemText: match.text },
        };
        if (!nextConfig.label?.trim() || nextConfig.label.includes("not yet linked")) nextConfig.label = match.text;
        if ((nextConfig.target === undefined || nextConfig.target === "") && match.itemType === "metric" && match.target) {
          nextConfig.target = match.target;
        }
        return { ...w, config: nextConfig };
      });

      await persistWidgets(updatedWidgets);
      setLinkResult(linkedCount > 0
        ? `Linked ${linkedCount} KPI tile${linkedCount === 1 ? "" : "s"}.`
        : "No confident matches found for any unlinked KPI tile.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLinking(false);
    }
  }

  if (loading) {
    return <AppShell><div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin opacity-40" /></div></AppShell>;
  }
  if (!dashboard) {
    return <AppShell><p className="text-sm opacity-50">{error || "Dashboard not found"}</p></AppShell>;
  }

  const isExecutive = dashboard.theme === "executive";
  const readOnly = mode === "view";

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto pb-10">
        <Link href="/dashboards" className="inline-flex items-center gap-1.5 text-xs opacity-40 hover:opacity-70 transition mb-3">
          <ArrowLeft className="h-3.5 w-3.5" /> All dashboards
        </Link>

        {isExecutive ? (
          <div className="rounded-2xl p-6 mb-6" style={{ background: "var(--color-primary)", color: "white" }}>
            <div className="flex items-center justify-between gap-3">
              <div>
                {dashboard.tier && (
                  <p className="text-[11px] font-bold uppercase tracking-widest opacity-50 mb-1">{dashboard.tier}</p>
                )}
                <h1 className="text-2xl font-black tracking-tight">{dashboard.name}</h1>
                {dashboard.hoshinPlanId && (
                  <Link href={`/hoshin/${dashboard.hoshinPlanId}`} className="inline-flex items-center gap-1 text-xs opacity-60 hover:opacity-90 transition mt-1.5">
                    <Target className="h-3 w-3" /> View linked Hoshin plan
                  </Link>
                )}
              </div>
              <ModeToggle mode={mode} setMode={setMode} light />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-lg font-bold">{dashboard.name}</h1>
            <ModeToggle mode={mode} setMode={setMode} />
          </div>
        )}

        {!readOnly && (
          <div className="flex items-center justify-end gap-2 mb-4">
            {dashboard.widgets.some((w) => w.type === "kpi") && (
              <button onClick={autoLinkKpis} disabled={linking} className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition hover:bg-black/[0.03]" style={{ borderColor: "var(--color-border)" }}>
                {linking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                Auto-Link KPIs
              </button>
            )}
            <button onClick={() => setAdding(true)} className="btn-primary">
              <Plus className="h-4 w-4" /> Add Widget
            </button>
          </div>
        )}

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
        {linkResult && <p className="text-xs mb-3" style={{ color: "var(--color-accent)" }}>{linkResult}</p>}
        {saving && <p className="text-xs opacity-40 mb-3">Saving...</p>}

        {dashboard.widgets.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-sm opacity-50">This dashboard is empty. Add a KPI, note, project list, timer, section, or Hoshin summary widget.</p>
          </div>
        ) : (
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${isExecutive ? "gap-4" : "gap-3"}`}>
            {dashboard.widgets.map((w) => {
              const categoryColor = w.config?.category ? CATEGORY_COLORS[w.config.category] : null;
              return (
                <div
                  key={w._id}
                  className={w.type === "section" ? "sm:col-span-2 lg:col-span-3" : ""}
                  style={isExecutive && categoryColor ? { borderTop: `3px solid ${categoryColor}`, borderRadius: "1rem" } : undefined}
                >
                  <WidgetCard
                    widget={w}
                    onSave={saveWidget}
                    onRemove={() => removeWidget(w._id)}
                    allWidgets={dashboard.widgets}
                    readOnly={readOnly}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {adding && <AddWidgetModal onAdd={addWidget} onClose={() => setAdding(false)} allWidgets={dashboard.widgets} />}
    </AppShell>
  );
}

function ModeToggle({ mode, setMode, light }) {
  const base = "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition flex-shrink-0";
  const activeStyle = light ? { background: "rgba(255,255,255,0.15)" } : { background: "var(--color-bg)" };
  return (
    <div className="flex items-center gap-1" style={light ? {} : { border: "1px solid var(--color-border)", borderRadius: "0.65rem", padding: "2px" }}>
      <button onClick={() => setMode("view")} className={base} style={mode === "view" ? activeStyle : { opacity: 0.5 }}>
        <Eye className="h-3.5 w-3.5" /> View
      </button>
      <button onClick={() => setMode("edit")} className={base} style={mode === "edit" ? activeStyle : { opacity: 0.5 }}>
        <Pencil className="h-3.5 w-3.5" /> Edit
      </button>
    </div>
  );
}
