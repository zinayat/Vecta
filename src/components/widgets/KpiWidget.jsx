"use client";

export function KpiWidgetDisplay({ config }) {
  const { label, value, target, unit } = config || {};
  const numValue = Number(value);
  const numTarget = Number(target);
  const onTrack = !isNaN(numValue) && !isNaN(numTarget) ? numValue >= numTarget : null;

  return (
    <div>
      <p className="text-xs opacity-50 mb-1">{label || "KPI"}</p>
      <p className="text-2xl font-black">
        {value || "—"}{unit ? <span className="text-sm font-medium opacity-50 ml-1">{unit}</span> : null}
      </p>
      {target !== undefined && target !== "" && (
        <p className={`text-xs mt-1 ${onTrack === false ? "text-red-500" : "text-emerald-600"}`}>
          Target: {target}{unit}
        </p>
      )}
    </div>
  );
}

export function KpiWidgetForm({ config, onChange }) {
  const c = config || {};
  function set(field) {
    return (e) => onChange({ ...c, [field]: e.target.value });
  }
  return (
    <div className="space-y-2">
      <input className="input" placeholder="Label (e.g. On-Time Delivery)" value={c.label || ""} onChange={set("label")} />
      <div className="flex gap-2">
        <input className="input" placeholder="Value" value={c.value || ""} onChange={set("value")} />
        <input className="input" placeholder="Target" value={c.target || ""} onChange={set("target")} />
        <input className="input" placeholder="Unit (%)" value={c.unit || ""} onChange={set("unit")} />
      </div>
    </div>
  );
}
