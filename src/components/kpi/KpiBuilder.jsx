"use client";

import { Sparkles } from "lucide-react";
import { MEASUREMENT_TYPES, suggestKpiShape, suggestDisplay, suggestSuccessDescription } from "../../lib/kpiBuilder";

// The same guided "define a KPI" form embedded in Dashboards (KPI widgets),
// Hoshin (strategy row targets), and Projects (success measure) - one
// place to keep the fields and the rule-based suggestions consistent.
export default function KpiBuilder({ value, onChange, labelPlaceholder }) {
  const v = value || {};
  function set(field) {
    return (e) => onChange({ ...v, [field]: e.target.value });
  }

  function applyShapeSuggestion() {
    const shape = suggestKpiShape(v.label);
    // Only set the initial display (number/percent/graph + chart type) the
    // first time, while it's still unset - once a KPI has a display, that's
    // the user's own choice from Settings and Suggest shouldn't reset it.
    const display = v.displayMode ? {} : suggestDisplay(shape.measurementType, shape.direction);
    onChange({ ...v, ...shape, ...display });
  }

  function applyDescriptionSuggestion() {
    onChange({ ...v, whatSuccessLooksLike: suggestSuccessDescription(v) });
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[11px] font-medium opacity-60 mb-1 block">Key performance - what are we measuring?</label>
        <div className="flex items-center gap-1.5">
          <input className="input text-xs py-1.5 flex-1 min-w-0" value={v.label || ""} onChange={set("label")} placeholder={labelPlaceholder || "e.g. On-Time Delivery"} />
          <button type="button" onClick={applyShapeSuggestion} title="Suggest how this is usually measured" className="p-1.5 rounded-lg opacity-50 hover:opacity-90 transition flex-shrink-0">
            <Sparkles className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div>
        <label className="text-[11px] font-medium opacity-60 mb-1 block">How will success be measured?</label>
        <div className="grid grid-cols-2 gap-1.5">
          <select className="input text-xs py-1.5" value={v.measurementType || "Count"} onChange={set("measurementType")}>
            {MEASUREMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="input text-xs py-1.5" value={v.direction || "higherIsBetter"} onChange={set("direction")}>
            <option value="higherIsBetter">Higher is better</option>
            <option value="lowerIsBetter">Lower is better</option>
          </select>
          <input className="input text-xs py-1.5" placeholder="Target" value={v.target || ""} onChange={set("target")} />
          <input className="input text-xs py-1.5" placeholder="Unit (e.g. %, $, units)" value={v.unit || ""} onChange={set("unit")} disabled={v.measurementType === "Percentage"} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[11px] font-medium opacity-60 block">What does success look like?</label>
          <button type="button" onClick={applyDescriptionSuggestion} className="flex items-center gap-1 text-[10px] font-semibold opacity-70 hover:opacity-100 transition flex-shrink-0" style={{ color: "var(--color-accent)" }}>
            <Sparkles className="h-3 w-3" /> Suggest
          </button>
        </div>
        <textarea
          className="input text-xs resize-none"
          rows={2}
          value={v.whatSuccessLooksLike || ""}
          onChange={set("whatSuccessLooksLike")}
          placeholder="Describe what success looks like in plain terms..."
        />
      </div>
    </div>
  );
}
