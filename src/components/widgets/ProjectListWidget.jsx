"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { apiFetch } from "../../lib/apiClient";

const STATUS_COLORS = {
  Draft: "bg-gray-100 text-gray-600",
  Active: "bg-blue-100 text-blue-700",
  OnHold: "bg-amber-100 text-amber-700",
  Completed: "bg-emerald-100 text-emerald-700",
  Cancelled: "bg-red-100 text-red-600",
};

export function ProjectListWidgetDisplay({ config }) {
  const { typeFilter = "All", statusFilter = "All", limit = 5 } = config || {};
  const [projects, setProjects] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (typeFilter !== "All") params.set("type", typeFilter);
    if (statusFilter !== "All") params.set("status", statusFilter);
    params.set("limit", String(limit || 5));
    apiFetch(`/api/projects?${params.toString()}`)
      .then((data) => setProjects(data.projects))
      .catch(() => setProjects([]));
  }, [typeFilter, statusFilter, limit]);

  if (projects === null) return <Loader2 className="h-4 w-4 animate-spin opacity-40" />;
  if (projects.length === 0) return <p className="text-xs opacity-40">No matching projects</p>;

  return (
    <div className="space-y-1.5">
      {projects.map((p) => (
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
    </div>
  );
}
