"use client";

import { X } from "lucide-react";
import { parseNumericValue, MAX_HISTORY_ENTRIES } from "../../lib/aggregation";

function sortByDate(history) {
  return [...(history || [])].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

// Manual entry, one value per date, rather than a single "current value"
// field - lets a tile's actual trend be entered directly (e.g. backfilling
// last week's numbers) instead of only ever recording "now." The most
// recent date's value becomes the tile's current value automatically.
// Shared between KPI tiles and Stat tiles.
export default function ManualValueHistory({ config, onChange }) {
  const c = config || {};
  const sorted = sortByDate(c.history);

  function commit(nextEntries) {
    const cleaned = sortByDate(nextEntries.filter((h) => h.date)).slice(-MAX_HISTORY_ENTRIES);
    const latest = cleaned[cleaned.length - 1];
    onChange({ ...c, history: cleaned, value: latest ? latest.value : "" });
  }

  function updateEntry(index, field, val) {
    commit(sorted.map((h, i) => (i === index ? { ...h, [field]: val } : h)));
  }

  function removeEntry(index) {
    commit(sorted.filter((_, i) => i !== index));
  }

  function addEntry() {
    commit([...sorted, { date: new Date().toISOString().slice(0, 10), value: "" }]);
  }

  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-medium opacity-60 block">Values by date</label>
      {sorted.length === 0 && <p className="text-[11px] opacity-35 italic">No values entered yet</p>}
      <div className="max-h-40 overflow-y-auto space-y-1">
        {sorted.map((h, i) => {
          // A value that won't parse as a number (a stray unit typed
          // inline, like "1842 kg" - units belong in the tile's own Unit
          // field) would otherwise just silently vanish from the tile
          // with no explanation, so flag it right where it's typed.
          const notNumeric = h.value !== "" && h.value !== undefined && h.value !== null && isNaN(parseNumericValue(h.value));
          return (
            <div key={i}>
              <div className="flex items-center gap-1.5">
                <input type="date" className="input text-xs py-1 flex-1 min-w-0" value={h.date || ""} onChange={(e) => updateEntry(i, "date", e.target.value)} />
                <input
                  className={`input text-xs py-1 flex-1 min-w-0 ${notNumeric ? "border-red-400" : ""}`}
                  placeholder="Value"
                  value={h.value ?? ""}
                  onChange={(e) => updateEntry(i, "value", e.target.value)}
                />
                <button type="button" onClick={() => removeEntry(i)} className="p-1 opacity-40 hover:text-red-500 flex-shrink-0"><X className="h-3 w-3" /></button>
              </div>
              {notNumeric && <p className="text-[10px] text-red-500 mt-0.5">Not a number - this date won't show on the tile until it's just digits (put units in the Unit field above).</p>}
            </div>
          );
        })}
      </div>
      <button type="button" onClick={addEntry} className="text-[11px] font-semibold" style={{ color: "var(--color-accent)" }}>+ Add a date</button>
      <p className="text-[10px] opacity-35">The most recent date's value is used as the tile's current value.</p>
    </div>
  );
}
