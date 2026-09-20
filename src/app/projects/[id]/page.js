"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import AppShell from "../../../components/AppShell";
import A3Canvas from "../../../components/projects/A3Canvas";
import CapExForm from "../../../components/projects/CapExForm";
import KpiBuilder from "../../../components/kpi/KpiBuilder";
import { isOnTrack } from "../../../lib/kpiBuilder";
import { apiFetch } from "../../../lib/apiClient";

const STATUS_COLORS = {
  Draft: "bg-gray-100 text-gray-600",
  Active: "bg-blue-100 text-blue-700",
  OnHold: "bg-amber-100 text-amber-700",
  Completed: "bg-emerald-100 text-emerald-700",
  Cancelled: "bg-red-100 text-red-600",
};

export default function ProjectDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nameDraft, setNameDraft] = useState("");

  useEffect(() => {
    apiFetch(`/api/projects/${id}`)
      .then((data) => { setProject(data.project); setNameDraft(data.project.name); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function persist(fields) {
    try {
      const data = await apiFetch(`/api/projects/${id}`, { method: "PUT", body: fields });
      setProject(data.project);
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove() {
    if (!confirm(`Delete "${project.name}"? This can't be undone.`)) return;
    try {
      await apiFetch(`/api/projects/${id}`, { method: "DELETE" });
      router.push("/projects");
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <AppShell><div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin opacity-40" /></div></AppShell>;
  if (!project) return <AppShell><p className="text-sm opacity-50">{error || "Project not found"}</p></AppShell>;

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto pb-10">
        <Link href="/projects" className="inline-flex items-center gap-1.5 text-xs opacity-40 hover:opacity-70 transition mb-3">
          <ArrowLeft className="h-3.5 w-3.5" /> All projects
        </Link>

        <div className="card p-4 mb-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <input
              className="text-lg font-bold bg-transparent outline-none flex-1 min-w-0"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={() => { if (nameDraft.trim() && nameDraft.trim() !== project.name) persist({ name: nameDraft.trim() }); }}
            />
            <button onClick={remove} className="p-1.5 opacity-30 hover:opacity-80 hover:text-red-500 transition flex-shrink-0"><Trash2 className="h-4 w-4" /></button>
          </div>

          <div className="flex items-center gap-3 flex-wrap text-xs">
            <span className="rounded-full px-2.5 py-1 font-medium opacity-60" style={{ background: "var(--color-bg)" }}>{project.type}</span>
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
          </div>
        </div>

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

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

        {project.type === "A3" ? (
          <A3Canvas a3={project.a3} onChange={(a3) => persist({ a3 })} />
        ) : (
          <CapExForm capex={project.capex} onChange={(capex) => persist({ capex })} />
        )}
      </div>
    </AppShell>
  );
}
