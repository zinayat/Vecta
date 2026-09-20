"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderKanban, Plus, Loader2, Sparkles } from "lucide-react";
import AppShell from "../../components/AppShell";
import { apiFetch } from "../../lib/apiClient";

const STATUS_COLORS = {
  Draft: "bg-gray-100 text-gray-600",
  Active: "bg-blue-100 text-blue-700",
  OnHold: "bg-amber-100 text-amber-700",
  Completed: "bg-emerald-100 text-emerald-700",
  Cancelled: "bg-red-100 text-red-600",
};

const CATEGORY_COLORS = {
  CapEx: "#d97706",
  Improvement: "#16a34a",
  ProblemSolving: "#dc2626",
  Innovation: "#9333ea",
};

export default function ProjectsListPage() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    const params = new URLSearchParams();
    if (typeFilter !== "All") params.set("type", typeFilter);
    if (statusFilter !== "All") params.set("status", statusFilter);
    setLoading(true);
    apiFetch(`/api/projects?${params.toString()}`)
      .then((data) => setProjects(data.projects))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [typeFilter, statusFilter]);

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--color-primary) 10%, transparent)" }}>
              <FolderKanban className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
            </div>
            <div>
              <h1 className="text-lg font-bold">Projects</h1>
              <p className="text-xs opacity-50">A3 problem-solving and CapEx requests</p>
            </div>
          </div>
          <button onClick={() => router.push("/projects/new")} className="btn-primary">
            <Sparkles className="h-4 w-4" /> New Project with Vecta Live
          </button>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <select className="input w-auto" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="All">All types</option>
            <option value="A3">A3</option>
            <option value="CapEx">CapEx</option>
          </select>
          <select className="input w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All statuses</option>
            <option value="Draft">Draft</option>
            <option value="Active">Active</option>
            <option value="OnHold">On Hold</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin opacity-40" /></div>
        ) : projects.length === 0 ? (
          <div className="card p-10 text-center"><p className="text-sm opacity-50">No projects match these filters.</p></div>
        ) : (
          <div className="space-y-2">
            {projects.map((p) => (
              <button
                key={p._id}
                onClick={() => router.push(`/projects/${p._id}`)}
                className="card p-3.5 w-full flex items-center justify-between text-left hover:shadow-md transition"
              >
                <div className="min-w-0 flex items-center gap-2.5">
                  {p.category && <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: CATEGORY_COLORS[p.category] }} />}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{p.name}</p>
                    <p className="text-xs opacity-40">{p.category || p.type}{p.ownerName ? ` · ${p.ownerName}` : ""}</p>
                  </div>
                </div>
                <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[p.status] || "bg-gray-100 text-gray-600"}`}>
                  {p.status}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
