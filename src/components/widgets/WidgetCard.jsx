"use client";

import { useState } from "react";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { KpiWidgetDisplay, KpiWidgetForm } from "./KpiWidget";
import { NoteWidgetDisplay, NoteWidgetForm } from "./NoteWidget";
import { ProjectListWidgetDisplay, ProjectListWidgetForm } from "./ProjectListWidget";
import { HoshinSummaryWidgetDisplay, HoshinSummaryWidgetForm } from "./HoshinSummaryWidget";

export const WIDGET_TYPES = {
  kpi: { label: "KPI", Display: KpiWidgetDisplay, Form: KpiWidgetForm },
  note: { label: "Note", Display: NoteWidgetDisplay, Form: NoteWidgetForm },
  projectList: { label: "Project List", Display: ProjectListWidgetDisplay, Form: ProjectListWidgetForm },
  hoshinSummary: { label: "Hoshin Summary", Display: HoshinSummaryWidgetDisplay, Form: HoshinSummaryWidgetForm },
};

export default function WidgetCard({ widget, onSave, onRemove }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(widget.title || "");
  const [config, setConfig] = useState(widget.config || {});

  const meta = WIDGET_TYPES[widget.type];
  if (!meta) return null;
  const { Display, Form, label } = meta;

  function save() {
    onSave({ ...widget, title, config });
    setEditing(false);
  }

  return (
    <div className="card p-4 relative group">
      <div className="flex items-center justify-between mb-2">
        {editing ? (
          <input className="input text-xs py-1" placeholder={label} value={title} onChange={(e) => setTitle(e.target.value)} />
        ) : (
          <p className="text-xs font-semibold opacity-50 uppercase tracking-wide">{widget.title || label}</p>
        )}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0 ml-2">
          {editing ? (
            <>
              <button onClick={save} className="p-1 text-emerald-600"><Check className="h-3.5 w-3.5" /></button>
              <button onClick={() => setEditing(false)} className="p-1 opacity-40"><X className="h-3.5 w-3.5" /></button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="p-1 opacity-40 hover:opacity-80"><Pencil className="h-3.5 w-3.5" /></button>
              <button onClick={onRemove} className="p-1 opacity-40 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
            </>
          )}
        </div>
      </div>

      {editing ? <Form config={config} onChange={setConfig} /> : <Display config={widget.config} />}
    </div>
  );
}
