"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/apiClient";

export default function LinkedSourcePicker({ value, onChange, currentWidgetId }) {
  const [dashboards, setDashboards] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    apiFetch("/api/dashboards").then((d) => setDashboards(d.dashboards)).catch(() => setDashboards([]));
    apiFetch("/api/projects").then((d) => setProjects(d.projects)).catch(() => setProjects([]));
  }, []);

  const kpiOptions = [];
  for (const d of dashboards) {
    for (const w of d.widgets.filter((w) => w.type === "kpi" && w._id !== currentWidgetId)) {
      kpiOptions.push({ dashboardId: d._id, widgetId: w._id, label: `${d.name} → ${w.title || w.config?.label || "Untitled KPI"}` });
    }
  }
  const projectOptions = projects.filter((p) => p.successMeasure?.label);

  function selectKpi(e) {
    const key = e.target.value;
    if (!key) { onChange(null); return; }
    const opt = kpiOptions.find((o) => `${o.dashboardId}:${o.widgetId}` === key);
    onChange({ kind: "kpiWidget", dashboardId: opt.dashboardId, widgetId: opt.widgetId, label: opt.label });
  }

  function selectProject(e) {
    const id = e.target.value;
    if (!id) { onChange(null); return; }
    const p = projectOptions.find((p) => p._id === id);
    onChange({ kind: "projectSuccessMeasure", projectId: p._id, label: `${p.name} → ${p.successMeasure.label}` });
  }

  return (
    <div className="space-y-2">
      <div>
        <label className="text-[11px] font-medium opacity-60 mb-1 block">Link to another KPI tile</label>
        <select className="input text-xs py-1.5" value={value?.kind === "kpiWidget" ? `${value.dashboardId}:${value.widgetId}` : ""} onChange={selectKpi}>
          <option value="">Not selected</option>
          {kpiOptions.map((o) => <option key={`${o.dashboardId}:${o.widgetId}`} value={`${o.dashboardId}:${o.widgetId}`}>{o.label}</option>)}
        </select>
      </div>
      <div>
        <label className="text-[11px] font-medium opacity-60 mb-1 block">...or a project's success measure</label>
        <select className="input text-xs py-1.5" value={value?.kind === "projectSuccessMeasure" ? value.projectId : ""} onChange={selectProject}>
          <option value="">Not selected</option>
          {projectOptions.map((p) => <option key={p._id} value={p._id}>{p.name} - {p.successMeasure.label}</option>)}
        </select>
      </div>
      <p className="text-[10px] opacity-35">Mirrors that item's current value live. Works best when the target's value is entered manually there.</p>
    </div>
  );
}
