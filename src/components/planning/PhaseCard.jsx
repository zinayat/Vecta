"use client";

import { AlertTriangle } from "lucide-react";
import ListInput from "./ListInput";
import { PHASE_LABELS, PHASE_DESCRIPTIONS, PHASE_FIELD_CONFIG } from "../../lib/planningMeta";
import { computePhaseResult, formatResultValue } from "../../lib/planningCalc";
import { STATUS_LABELS, STATUS_COLORS, STATUS_ORDER } from "../../lib/taskMeta";

// One planning phase, fully working: status/owner/date/notes tracking
// (same shape as a Task, for consistency) plus real route-specific data
// entry and a computed result - not just a description. The field
// config and calculation are looked up by phaseKey+route so this one
// component renders all five phases for both routes.
export default function PhaseCard({ phaseKey, route, value, onChange, users, saving }) {
  const v = value || {};
  const inputs = v.inputs || {};
  const config = PHASE_FIELD_CONFIG[phaseKey][route];
  const result = computePhaseResult(phaseKey, route, inputs);
  const formatted = formatResultValue(result);

  function set(field) {
    return (e) => onChange({ ...v, [field]: e.target.value });
  }
  function setInputs(nextInputs) {
    onChange({ ...v, inputs: nextInputs });
  }
  function setInputField(key) {
    return (e) => setInputs({ ...inputs, [key]: e.target.value });
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
        <p className="text-sm font-bold flex items-center gap-1.5">
          {PHASE_LABELS[phaseKey]}
          {saving && <span className="text-[10px] font-normal opacity-35">Saving...</span>}
        </p>
        <div className="flex items-center gap-1">
          {STATUS_ORDER.map((s) => (
            <button
              key={s}
              onClick={() => onChange({ ...v, status: s })}
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition ${v.status === s ? STATUS_COLORS[s] : "opacity-40 hover:opacity-70"}`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs opacity-50 mb-3">{PHASE_DESCRIPTIONS[phaseKey][route]}</p>

      <div className="flex gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <label className="text-[11px] font-medium opacity-60 mb-1 block">Owner</label>
          <select className="input flex-1 min-w-0" value={v.ownerUserId || ""} onChange={set("ownerUserId")}>
            <option value="">Unassigned</option>
            {(users || []).map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-0">
          <label className="text-[11px] font-medium opacity-60 mb-1 block">As of</label>
          <input type="date" className="input flex-1 min-w-0" value={v.date || ""} onChange={set("date")} />
        </div>
      </div>

      <div className="mb-3">
        <label className="text-[11px] font-medium opacity-60 mb-1 block">
          {config.type === "list" ? "Entries" : "Inputs"}
        </label>
        {config.type === "list" ? (
          <ListInput
            columns={config.columns}
            rows={inputs[config.key] || []}
            onChange={(rows) => setInputs({ ...inputs, [config.key]: rows })}
            addLabel={config.addLabel}
          />
        ) : (
          <div className="flex gap-2 flex-wrap">
            {config.fields.map((f) => (
              <div key={f.key} className="flex-1 min-w-[9rem]">
                <input
                  type="text"
                  inputMode="decimal"
                  className="input text-xs py-1.5"
                  placeholder={f.label}
                  value={inputs[f.key] ?? ""}
                  onChange={setInputField(f.key)}
                />
              </div>
            ))}
          </div>
        )}
        {config.resultHint && <p className="text-[10px] opacity-35 mt-1">{config.resultHint}</p>}
      </div>

      <div
        className={`rounded-lg px-3 py-2 mb-3 flex items-center justify-between gap-2 ${result?.warn ? "bg-amber-50 border border-amber-200" : ""}`}
        style={result?.warn ? undefined : { background: "var(--color-bg)" }}
      >
        {result ? (
          <>
            <span className={`text-xs font-medium flex items-center gap-1 ${result.warn ? "text-amber-700" : "opacity-70"}`}>
              {result.warn && <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />}
              {result.label}
            </span>
            {formatted !== null && <span className={`text-sm font-black flex-shrink-0 ${result.warn ? "text-amber-700" : ""}`}>{formatted}</span>}
          </>
        ) : (
          <span className="text-xs opacity-35 italic">Not enough entered yet to compute a result</span>
        )}
      </div>

      <div>
        <label className="text-[11px] font-medium opacity-60 mb-1 block">Notes (optional)</label>
        <textarea className="input" rows={2} value={v.notes || ""} onChange={set("notes")} />
      </div>
    </div>
  );
}
