"use client";

import { useState } from "react";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { KpiWidgetDisplay, KpiWidgetForm } from "./KpiWidget";
import { NoteWidgetDisplay, NoteWidgetForm } from "./NoteWidget";
import { ProjectListWidgetDisplay, ProjectListWidgetForm } from "./ProjectListWidget";
import { HoshinSummaryWidgetDisplay, HoshinSummaryWidgetForm } from "./HoshinSummaryWidget";
import { TimerWidgetDisplay, TimerWidgetForm } from "./TimerWidget";
import { SectionWidgetDisplay, SectionWidgetForm } from "./SectionWidget";

export const WIDGET_TYPES = {
  kpi: { label: "KPI", Display: KpiWidgetDisplay, Form: KpiWidgetForm },
  note: { label: "Note", Display: NoteWidgetDisplay, Form: NoteWidgetForm },
  projectList: { label: "Project List", Display: ProjectListWidgetDisplay, Form: ProjectListWidgetForm },
  hoshinSummary: { label: "Hoshin Summary", Display: HoshinSummaryWidgetDisplay, Form: HoshinSummaryWidgetForm },
  timer: { label: "Timer", Display: TimerWidgetDisplay, Form: TimerWidgetForm },
  section: { label: "Section", Display: SectionWidgetDisplay, Form: SectionWidgetForm, noTitleBar: true },
};

// A KPI's value changing is a real data point - append it to history so
// "graph" display mode has something to plot, capped so the array doesn't
// grow unbounded.
function withHistoryUpdate(widget, nextConfig) {
  if (widget.type !== "kpi" || ["consolidation", "linked", "api"].includes(nextConfig.source)) return nextConfig;
  const prevValue = widget.config?.value;
  const nextValue = nextConfig.value;
  if (nextValue === undefined || nextValue === "" || nextValue === prevValue) return nextConfig;

  const history = [...(nextConfig.history || []), { date: new Date().toISOString().slice(0, 10), value: Number(nextValue) }].slice(-30);
  return { ...nextConfig, history };
}

export default function WidgetCard({ widget, onSave, onRemove, allWidgets, readOnly }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(widget.title || "");
  const [config, setConfig] = useState(widget.config || {});

  const meta = WIDGET_TYPES[widget.type];
  if (!meta) return null;
  const { Display, Form, label, noTitleBar } = meta;

  function save() {
    onSave({ ...widget, title, config: withHistoryUpdate(widget, config) });
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="card p-4 relative">
        <div className="flex items-center justify-between mb-2">
          <input className="input text-xs py-1" placeholder={label} value={title} onChange={(e) => setTitle(e.target.value)} />
          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            <button onClick={save} className="p-1 text-emerald-600"><Check className="h-3.5 w-3.5" /></button>
            <button onClick={() => setEditing(false)} className="p-1 opacity-40"><X className="h-3.5 w-3.5" /></button>
          </div>
        </div>
        <Form config={config} onChange={setConfig} siblingWidgets={allWidgets} widgetId={widget._id} />
      </div>
    );
  }

  return (
    <div className="card p-4 relative group">
      {!noTitleBar && (
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold opacity-50 uppercase tracking-wide">{widget.title || label}</p>
          {!readOnly && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0 ml-2">
              <button onClick={() => setEditing(true)} className="p-1 opacity-40 hover:opacity-80"><Pencil className="h-3.5 w-3.5" /></button>
              <button onClick={onRemove} className="p-1 opacity-40 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          )}
        </div>
      )}
      {noTitleBar && !readOnly && (
        <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
          <button onClick={() => setEditing(true)} className="p-1 opacity-40 hover:opacity-80"><Pencil className="h-3.5 w-3.5" /></button>
          <button onClick={onRemove} className="p-1 opacity-40 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      )}
      <Display config={widget.config} allWidgets={allWidgets} />
    </div>
  );
}
