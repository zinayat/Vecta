"use client";

import Link from "next/link";
import { Target, X } from "lucide-react";
import { itemTypeLabel } from "../../lib/hoshinAutoLink";

const CONSOLIDATION_TYPES = ["sum", "count", "average", "min", "max"];

export const CATEGORY_COLORS = {
  Safety: "#dc2626",
  Quality: "#2563eb",
  Throughput: "#16a34a",
  People: "#9333ea",
  Cost: "#d97706",
};

function computeConsolidatedValue(config, allWidgets) {
  const { sourceWidgetIds = [], type = "sum" } = config.consolidation || {};
  const values = (allWidgets || [])
    .filter((w) => sourceWidgetIds.includes(w._id))
    .map((w) => Number(w.config?.value))
    .filter((v) => !isNaN(v));

  if (values.length === 0) return null;
  switch (type) {
    case "count": return values.length;
    case "average": return values.reduce((a, b) => a + b, 0) / values.length;
    case "min": return Math.min(...values);
    case "max": return Math.max(...values);
    case "sum":
    default: return values.reduce((a, b) => a + b, 0);
  }
}

function Sparkline({ history, color }) {
  const points = (history || []).slice(-12);
  if (points.length < 2) return <p className="text-[10px] opacity-30 mt-1">Not enough history yet</p>;

  const values = points.map((p) => Number(p.value)).filter((v) => !isNaN(v));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 100, h = 28;
  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - ((Number(p.value) - min) / range) * h;
    return `${x},${isNaN(y) ? h / 2 : y}`;
  });

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-7 mt-1.5" preserveAspectRatio="none">
      <polyline points={coords.join(" ")} fill="none" stroke={color || "var(--color-accent)"} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function KpiWidgetDisplay({ config, allWidgets }) {
  const c = config || {};
  const { label, target, unit, displayMode = "number", source = "manual", category } = c;
  const value = source === "consolidation" ? computeConsolidatedValue(c, allWidgets) : c.value;
  const color = category ? CATEGORY_COLORS[category] : null;

  const numValue = Number(value);
  const numTarget = Number(target);
  const onTrack = !isNaN(numValue) && !isNaN(numTarget) ? numValue >= numTarget : null;

  const displayValue = value === null || value === undefined || value === ""
    ? "—"
    : displayMode === "percent" ? `${value}%` : value;

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        {color && <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: color }} />}
        <p className="text-xs opacity-50">{label || "KPI"}</p>
        {source === "consolidation" && <span className="text-[9px] uppercase font-bold opacity-30">({c.consolidation?.type || "sum"})</span>}
      </div>

      {displayMode === "graph" ? (
        <>
          <p className="text-xl font-black">{displayValue}{unit && displayMode !== "percent" ? <span className="text-sm font-medium opacity-50 ml-1">{unit}</span> : null}</p>
          <Sparkline history={c.history} color={color} />
        </>
      ) : (
        <p className="text-2xl font-black">
          {displayValue}{unit && displayMode !== "percent" ? <span className="text-sm font-medium opacity-50 ml-1">{unit}</span> : null}
        </p>
      )}

      {target !== undefined && target !== "" && (
        <p className={`text-xs mt-1 ${onTrack === false ? "text-red-500" : "text-emerald-600"}`}>
          Target: {target}{displayMode === "percent" ? "%" : unit}
        </p>
      )}

      {c.hoshinLink && (
        <Link
          href={`/hoshin/${c.hoshinLink.planId}`}
          className="inline-flex items-center gap-1 text-[10px] opacity-40 hover:opacity-80 transition mt-2"
          title={c.hoshinLink.itemText}
        >
          <Target className="h-2.5 w-2.5" /> {itemTypeLabel(c.hoshinLink.itemType)} · {c.hoshinLink.planName}
        </Link>
      )}
    </div>
  );
}

export function KpiWidgetForm({ config, onChange, siblingWidgets }) {
  const c = config || {};
  function set(field) {
    return (e) => onChange({ ...c, [field]: e.target.value });
  }
  function toggleSourceWidget(id) {
    const current = c.consolidation?.sourceWidgetIds || [];
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    onChange({ ...c, consolidation: { ...(c.consolidation || { type: "sum" }), sourceWidgetIds: next } });
  }

  const eligibleSources = (siblingWidgets || []).filter((w) => w.type === "kpi");

  return (
    <div className="space-y-2">
      <input className="input" placeholder="Label (e.g. On-Time Delivery)" value={c.label || ""} onChange={set("label")} />

      {c.hoshinLink && (
        <div className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-[11px]" style={{ background: "var(--color-bg)" }}>
          <span className="opacity-60 truncate">Linked to {itemTypeLabel(c.hoshinLink.itemType)}: {c.hoshinLink.itemText}</span>
          <button type="button" onClick={() => onChange({ ...c, hoshinLink: null })} className="opacity-40 hover:text-red-500 transition flex-shrink-0">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <select className="input" value={c.category || ""} onChange={set("category")}>
          <option value="">No category</option>
          <option value="Safety">Safety</option>
          <option value="Quality">Quality</option>
          <option value="Throughput">Throughput</option>
          <option value="People">People</option>
          <option value="Cost">Cost</option>
        </select>
        <select className="input" value={c.displayMode || "number"} onChange={set("displayMode")}>
          <option value="number">Number</option>
          <option value="percent">Percent</option>
          <option value="graph">Graph (trend)</option>
        </select>
      </div>

      <select className="input" value={c.source || "manual"} onChange={set("source")}>
        <option value="manual">Manual value</option>
        <option value="consolidation">Consolidation of other KPI tiles</option>
      </select>

      {c.source === "consolidation" ? (
        <div className="rounded-lg border p-2 space-y-2" style={{ borderColor: "var(--color-border)" }}>
          <select
            className="input text-xs py-1"
            value={c.consolidation?.type || "sum"}
            onChange={(e) => onChange({ ...c, consolidation: { ...(c.consolidation || {}), type: e.target.value } })}
          >
            {CONSOLIDATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <p className="text-[10px] opacity-40">Which KPI tiles to combine:</p>
          <div className="max-h-24 overflow-y-auto space-y-1">
            {eligibleSources.length === 0 && <p className="text-[11px] opacity-35 italic">No other KPI tiles on this dashboard yet</p>}
            {eligibleSources.map((w) => (
              <label key={w._id} className="flex items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  checked={(c.consolidation?.sourceWidgetIds || []).includes(w._id)}
                  onChange={() => toggleSourceWidget(w._id)}
                />
                {w.title || w.config?.label || "Untitled KPI"}
              </label>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <input className="input" placeholder="Value" value={c.value || ""} onChange={set("value")} />
          <input className="input" placeholder="Target" value={c.target || ""} onChange={set("target")} />
          {c.displayMode !== "percent" && <input className="input" placeholder="Unit" value={c.unit || ""} onChange={set("unit")} />}
        </div>
      )}
    </div>
  );
}
