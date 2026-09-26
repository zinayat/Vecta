"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Camera } from "lucide-react";
import { apiFetch } from "../../lib/apiClient";
import { STATUS_COLORS, STATUS_LABELS, daysSince, pendingLabel } from "../../lib/observationMeta";
import TagFilterChips, { matchesTagFilter } from "../tasks/TagFilterChips";

// Asks the API for just the observations targeted at THIS dashboard
// (dashboardIds includes it) rather than fetching the company's whole
// list and filtering client-side. Which observations show up here can
// then be narrowed further by status and by tag - a widget dropped into
// a dashboard's "Quality" section, say, can be set to only show
// observations tagged Quality, without needing a separate observation
// per section (the same observation can still also show on other boards
// via its own "Show on these dashboards" setting).
export function ObservationsWidgetDisplay({ config, dashboardId }) {
  const { statusFilter = "open", limit = 5, tagIds = [] } = config || {};
  const [observations, setObservations] = useState(null);

  useEffect(() => {
    if (!dashboardId) { setObservations([]); return; }
    apiFetch(`/api/observations?dashboardId=${dashboardId}`)
      .then((data) => setObservations(data.observations))
      .catch(() => setObservations([]));
  }, [dashboardId]);

  if (observations === null) return <Loader2 className="h-4 w-4 animate-spin opacity-40" />;

  const filtered = observations
    .filter((o) => statusFilter === "All" || o.status === statusFilter)
    .filter((o) => matchesTagFilter(o.tagIds, tagIds))
    .slice(0, Number(limit) || 5);

  if (filtered.length === 0) return <p className="text-xs opacity-40">No matching observations</p>;

  return (
    <div className="space-y-2">
      {filtered.map((o) => (
        <Link key={o._id} href={`/observations/${o._id}`} className="flex items-start gap-2 hover:opacity-70 transition">
          {o.images?.[0] ? (
            <img src={o.images[0]} alt="" className="h-8 w-8 rounded object-cover flex-shrink-0" />
          ) : (
            <div className="h-8 w-8 rounded flex items-center justify-center flex-shrink-0" style={{ background: "var(--color-bg)" }}>
              <Camera className="h-3.5 w-3.5 opacity-25" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs truncate">{o.text || <span className="opacity-40 italic">No description</span>}</p>
            <div className="flex items-center gap-1 flex-wrap">
              <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold flex-shrink-0 ${STATUS_COLORS[o.status]}`}>{STATUS_LABELS[o.status]}</span>
              {o.status === "open" && <span className="text-[9px] opacity-40">{pendingLabel(daysSince(o.createdAt))}</span>}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function ObservationsWidgetForm({ config, onChange }) {
  const c = config || {};
  const [tags, setTags] = useState(null);

  useEffect(() => {
    apiFetch("/api/tags").then((data) => setTags(data.tags)).catch(() => setTags([]));
  }, []);

  return (
    <div className="space-y-2">
      <select className="input" value={c.statusFilter || "open"} onChange={(e) => onChange({ ...c, statusFilter: e.target.value })}>
        <option value="open">Open only</option>
        <option value="converted">Converted only</option>
        <option value="All">All statuses</option>
      </select>
      <input className="input" type="number" min={1} max={20} placeholder="Max items (default 5)" value={c.limit || ""} onChange={(e) => onChange({ ...c, limit: e.target.value })} />

      <div>
        <label className="text-[11px] font-medium opacity-60 mb-1 block">Only show these tags (leave empty for all)</label>
        {tags === null ? (
          <p className="text-[11px] opacity-40">Loading tags...</p>
        ) : (
          <TagFilterChips tags={tags} selectedIds={c.tagIds} onChange={(tagIds) => onChange({ ...c, tagIds })} />
        )}
      </div>

      <p className="text-[10px] opacity-35">Which dashboards an observation can appear on is set per-observation, on its own page ("Show on these dashboards") - the filters here only narrow down which of those this particular widget shows.</p>
    </div>
  );
}
