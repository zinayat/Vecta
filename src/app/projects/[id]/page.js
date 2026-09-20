"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Trash2, AlertTriangle, DollarSign, TrendingUp, Search, Lightbulb, FileText, Target } from "lucide-react";
import { useRouter } from "next/navigation";
import AppShell from "../../../components/AppShell";
import A3Canvas from "../../../components/projects/A3Canvas";
import CapExForm from "../../../components/projects/CapExForm";
import KpiBuilder from "../../../components/kpi/KpiBuilder";
import { isOnTrack } from "../../../lib/kpiBuilder";
import { flattenHoshinTree } from "../../../lib/hoshinTree";
import { apiFetch } from "../../../lib/apiClient";

const STATUS_COLORS = {
  Draft: "bg-gray-100 text-gray-600",
  Active: "bg-blue-100 text-blue-700",
  OnHold: "bg-amber-100 text-amber-700",
  Completed: "bg-emerald-100 text-emerald-700",
  Cancelled: "bg-red-100 text-red-600",
};

// One accent per category - used for the icon badge, the left border
// strip, and the category pill. Legacy projects (created before category
// existed) fall back to a neutral look keyed by type.
const CATEGORY_META = {
  CapEx: { label: "CapEx / Capital Request", color: "#d97706", icon: DollarSign },
  Improvement: { label: "Improvement / Kaizen", color: "#16a34a", icon: TrendingUp },
  ProblemSolving: { label: "Problem-Solving", color: "#dc2626", icon: Search },
  Innovation: { label: "Innovation", color: "#9333ea", icon: Lightbulb },
};
function categoryMeta(project) {
  return CATEGORY_META[project.category] || { label: project.type, color: "#64748b", icon: FileText };
}

export default function ProjectDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [plans, setPlans] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    apiFetch(`/api/projects/${id}`)
      .then((data) => { setProject(data.project); setNameDraft(data.project.name); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    apiFetch("/api/hoshin").then((data) => setPlans(data.plans)).catch(() => setPlans([]));
  }, [id]);

  async function persist(fields) {
    try {
      const data = await apiFetch(`/api/projects/${id}`, { method: "PUT", body: fields });
      setProject(data.project);
    } catch (err) {
      setError(err.message);
    }
  }

  async function confirmDelete() {
    setDeleteBusy(true);
    try {
      await apiFetch(`/api/projects/${id}`, { method: "DELETE" });
      router.push("/projects");
    } catch (err) {
      setError(err.message);
      setDeleteBusy(false);
    }
  }

  if (loading) return <AppShell><div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin opacity-40" /></div></AppShell>;
  if (!project) return <AppShell><p className="text-sm opacity-50">{error || "Project not found"}</p></AppShell>;

  const meta = categoryMeta(project);
  const Icon = meta.icon;
  const selectedPlan = plans.find((p) => p._id === project.hoshinPlanId);
  const selectedPlanStrategies = selectedPlan ? flattenHoshinTree(selectedPlan).strategies : [];
  const linkedStrategy = selectedPlanStrategies.find((s) => s._id === project.hoshinPriorityId);
  const showCapex = project.category === "CapEx" || (!project.category && project.type === "CapEx");

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto pb-10">
        <div className="flex items-center justify-between mb-3">
          <Link href="/projects" className="inline-flex items-center gap-1.5 text-xs opacity-40 hover:opacity-70 transition">
            <ArrowLeft className="h-3.5 w-3.5" /> All projects
          </Link>
          <button onClick={() => setDeleting(true)} className="inline-flex items-center gap-1 text-xs opacity-30 hover:opacity-80 hover:text-red-500 transition">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>

        <div className="card p-5 mb-4 relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1.5" style={{ background: meta.color }} />
          <div className="pl-3">
            <div className="flex items-start gap-3 mb-3">
              <div className="h-11 w-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `color-mix(in srgb, ${meta.color} 14%, transparent)` }}>
                <Icon className="h-5 w-5" style={{ color: meta.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <input
                  className="text-xl font-black bg-transparent outline-none w-full"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onBlur={() => { if (nameDraft.trim() && nameDraft.trim() !== project.name) persist({ name: nameDraft.trim() }); }}
                />
                <span className="inline-block mt-1 text-[11px] font-bold uppercase tracking-wide" style={{ color: meta.color }}>{meta.label}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap text-xs">
              <select
                className={`rounded-full px-2.5 py-1 font-medium border-0 ${STATUS_COLORS[project.status] || "bg-gray-100"}`}
                value={project.status}
                onChange={(e) => persist({ status: e.target.value })}
              >
                <option value="Draft">Draft</option>
                <option value="Active">Active</option>
                <option value="OnHold">On Hold</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <input
                className="input w-auto py-1"
                placeholder="Owner"
                defaultValue={project.ownerName || ""}
                onBlur={(e) => { if (e.target.value !== project.ownerName) persist({ ownerName: e.target.value }); }}
              />
              {selectedPlan && (
                <Link href={`/hoshin/${selectedPlan._id}`} className="inline-flex items-center gap-1 opacity-60 hover:opacity-90 transition">
                  <Target className="h-3 w-3" /> {selectedPlan.name}{linkedStrategy ? ` · ${linkedStrategy.text}` : ""}
                </Link>
              )}
            </div>
          </div>
        </div>

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        <div className="card p-4 mb-3">
          <p className="text-xs font-bold uppercase tracking-wide opacity-50 mb-3">Link to a Plan</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select
              className="input"
              value={project.hoshinPlanId || ""}
              onChange={(e) => persist({ hoshinPlanId: e.target.value || null, hoshinPriorityId: null })}
            >
              <option value="">Not linked</option>
              {plans.map((p) => <option key={p._id} value={p._id}>{p.name} (FY{p.fiscalYear})</option>)}
            </select>
            {selectedPlanStrategies.length > 0 && (
              <select
                className="input"
                value={project.hoshinPriorityId || ""}
                onChange={(e) => persist({ hoshinPriorityId: e.target.value || null })}
              >
                <option value="">Not specified</option>
                {selectedPlanStrategies.map((s) => <option key={s._id} value={s._id}>{s.text}</option>)}
              </select>
            )}
          </div>
        </div>

        <div className="card p-4 mb-3">
          <p className="text-xs font-bold uppercase tracking-wide opacity-50 mb-3">Success Measure</p>
          <KpiBuilder
            value={project.successMeasure}
            onChange={(next) => persist({ successMeasure: next })}
            labelPlaceholder="e.g. Defect Rate, Cycle Time, Cost Savings"
          />
          <div className="mt-3">
            <label className="text-[11px] font-medium opacity-60 mb-1 block">Current value</label>
            <div className="flex items-center gap-2">
              <input
                className="input text-xs py-1.5 flex-1"
                placeholder="Current value"
                defaultValue={project.successMeasure?.value || ""}
                onBlur={(e) => {
                  const v = e.target.value;
                  if (v !== (project.successMeasure?.value || "")) persist({ successMeasure: { ...project.successMeasure, value: v } });
                }}
              />
              {project.successMeasure?.target && (() => {
                const onTrack = isOnTrack(project.successMeasure.value, project.successMeasure.target, project.successMeasure.direction);
                if (onTrack === null) return null;
                return (
                  <span className={`text-xs font-semibold ${onTrack ? "text-emerald-600" : "text-red-500"}`}>
                    {onTrack ? "On track" : "Off track"}
                  </span>
                );
              })()}
            </div>
          </div>
        </div>

        {showCapex && (
          <div className="mb-3">
            <p className="text-xs font-bold uppercase tracking-wide opacity-50 mb-2">Capital Request</p>
            <CapExForm capex={project.capex} onChange={(capex) => persist({ capex })} />
          </div>
        )}

        <div>
          <p className="text-xs font-bold uppercase tracking-wide opacity-50 mb-2">A3</p>
          <A3Canvas a3={project.a3} onChange={(a3) => persist({ a3 })} />
        </div>
      </div>

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="card w-full max-w-sm p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-9 w-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
              <p className="text-sm font-bold">Delete "{project.name}"?</p>
            </div>
            <p className="text-xs opacity-60 leading-relaxed mb-5">
              This project will be deleted permanently. This action cannot be undone.
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
