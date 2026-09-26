"use client";

import { useState } from "react";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { KpiWidgetDisplay, KpiWidgetForm } from "./KpiWidget";
import { shouldTrackManualHistory, withHistoryPoint } from "../../lib/kpiBuilder";
import { NoteWidgetDisplay, NoteWidgetForm } from "./NoteWidget";
import { ProjectListWidgetDisplay, ProjectListWidgetForm } from "./ProjectListWidget";
import { HoshinSummaryWidgetDisplay, HoshinSummaryWidgetForm } from "./HoshinSummaryWidget";
import { TimerWidgetDisplay, TimerWidgetForm } from "./TimerWidget";
import { SectionWidgetDisplay, SectionWidgetForm } from "./SectionWidget";
import { StatWidgetDisplay, StatWidgetForm } from "./StatWidget";

export const WIDGET_TYPES = {
  kpi: { label: "KPI", Display: KpiWidgetDisplay, Form: KpiWidgetForm },
  stat: { label: "Stat", Display: StatWidgetDisplay, Form: StatWidgetForm },
  note: { label: "Note", Display: NoteWidgetDisplay, Form: NoteWidgetForm },
  projectList: { label: "Project List", Display: ProjectListWidgetDisplay, Form: ProjectListWidgetForm },
  hoshinSummary: { label: "Planning Summary", Display: HoshinSummaryWidgetDisplay, Form: HoshinSummaryWidgetForm },
  timer: { label: "Timer", Display: TimerWidgetDisplay, Form: TimerWidgetForm },
  section: { label: "Section", Display: SectionWidgetDisplay, Form: SectionWidgetForm, noTitleBar: true },
};

// A KPI's value is a real data point - record it in history so "graph"
// display mode has something to plot, capped so the array doesn't grow
// unbounded.
function withHistoryUpdate(widget, nextConfig) {
  if (!shouldTrackManualHistory(widget.type, nextConfig.source)) return nextConfig;
  return { ...nextConfig, history: withHistoryPoint(nextConfig.history, nextConfig.value) };
}

export default function WidgetCard({ widget, onSave, onRemove, allWidgets, readOnly }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(widget.title || "");
  const [config, setConfig] = useState(widget.config || {});

  const meta = WIDGET_TYPES[widget.type];
  if (!meta) return null;
  const { Display, Form, label, noTitleBar } = meta;
  // A KPI tile's top caption is more useful as its category (Safety,
  // Quality, ...) than the generic widget-type name, once one's set - the
  // category is effectively "what kind of KPI is this."
  const topLabel = widget.title || (widget.type === "kpi" && widget.config?.category) || label;
  // Calendar mode renders as a self-contained dark status board (see
  // KpiCalendar) rather than sitting inside the app's usual light card -
  // the whole tile, header included, switches to match it.
  const isCalendarKpi = widget.type === "kpi" && widget.config?.displayMode === "calendar";

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
    <div className="card p-4 relative group" style={isCalendarKpi ? { background: "#1c1f26", borderColor: "rgba(255,255,255,0.06)" } : undefined}>
      {!noTitleBar && (
        <div className="flex items-center justify-between mb-2">
          <p className={isCalendarKpi ? "text-sm font-bold text-white uppercase tracking-wide break-words min-w-0" : "text-xs font-semibold opacity-50 uppercase tracking-wide break-words min-w-0"}>{topLabel}</p>
          {!readOnly && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0 ml-2" style={isCalendarKpi ? { color: "rgba(255,255,255,0.6)" } : undefined}>
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
      <Display
        config={widget.config}
        allWidgets={allWidgets}
        onRequestEdit={!readOnly ? () => setEditing(true) : undefined}
        onClearHistory={!readOnly ? () => onSave({ ...widget, config: { ...widget.config, history: [], value: "" } }) : undefined}
      />
    </div>
  );
}
