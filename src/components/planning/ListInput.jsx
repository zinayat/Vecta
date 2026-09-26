"use client";

import { X, Plus } from "lucide-react";

// A generic add/remove row list, columns defined by the caller - shared
// by every phase+route combination that collects multiple entries
// (sales history, pipeline deals, signed contracts, won jobs) instead of
// building four near-identical list components.
export default function ListInput({ columns, rows, onChange, addLabel }) {
  const items = rows || [];

  function updateRow(i, key, val) {
    onChange(items.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)));
  }
  function removeRow(i) {
    onChange(items.filter((_, idx) => idx !== i));
  }
  function addRow() {
    onChange([...items, {}]);
  }

  return (
    <div className="space-y-1.5">
      {items.length === 0 && <p className="text-[11px] opacity-35 italic">No entries yet</p>}
      {items.map((row, i) => (
        <div key={i} className="flex items-center gap-1.5">
          {columns.map((col) => (
            <input
              key={col.key}
              type={col.inputType || (col.numeric ? "text" : "text")}
              inputMode={col.numeric ? "decimal" : undefined}
              className="input text-xs py-1 flex-1 min-w-0"
              placeholder={col.label}
              value={row[col.key] ?? ""}
              onChange={(e) => updateRow(i, col.key, e.target.value)}
            />
          ))}
          <button type="button" onClick={() => removeRow(i)} className="p-1 opacity-40 hover:text-red-500 flex-shrink-0"><X className="h-3 w-3" /></button>
        </div>
      ))}
      <button type="button" onClick={addRow} className="inline-flex items-center gap-0.5 text-[11px] font-semibold" style={{ color: "var(--color-accent)" }}>
        <Plus className="h-3 w-3" /> Add {addLabel || "a row"}
      </button>
    </div>
  );
}
