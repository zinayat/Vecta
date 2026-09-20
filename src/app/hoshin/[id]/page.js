"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, LayoutGrid, FolderKanban } from "lucide-react";
import AppShell from "../../../components/AppShell";
import HoshinCascadeTable from "../../../components/hoshin/HoshinCascadeTable";
import { flattenHoshinTree } from "../../../lib/hoshinTree";
import { useAuth } from "../../../context/AuthContext";
import { apiFetch } from "../../../lib/apiClient";

const STATUS_COLORS = {
  Draft: "bg-gray-100 text-gray-600",
  Active: "bg-blue-100 text-blue-700",
  OnHold: "bg-amber-100 text-amber-700",
  Completed: "bg-emerald-100 text-emerald-700",
  Cancelled: "bg-red-100 text-red-600",
};

export default function HoshinDetailPage({ params }) {
  const { id } = use(params);
  const { user } = useAuth();
  const canEdit = user?.role === "Admin" || user?.role === "Manager";
  const [plan, setPlan] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch(`/api/hoshin/${id}`)
      .then((data) => setPlan(data.plan))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // Auto-display, not manual re-entry - any project linked to this plan
    // (Project.hoshinPlanId) shows up here live, the same relationship
    // the X-Matrix's north edge already reads.
    apiFetch(`/api/projects?hoshinPlanId=${id}`).then((data) => setProjects(data.projects)).catch(() => setProjects([]));
  }, [id]);

  async function persistBreakthroughObjectives(next) {
    try {
      const data = await apiFetch(`/api/hoshin/${id}`, { method: "PUT", body: { breakthroughObjectives: next } });
      setPlan(data.plan);
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <AppShell><div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin opacity-40" /></div></AppShell>;
  if (!plan) return <AppShell><p className="text-sm opacity-50">{error || "Plan not found"}</p></AppShell>;

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto pb-10">
        <div className="flex items-center justify-between mb-3">
          <Link href="/hoshin" className="inline-flex items-center gap-1.5 text-xs opacity-40 hover:opacity-70 transition">
            <ArrowLeft className="h-3.5 w-3.5" /> All plans
          </Link>
          <Link href={`/hoshin/${id}/xmatrix`} className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--color-accent)" }}>
            <LayoutGrid className="h-3.5 w-3.5" /> View X-Matrix
          </Link>
        </div>

        <h1 className="text-lg font-bold mb-0.5">{plan.name}</h1>
        <p className="text-xs opacity-40 mb-2">
          Fiscal Year {plan.fiscalYear}
          {!canEdit && <span className="italic"> · View only - ask an Admin or Manager to make changes</span>}
        </p>
        <p className="text-xs opacity-40 mb-5">
          Breakthrough Objective <span className="opacity-30">→</span> Annual Objective <span className="opacity-30">→</span> Strategy / Project, Target / KPI, Owner
        </p>

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        <HoshinCascadeTable
          breakthroughObjectives={plan.breakthroughObjectives || []}
          onChange={persistBreakthroughObjectives}
          readOnly={!canEdit}
        />

        {projects.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-bold uppercase tracking-wide opacity-50 mb-2">Linked Projects</p>
            <p className="text-[11px] opacity-35 mb-2">Every A3/CapEx project pointed at this plan - live, not manually maintained</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {projects.map((p) => {
                const strategy = flattenHoshinTree(plan).strategies.find((s) => s._id === p.hoshinPriorityId);
                return (
                  <Link key={p._id} href={`/projects/${p._id}`} className="card p-3 hover:shadow-md transition flex items-start gap-2.5">
                    <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "color-mix(in srgb, var(--color-primary) 10%, transparent)" }}>
                      <FolderKanban className="h-3.5 w-3.5" style={{ color: "var(--color-primary)" }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{p.name}</p>
                      <p className="text-[11px] opacity-40 truncate">{strategy ? strategy.text : p.type}</p>
                    </div>
                    <span className={`ml-auto flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[p.status] || "bg-gray-100 text-gray-600"}`}>
                      {p.status}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
