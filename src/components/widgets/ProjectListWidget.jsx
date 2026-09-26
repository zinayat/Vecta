"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { apiFetch } from "../../lib/apiClient";
import TagFilterChips, { matchesTagFilter } from "../tasks/TagFilterChips";

const STATUS_COLORS = {
  Draft: "bg-gray-100 text-gray-600",
  Active: "bg-blue-100 text-blue-700",
  OnHold: "bg-amber-100 text-amber-700",
  Completed: "bg-emerald-100 text-emerald-700",
  Cancelled: "bg-red-100 text-red-600",
};

export function ProjectListWidgetDisplay({ config, dashboardId }) {
  const { typeFilter = "All", statusFilter = "All", limit = 5, tagIds = [], onlyThisDashboard = false } = config || {};
  const [projects, setProjects] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (typeFilter !== "All") params.set("type", typeFilter);
    if (statusFilter !== "All") params.set("status", statusFilter);
    // Opt-in scoping to just this board's own projects (each project picks
    // its target dashboards on its own page, "Show on these dashboards") -
    // off by default so a widget added before this existed keeps showing
    // every matching project company-wide, not suddenly nothing because no
    // project had opted into this specific board yet.
    if (onlyThisDashboard && dashboardId) params.set("dashboardId", dashboardId);
    params.set("limit", String(limit || 5));
    apiFetch(`/api/projects?${params.toString()}`)
      .then((data) => setProjects(data.projects))
      .catch(() => setProjects([]));
  }, [typeFilter, statusFilter, limit, onlyThisDashboard, dashboardId]);

  if (projects === null) return <Loader2 className="h-4 w-4 animate-spin opacity-40" />;

  const filtered = projects.filter((p) => matchesTagFilter(p.tagIds, tagIds));
  if (filtered.length === 0) return <p className="text-xs opacity-40">No matching projects</p>;

  return (
    <div className="space-y-1.5">
      {filtered.map((p) => (
        <Link key={p._id} href={`/projects/${p._id}`} className="flex items-center justify-between gap-2 text-xs hover:opacity-70 transition">
          <span className="truncate">{p.name}</span>
          <span className={`flex-shrink-0 rounded-full px-2 py-0.5 font-medium ${STATUS_COLORS[p.status] || "bg-gray-100 text-gray-600"}`}>
            {p.status}
          </span>
        </Link>
      ))}
    </div>
  );
}

export function ProjectListWidgetForm({ config, onChange }) {
  const c = config || {};
  const [tags, setTags] = useState(null);

  useEffect(() => {
    apiFetch("/api/tags").then((data) => setTags(data.tags)).catch(() => setTags([]));
  }, []);

  return (
    <div className="space-y-2">
      <select className="input" value={c.typeFilter || "All"} onChange={(e) => onChange({ ...c, typeFilter: e.target.value })}>
        <option value="All">All types</option>
        <option value="A3">A3 only</option>
        <option value="CapEx">CapEx only</option>
      </select>
      <select className="input" value={c.statusFilter || "All"} onChange={(e) => onChange({ ...c, statusFilter: e.target.value })}>
        <option value="All">All statuses</option>
        <option value="Draft">Draft</option>
        <option value="Active">Active</option>
        <option value="OnHold">On Hold</option>
        <option value="Completed">Completed</option>
        <option value="Cancelled">Cancelled</option>
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

      <label className="flex items-center gap-1.5 text-xs opacity-80">
        <input type="checkbox" checked={!!c.onlyThisDashboard} onChange={(e) => onChange({ ...c, onlyThisDashboard: e.target.checked })} />
        Only projects pulled into this dashboard
      </label>
      <p className="text-[10px] opacity-35">
        A project is "pulled into" a dashboard from its own page ("Show on these dashboards"). Leave this off to keep showing every matching project company-wide, regardless of which boards it's assigned to.
      </p>
    </div>
  );
}
