"use client";

// Engineered vs. observed capacity, side by side - reused for both a step
// and its equipment, since both need the same "designed for X" vs
// "actually running at Y" pair to compare against each other.
export default function CapacityFields({ engineered, observed, onChangeEngineered, onChangeObserved }) {
  const eng = engineered || {};
  const obs = observed || {};

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <div className="rounded-lg border p-2" style={{ borderColor: "var(--color-border)" }}>
        <p className="text-[10px] font-semibold uppercase tracking-wide opacity-40 mb-1">Engineered capacity</p>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            className="input text-xs py-1 flex-1 min-w-0"
            placeholder="Value"
            value={eng.value ?? ""}
            onChange={(e) => onChangeEngineered({ ...eng, value: e.target.value === "" ? null : Number(e.target.value) })}
          />
          <input
            type="text"
            className="input text-xs py-1 flex-1 min-w-0"
            placeholder="Unit (e.g. units/hr)"
            value={eng.unit || ""}
            onChange={(e) => onChangeEngineered({ ...eng, unit: e.target.value })}
          />
        </div>
      </div>

      <div className="rounded-lg border p-2" style={{ borderColor: "var(--color-border)" }}>
        <p className="text-[10px] font-semibold uppercase tracking-wide opacity-40 mb-1">Actual observed capacity</p>
        <div className="flex items-center gap-1.5 mb-1.5">
          <input
            type="number"
            className="input text-xs py-1 flex-1 min-w-0"
            placeholder="Value"
            value={obs.value ?? ""}
            onChange={(e) => onChangeObserved({ ...obs, value: e.target.value === "" ? null : Number(e.target.value) })}
          />
          <input
            type="text"
            className="input text-xs py-1 flex-1 min-w-0"
            placeholder="Unit"
            value={obs.unit || ""}
            onChange={(e) => onChangeObserved({ ...obs, unit: e.target.value })}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            className="input text-xs py-1 flex-1 min-w-0"
            value={obs.measuredAt || ""}
            onChange={(e) => onChangeObserved({ ...obs, measuredAt: e.target.value })}
          />
          <input
            type="text"
            className="input text-xs py-1 flex-1 min-w-0"
            placeholder="Notes"
            value={obs.notes || ""}
            onChange={(e) => onChangeObserved({ ...obs, notes: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

// Compares observed to engineered capacity to color-code a badge - green
// at/above the engineered rate, amber below it, gray when either side is
// missing so an incomplete entry never gets colored as if it were "off
// track." Units aren't cross-converted - it's a straight value comparison,
// which only means something when both sides were entered in the same
// unit (the whole point of the paired value+unit inputs above).
export function capacityStatus(engineered, observed) {
  const e = engineered?.value;
  const o = observed?.value;
  if (e === null || e === undefined || o === null || o === undefined) return "unknown";
  return o >= e ? "onTarget" : "belowTarget";
}

export const CAPACITY_STATUS_COLORS = {
  onTarget: "#16a34a",
  belowTarget: "#dc2626",
  unknown: "#94a3b8",
};
