"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import AppShell from "../../../../components/AppShell";
import CorrelationGrid from "../../../../components/hoshin/CorrelationGrid";
import RaciPanel from "../../../../components/hoshin/RaciPanel";
import { useAuth } from "../../../../context/AuthContext";
import { apiFetch } from "../../../../lib/apiClient";

const STATUS_COLORS = {
  Draft: "bg-gray-100 text-gray-600",
  Active: "bg-blue-100 text-blue-700",
  OnHold: "bg-amber-100 text-amber-700",
  Completed: "bg-emerald-100 text-emerald-700",
  Cancelled: "bg-red-100 text-red-600",
};

function Quadrant({ label, children, className = "" }) {
  return (
    <div className={`card p-4 ${className}`}>
      <p className="text-xs font-bold uppercase tracking-wide opacity-50 mb-2">{label}</p>
      {children}
    </div>
  );
}

function PlainList({ items, emptyText }) {
  if (!items.length) return <p className="text-xs opacity-35 italic">{emptyText}</p>;
  return (
    <ul className="space-y-1.5">
      {items.map((i) => (
        <li key={i._id} className="text-xs leading-snug">{i.text}</li>
      ))}
    </ul>
  );
}

export default function XMatrixPage({ params }) {
  const { id } = use(params);
  const { user } = useAuth();
  const canEdit = user?.role === "Admin" || user?.role === "Manager";
  const [plan, setPlan] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function load() {
    Promise.all([
      apiFetch(`/api/hoshin/${id}`),
      apiFetch(`/api/projects?hoshinPlanId=${id}&limit=50`),
    ])
      .then(([planData, projectData]) => {
        setPlan(planData.plan);
        setProjects(projectData.projects);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, [id]);

  async function persist(fields) {
    try {
      const data = await apiFetch(`/api/hoshin/${id}`, { method: "PUT", body: fields });
      setPlan(data.plan);
    } catch (err) {
      setError(err.message);
    }
  }

  function toggleProjectCorrelation(rowId, colId, strength) {
    const rest = plan.projectCorrelations.filter((c) => !(c.rowId === rowId && c.colId === colId));
    const next = strength ? [...rest, { rowId, colId, strength }] : rest;
    persist({ projectCorrelations: next });
  }

  function addRaci(name, type) {
    persist({ raci: [...plan.raci, { name, type }] });
  }

  function removeRaci(entryId) {
    persist({ raci: plan.raci.filter((r) => r._id !== entryId) });
  }

  if (loading) return <AppShell><div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin opacity-40" /></div></AppShell>;
  if (!plan) return <AppShell><p className="text-sm opacity-50">{error || "Plan not found"}</p></AppShell>;

  const projectCols = projects.map((p) => ({ _id: p._id, text: p.name }));

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto pb-10">
        <Link href={`/hoshin/${id}`} className="inline-flex items-center gap-1.5 text-xs opacity-40 hover:opacity-70 transition mb-3">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to plan editor
        </Link>

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr_1fr] gap-3">
          {/* Row 1 */}
          <Quadrant label={plan.name}>
            <p className="text-xs opacity-40">Fiscal Year {plan.fiscalYear}</p>
            <p className="text-[11px] opacity-30 mt-2">X-Matrix: strategy on one page</p>
          </Quadrant>

          <Quadrant label="North · Projects">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] opacity-35">Projects linked to this plan</p>
              {canEdit && (
                <Link href={`/projects/new?hoshinPlanId=${id}`} className="flex items-center gap-1 text-[11px] font-semibold flex-shrink-0" style={{ color: "var(--color-accent)" }}>
                  <Plus className="h-3 w-3" /> Add
                </Link>
              )}
            </div>
            {projects.length === 0 ? (
              <p className="text-xs opacity-35 italic">No projects linked yet</p>
            ) : (
              <ul className="space-y-1.5">
                {projects.map((p) => (
                  <li key={p._id}>
                    <Link href={`/projects/${p._id}`} className="flex items-center justify-between gap-2 text-xs hover:opacity-70 transition">
                      <span className="truncate">{p.name}</span>
                      <span className={`flex-shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${STATUS_COLORS[p.status]}`}>{p.status}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Quadrant>

          <Quadrant label="Legend">
            <p className="text-xs opacity-50 mb-1">● Primary link</p>
            <p className="text-xs opacity-50">○ Secondary link</p>
          </Quadrant>

          {/* Row 2 */}
          <Quadrant label="West · Annual Objectives">
            <PlainList items={plan.annualObjectives} emptyText="No annual objectives yet - add them in the plan editor" />
          </Quadrant>

          <Quadrant label="Center · Linkage">
            <CorrelationGrid
              rows={plan.annualObjectives}
              cols={projectCols}
              correlations={plan.projectCorrelations}
              onToggle={toggleProjectCorrelation}
              readOnly={!canEdit}
              title=""
              hint="Which projects move which annual objectives"
              emptyMessage="Add Annual Objectives (plan editor) and link at least one Project to see the grid."
              bare
            />
          </Quadrant>

          <Quadrant label="East · Metrics / KPIs">
            <PlainList items={plan.metrics} emptyText="No metrics yet - add them in the plan editor" />
          </Quadrant>

          {/* Row 3 */}
          <div />

          <Quadrant label="South · Long-Term Objectives">
            <PlainList items={plan.longTermObjectives} emptyText="No long-term objectives yet - add them in the plan editor" />
          </Quadrant>

          <Quadrant label="">
            <RaciPanel entries={plan.raci} onAdd={addRaci} onRemove={removeRaci} readOnly={!canEdit} />
          </Quadrant>
        </div>
      </div>
    </AppShell>
  );
}
