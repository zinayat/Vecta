"use client";

import { useEffect, useLayoutEffect, useRef, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Loader2, Pencil, Eye, Target, Boxes, Wand2, GripVertical, Trash2, AlertTriangle } from "lucide-react";
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

// A graph needs width, not height, to stay readable - so a KPI/Stat tile
// in graph mode gets a minimum 2-column span regardless of its saved
// size, rather than squeezing its chart into a 1-column card and growing
// tall to fit everything. Computed at display time (not just when the
// display mode is first chosen) so it also fixes tiles that were already
// saved narrow before this existed - no data migration needed.
function effectiveTileSize(widget) {
  const size = widget.config?.size || 1;
  return widget.config?.displayMode === "graph" ? Math.max(size, 2) : size;
}
const TIER_COLORS = { T1: "bg-blue-100 text-blue-700", T2: "bg-violet-100 text-violet-700", T3: "bg-amber-100 text-amber-700" };

export default function DashboardDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
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
  const [tierBoards, setTierBoards] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  // FLIP animation for tile reordering: dragOver moves widgets around
  // instantly in state (so hit-testing next to a moved tile stays
  // correct), but the DOM nodes themselves are eased into their new grid
  // slots with a transform rather than teleporting - a plain CSS grid
  // has nothing to animate (grid-column/row aren't transitionable), so
  // this measures each tile's position before and after the reorder and
  // plays the difference as a transform. Keyed by widget _id (not array
  // index) since identity has to survive the very reorder being animated.
  const tileNodesRef = useRef(new Map());
  const prevTileRectsRef = useRef(new Map());

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

  // This dashboard's own page is where a team's tier boards should be
  // discoverable too, not only from the Teams list - so when this
  // dashboard turns out to be a team's main dashboard, fetch that team's
  // T1/T2/T3 boards and show them as quick links up top.
  useEffect(() => {
    if (!team || team.mainDashboardId !== id || team.dashboardIds.length === 0) { setTierBoards(null); return; }
    let cancelled = false;
    Promise.all(team.dashboardIds.map((tid) => apiFetch(`/api/dashboards/${tid}`).then((d) => d.dashboard).catch(() => null)))
      .then((boards) => { if (!cancelled) setTierBoards(boards.filter(Boolean)); });
    return () => { cancelled = true; };
  }, [team, id]);

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

  // Delete used to live on the standalone /dashboards list page - now that
  // dashboards are only reached through Teams, it lives here instead so
  // it's available regardless of whether this dashboard belongs to a team
  // or turned up in "Unassigned Dashboards."
  async function confirmDelete() {
    setDeleteBusy(true);
    try {
      await apiFetch(`/api/dashboards/${id}`, { method: "DELETE" });
      // Clean up the team's references so it doesn't keep pointing at a
      // dashboard that no longer exists.
      if (team) {
        const patch = {};
        if (team.mainDashboardId === id) patch.mainDashboardId = null;
        if (team.dashboardIds.includes(id)) patch.dashboardIds = team.dashboardIds.filter((x) => x !== id);
        if (Object.keys(patch).length > 0) {
          await apiFetch(`/api/teams/${team._id}`, { method: "PUT", body: patch }).catch(() => {});
        }
      }
      router.push(team ? `/teams/${team._id}` : "/teams");
    } catch (err) {
      setError(err.message);
      setDeleteBusy(false);
    }
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
      // Only swap once the cursor is solidly inside the target tile's
      // middle 60%, not the instant it grazes an edge - swapping on any
      // overlap made tiles flicker back and forth whenever the cursor
      // idled near a shared boundary (crossing in swaps them, which
      // shifts the boundary, which puts the cursor back on the other
      // side...). This dead zone around each tile's edge breaks that
      // loop and makes a drag track predictably to where you're actually
      // pointing instead of fighting you.
      const rect = e.currentTarget.getBoundingClientRect();
      const margin = 0.2;
      const insideX = e.clientX > rect.left + rect.width * margin && e.clientX < rect.right - rect.width * margin;
      const insideY = e.clientY > rect.top + rect.height * margin && e.clientY < rect.bottom - rect.height * margin;
      if (!insideX || !insideY) return;

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

  // Runs after every reorder (live, mid-drag included) - compares each
  // tile's just-measured position against where it was before this
  // render's DOM update, and if it moved, snaps it back to the old spot
  // with a transform and immediately eases that transform away. The net
  // effect reads as tiles sliding into their new slots; without it they
  // just teleport, which is what made rearranging feel abrupt rather than
  // like a smooth drag. Skips the tile actually being dragged - it's
  // already tracking the cursor as the native drag ghost, so animating
  // its placeholder underneath at the same time would just look doubled.
  useLayoutEffect(() => {
    const draggedId = dragIndex !== null ? dashboard?.widgets?.[dragIndex]?._id : null;
    const nextRects = new Map();
    tileNodesRef.current.forEach((node, wid) => {
      if (node) nextRects.set(wid, node.getBoundingClientRect());
    });

    prevTileRectsRef.current.forEach((prevRect, wid) => {
      if (wid === draggedId) return;
      const node = tileNodesRef.current.get(wid);
      const nextRect = nextRects.get(wid);
      if (!node || !nextRect) return;
      const dx = prevRect.left - nextRect.left;
      const dy = prevRect.top - nextRect.top;
      if (!dx && !dy) return;
      node.style.transition = "none";
      node.style.transform = `translate(${dx}px, ${dy}px)`;
      node.getBoundingClientRect(); // force layout so the jump above applies before the eased release below
      requestAnimationFrame(() => {
        node.style.transition = "transform 200ms ease";
        node.style.transform = "";
      });
    });

    prevTileRectsRef.current = nextRects;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboard?.widgets?.map((w) => w._id).join(",")]);

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
        <div className="flex items-center justify-between mb-3">
          <Link href={team ? `/teams/${team._id}` : "/teams"} className="inline-flex items-center gap-1.5 text-xs opacity-40 hover:opacity-70 transition">
            <ArrowLeft className="h-3.5 w-3.5" /> {team ? team.name : "All teams"}
          </Link>
          <button onClick={() => setDeleting(true)} className="inline-flex items-center gap-1 text-xs opacity-30 hover:opacity-80 hover:text-red-500 transition">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>

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

        {tierBoards && tierBoards.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-wide opacity-50 mb-2">Tier Boards</p>
            <div className="flex flex-wrap items-center gap-1.5">
              {tierBoards.map((d) => (
                <Link
                  key={d._id}
                  href={`/dashboards/${d._id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium hover:shadow-sm transition"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  <span className={`rounded-full px-1.5 py-0 text-[9px] font-bold ${TIER_COLORS[d.tier] || "bg-gray-100 text-gray-600"}`}>{d.tier}</span>
                  {d.name}
                </Link>
              ))}
            </div>
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
            <p className="text-sm opacity-50">This dashboard is empty. Add a KPI, single number, note, project list, timer, section, or Planning summary widget.</p>
          </div>
        ) : (
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${isExecutive ? "gap-4" : "gap-3"}`}>
            {dashboard.widgets.map((w, index) => {
              const categoryColor = w.config?.category ? CATEGORY_COLORS[w.config.category] : null;
              const spanClass = w.type === "section" ? "sm:col-span-2 lg:col-span-3" : (w.type === "kpi" || w.type === "stat") ? TILE_SPAN_CLASSES[effectiveTileSize(w)] : "";
              return (
                <div
                  key={w._id}
                  ref={(node) => {
                    if (node) tileNodesRef.current.set(w._id, node);
                    else tileNodesRef.current.delete(w._id);
                  }}
                  onDragOver={handleDragOver(index)}
                  onDrop={(e) => e.preventDefault()}
                  className={`relative min-w-0 transition-opacity ${spanClass} ${dragIndex === index ? "opacity-40" : ""}`}
                  style={isExecutive && categoryColor ? { borderTop: `3px solid ${categoryColor}`, borderRadius: "1rem" } : undefined}
                >
                  {!readOnly && (
                    // The drag itself starts only from this handle, not
                    // anywhere on the tile - grabbing from the tile body
                    // used to fight with clicking buttons, links, or text
                    // inside it (a native drag-start attempt on top of an
                    // interactive child is unreliable across browsers), so
                    // there was no dependable place to actually grab a
                    // tile from. A dedicated, generously-sized handle
                    // removes that ambiguity.
                    <div
                      draggable
                      onDragStart={handleDragStart(index)}
                      onDragEnd={handleDragEnd}
                      title="Drag to reorder"
                      className="absolute -top-1 -left-1 z-10 p-1.5 rounded-lg opacity-40 hover:opacity-90 hover:bg-black/5 cursor-grab active:cursor-grabbing transition"
                    >
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
                  {!readOnly && (w.type === "kpi" || w.type === "stat") && (
                    <div
                      draggable={false}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-1.5 right-1.5 z-10 flex items-center gap-0.5 rounded-md border px-1 py-0.5 opacity-40 hover:opacity-100 transition"
                      style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
                    >
                      {[1, 2, 3].map((n) => {
                        const active = effectiveTileSize(w) === n;
                        const lockedNarrow = n === 1 && w.config?.displayMode === "graph";
                        return (
                          <button
                            key={n}
                            type="button"
                            draggable={false}
                            onClick={() => resizeWidget(w._id, n)}
                            title={lockedNarrow ? "Graphs need at least 2 columns to stay readable" : `${n === 1 ? "Small" : n === 2 ? "Medium" : "Large"} (${n} column${n > 1 ? "s" : ""})`}
                            className="h-4 w-4 rounded text-[9px] font-bold flex items-center justify-center transition"
                            style={{
                              background: active ? "var(--color-accent)" : "transparent",
                              color: active ? "#fff" : "inherit",
                              opacity: lockedNarrow ? 0.3 : 1,
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

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="card w-full max-w-sm p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-9 w-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
              <p className="text-sm font-bold">Delete "{dashboard.name}"?</p>
            </div>
            <p className="text-xs opacity-60 leading-relaxed mb-5">
              {dashboard.tier ? "This tier board" : "This dashboard"} will be deleted permanently. This action cannot be undone.
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
