"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { WIDGET_TYPES } from "./WidgetCard";
import { shouldTrackManualHistory, withHistoryPoint } from "../../lib/kpiBuilder";
import { sectionIdForIndex } from "../../lib/dashboardSections";

// Guesses which section a newly-picked widget type belongs in: wherever
// the last widget of that same type already lives, or - if this is the
// first of its kind - the last section on the board, so a brand new
// widget doesn't default to "no section" just because nothing of its
// type exists yet. Sections themselves aren't nested, so a new Section
// widget always defaults to the top level regardless of where earlier
// sections sit.
function defaultSectionFor(widgets, nextType, sections) {
  if (sections.length === 0) return "";
  if (nextType === "section") return "";
  for (let i = widgets.length - 1; i >= 0; i--) {
    if (widgets[i].type === nextType) return sectionIdForIndex(widgets, i) || "";
  }
  return sections[sections.length - 1]._id;
}

export default function AddWidgetModal({ onAdd, onClose, allWidgets }) {
  const [type, setType] = useState("kpi");
  const [title, setTitle] = useState("");
  const [config, setConfig] = useState({});
  const sections = (allWidgets || []).filter((w) => w.type === "section");
  const [sectionId, setSectionId] = useState(() => defaultSectionFor(allWidgets || [], "kpi", sections));

  const { Form } = WIDGET_TYPES[type];

  function changeType(nextType) {
    setType(nextType);
    setConfig({});
    setSectionId(defaultSectionFor(allWidgets || [], nextType, sections));
  }

  function add() {
    const finalConfig = shouldTrackManualHistory(type, config.source)
      ? { ...config, history: withHistoryPoint(config.history, config.value) }
      : config;
    onAdd({ type, title, config: finalConfig }, sectionId || null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
      <div className="card w-full max-w-sm p-5 max-h-full overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold">Add a widget</p>
          <button onClick={onClose} className="opacity-40 hover:opacity-80"><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-3">
          <select
            className="input"
            value={type}
            onChange={(e) => changeType(e.target.value)}
          >
            {Object.entries(WIDGET_TYPES).map(([key, meta]) => (
              <option key={key} value={key}>{meta.label}</option>
            ))}
          </select>

          {sections.length > 0 && type !== "section" && (
            <div>
              <label className="text-[11px] font-medium opacity-60 mb-1 block">Which section?</label>
              <select className="input" value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
                <option value="">No section</option>
                {sections.map((s) => (
                  <option key={s._id} value={s._id}>{s.config?.title || "Untitled section"}</option>
                ))}
              </select>
            </div>
          )}

          <input className="input" placeholder="Widget title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />

          <Form config={config} onChange={setConfig} siblingWidgets={allWidgets} />

          <button onClick={add} className="btn-primary w-full mt-2">Add widget</button>
        </div>
      </div>
    </div>
  );
}
