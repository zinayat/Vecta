"use client";

// A Stat is deliberately not a KPI - no target/gap, no category, no
// consolidation/linked/API sourcing, no history tracking. Just a label,
// a number, and an optional unit + caption, for things that are a real
// count rather than a performance measure: daily throughput, bags
// packed, trucks unloaded today. If it later needs a target or a trend,
// that's what a KPI tile is for.
export function StatWidgetDisplay({ config }) {
  const c = config || {};
  return (
    <div>
      <p className="text-xs opacity-50 mb-1">{c.label || "Stat"}</p>
      <p className="text-3xl font-black">
        {c.value === undefined || c.value === "" ? "—" : c.value}
        {c.unit && <span className="text-sm font-medium opacity-50 ml-1.5">{c.unit}</span>}
      </p>
      {c.caption && <p className="text-[11px] opacity-40 mt-1.5">{c.caption}</p>}
    </div>
  );
}

export function StatWidgetForm({ config, onChange }) {
  const c = config || {};
  function set(field) {
    return (e) => onChange({ ...c, [field]: e.target.value });
  }

  return (
    <div className="space-y-2">
      <div>
        <label className="text-[11px] font-medium opacity-60 mb-1 block">Label</label>
        <input className="input" placeholder="e.g. Daily Throughput, Bags Packed, Trucks Unloaded Today" value={c.label || ""} onChange={set("label")} />
      </div>
      <div className="flex gap-2">
        <div className="flex-1 min-w-0">
          <label className="text-[11px] font-medium opacity-60 mb-1 block">Value</label>
          <input className="input flex-1 min-w-0" placeholder="0" value={c.value ?? ""} onChange={set("value")} />
        </div>
        <div className="flex-1 min-w-0">
          <label className="text-[11px] font-medium opacity-60 mb-1 block">Unit (optional)</label>
          <input className="input flex-1 min-w-0" placeholder="e.g. bags, trucks, units" value={c.unit || ""} onChange={set("unit")} />
        </div>
      </div>
      <div>
        <label className="text-[11px] font-medium opacity-60 mb-1 block">Caption (optional)</label>
        <input className="input" placeholder="e.g. As of today, Shift 1 only" value={c.caption || ""} onChange={set("caption")} />
      </div>
    </div>
  );
}
