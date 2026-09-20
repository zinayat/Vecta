"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Loader2, Pencil, Eye, Target, Boxes, Wand2, GripVertical } from "lucide-react";
import AppShell from "../../../components/AppShell";
import WidgetCard from "../../../components/widgets/WidgetCard";
import AddWidgetModal from "../../../components/widgets/AddWidgetModal";
import { CATEGORY_COLORS } from "../../../components/widgets/KpiWidget";
import { buildHoshinCorpus, suggestHoshinLink } from "../../../lib/hoshinAutoLink";
import { cleanKpiLabel } from "../../../lib/kpiBuilder";
import { apiFetch } from "../../../lib/apiClient";

// Tile "resize" snaps to the grid's own tracks (1/2/3 columns) rather than
// free pixel dimensions, so a resized tile always stays self-aligned with
// its neighbors instead of leaving gaps or overlaps. Written as literal
// class strings (not built from a template) so Tailwind's build-time scan
// picks them up.
const TILE_SPAN_CLASSES = { 1: "", 2: "sm:col-span-2", 3: "sm:col-span-2 lg:col-span-3" };

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
  const [dragIndex, setDragIndex] = useState(null);
  const [team, setTeam] = useState(null);

  useEffect(() => {
    apiFetch(`/api/dashboards/${id}`)
      .then((data) => {
        setDashboard(data.dashboard);
        setMode(data.dashboard.widgets?.length ? "view" : "edit");
        if (data.dashboard.teamId) {
          apiFetch(`/api/teams/${data.dashboard.teamId}`).then((d) => setTeam(d.team)).catch(() => setTeam(null));
        }
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

  // Native HTML5 drag-and-drop reorder - no library needed. Widgets swap
  // positions live as you drag over a new slot (the grid self-aligns since
  // it's just CSS grid auto-flow reacting to array order), and the final
  // order is persisted once the drag ends.
  function handleDragStart(index) {
    return () => setDragIndex(index);
  }

  function handleDragOver(index) {
    return (e) => {
      e.preventDefault();
      if (dragIndex === null || dragIndex === index) return;
      setDashboard((d) => {
        const next = [...d.widgets];
        const [moved] = next.splice(dragIndex, 1);
        next.splice(index, 0, moved);
        return { ...d, widgets: next };
      });
      setDragIndex(index);
    };
  }

  function handleDragEnd() {
    if (dragIndex !== null) persistWidgets(dashboard.widgets);
    setDragIndex(null);
  }

  // KPI tiles resize by column span (1/2/3, snapping to the grid's own
  // tracks so tiles always stay self-aligned). Plain click buttons rather
  // than a drag handle - a drag gesture here had to coexist with the same
  // tile's native HTML5 drag-and-drop (used for reordering), and the two
  // gesture systems fighting over one element was unreliable. A click is
  // unambiguous and always works.
  function resizeWidget(widgetId, size) {
    persistWidgets(dashboard.widgets.map((w) => (w._id === widgetId ? { ...w, config: { ...w.config, size } } : w)));
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
        const cleanedLabel = cleanKpiLabel(w.config?.label);
        const match = suggestHoshinLink(cleanedLabel, w.config?.category, corpus);
        if (!match) return w;
        linkedCount++;
        const nextConfig = {
          ...w.config,
          label: cleanedLabel,
          hoshinLink: { planId: match.planId, planName: match.planName, itemType: match.itemType, itemId: match.itemId, itemText: match.text },
        };
        if (!nextConfig.label?.trim() || nextConfig.label === `${w.config?.category} metric`) nextConfig.label = match.text;
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
                <div className="flex items-center gap-3 mt-1.5">
                  {dashboard.hoshinPlanId && (
                    <Link href={`/hoshin/${dashboard.hoshinPlanId}`} className="inline-flex items-center gap-1 text-xs opacity-60 hover:opacity-90 transition">
                      <Target className="h-3 w-3" /> View linked plan
                    </Link>
                  )}
                  {team && (
                    <Link href={`/teams/${team._id}`} className="inline-flex items-center gap-1 text-xs opacity-60 hover:opacity-90 transition">
                      <Boxes className="h-3 w-3" /> {team.name}
                    </Link>
                  )}
                </div>
              </div>
              <ModeToggle mode={mode} setMode={setMode} light />
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-bold">{dashboard.name}</h1>
              <ModeToggle mode={mode} setMode={setMode} />
            </div>
            {team && (
              <Link href={`/teams/${team._id}`} className="inline-flex items-center gap-1 text-xs opacity-40 hover:opacity-70 transition mt-1">
                <Boxes className="h-3 w-3" /> {team.name}
              </Link>
            )}
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
            <p className="text-sm opacity-50">This dashboard is empty. Add a KPI, note, project list, timer, section, or Planning summary widget.</p>
          </div>
        ) : (
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${isExecutive ? "gap-4" : "gap-3"}`}>
            {dashboard.widgets.map((w, index) => {
              const categoryColor = w.config?.category ? CATEGORY_COLORS[w.config.category] : null;
              const spanClass = w.type === "section" ? "sm:col-span-2 lg:col-span-3" : w.type === "kpi" ? TILE_SPAN_CLASSES[w.config?.size || 1] : "";
              return (
                <div
                  key={w._id}
                  draggable={!readOnly}
                  onDragStart={handleDragStart(index)}
                  onDragOver={handleDragOver(index)}
                  onDrop={(e) => e.preventDefault()}
                  onDragEnd={handleDragEnd}
                  className={`relative transition ${spanClass} ${!readOnly ? "cursor-grab active:cursor-grabbing" : ""} ${dragIndex === index ? "opacity-40" : ""}`}
                  style={isExecutive && categoryColor ? { borderTop: `3px solid ${categoryColor}`, borderRadius: "1rem" } : undefined}
                >
                  {!readOnly && (
                    <div className="absolute top-2 left-2 z-10 opacity-25 pointer-events-none">
                      <GripVertical className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <WidgetCard
                    widget={w}
                    onSave={saveWidget}
                    onRemove={() => removeWidget(w._id)}
                    allWidgets={dashboard.widgets}
                    readOnly={readOnly}
                  />
                  {!readOnly && w.type === "kpi" && (
                    <div
                      draggable={false}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-1.5 right-1.5 z-10 flex items-center gap-0.5 rounded-md border px-1 py-0.5 opacity-40 hover:opacity-100 transition"
                      style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
                    >
                      {[1, 2, 3].map((n) => {
                        const active = (w.config?.size || 1) === n;
                        return (
                          <button
                            key={n}
                            type="button"
                            draggable={false}
                            onClick={() => resizeWidget(w._id, n)}
                            title={`${n === 1 ? "Small" : n === 2 ? "Medium" : "Large"} (${n} column${n > 1 ? "s" : ""})`}
                            className="h-4 w-4 rounded text-[9px] font-bold flex items-center justify-center transition"
                            style={{
                              background: active ? "var(--color-accent)" : "transparent",
                              color: active ? "#fff" : "inherit",
                            }}
                          >
                            {n}
                          </button>
                        );
                      })}
                    </div>
                  )}
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
