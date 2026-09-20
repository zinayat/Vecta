"use client";

import { useState } from "react";
import Link from "next/link";
import { Target, X } from "lucide-react";
import { itemTypeLabel } from "../../lib/hoshinAutoLink";
import { isOnTrack } from "../../lib/kpiBuilder";
import KpiBuilder from "../kpi/KpiBuilder";
import LinkedSourcePicker from "../kpi/LinkedSourcePicker";
import { useLinkedValue, useApiValue } from "../kpi/kpiDataSources";

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

function formatAxisValue(v, unit) {
  const rounded = Math.round(Number(v) * 100) / 100;
  return unit === "%" ? `${rounded}%` : unit ? `${rounded} ${unit}` : `${rounded}`;
}

function formatAxisDate(d) {
  if (!d) return "";
  const dt = new Date(`${d}T00:00:00`);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// Axis chrome (tick values + axis names) is plain HTML around the SVG, not
// SVG text inside it - the marks SVG below uses preserveAspectRatio="none"
// so it stretches to fill any card width, which would distort glyph shapes
// if text lived inside it too. Values/labels stay in muted text tokens per
// dataviz convention (never the series color) so the colored mark alone
// carries identity, and y-ticks are labeled with the KPI's own unit so the
// axis reads correctly regardless of what's plotted.
function TrendChart({ history, color, chartType = "line", unit }) {
  const points = (history || []).slice(-12);
  const w = 100, h = 28;
  const stroke = color || "var(--color-accent)";

  if (points.length === 0) {
    return <p className="text-[10px] opacity-30 mt-1">No values recorded yet - the trend fills in as this KPI's value changes.</p>;
  }

  const values = points.map((p) => Number(p.value)).filter((v) => !isNaN(v));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const singlePoint = points.length === 1;

  let marks;
  if (singlePoint) {
    // Only one data point so far - still render something graph-shaped
    // (a flat marker) instead of a blank "not enough history" message,
    // which reads like the display never actually switched to a graph.
    marks = (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-7" preserveAspectRatio="none">
        <line x1="0" y1={h / 2} x2={w} y2={h / 2} stroke={stroke} strokeWidth="1.5" strokeDasharray="3,3" opacity={0.4} vectorEffect="non-scaling-stroke" />
        <circle cx={w / 2} cy={h / 2} r="2.5" fill={stroke} />
      </svg>
    );
  } else if (chartType === "bar") {
    const barWidth = w / points.length;
    marks = (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-7" preserveAspectRatio="none">
        {points.map((p, i) => {
          const v = Number(p.value);
          const barH = isNaN(v) ? 0 : ((v - min) / range) * h;
          return (
            <rect
              key={i}
              x={i * barWidth + barWidth * 0.15}
              y={h - barH}
              width={barWidth * 0.7}
              height={Math.max(barH, 1)}
              fill={stroke}
              opacity={0.85}
            />
          );
        })}
      </svg>
    );
  } else {
    const coords = points.map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((Number(p.value) - min) / range) * h;
      return `${x},${isNaN(y) ? h / 2 : y}`;
    });
    marks = (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-7" preserveAspectRatio="none">
        <polyline points={coords.join(" ")} fill="none" stroke={stroke} strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
    );
  }

  const first = points[0];
  const last = points[points.length - 1];
  const yGutter = "2.1rem";

  return (
    <div className="mt-1.5">
      <div className="flex items-stretch gap-1.5">
        <div className="flex flex-col justify-between text-right text-[9px] leading-none opacity-40" style={{ minWidth: yGutter, fontVariantNumeric: "tabular-nums" }}>
          <span>{formatAxisValue(max, unit)}</span>
          {!singlePoint && <span>{formatAxisValue(min, unit)}</span>}
        </div>
        <div className="flex-1 min-w-0">{marks}</div>
      </div>
      <div className="flex items-center justify-between text-[9px] opacity-40" style={{ paddingLeft: yGutter, fontVariantNumeric: "tabular-nums" }}>
        <span>{formatAxisDate(first.date)}</span>
        {!singlePoint && <span>{formatAxisDate(last.date)}</span>}
      </div>
      <div className="flex items-center justify-between text-[9px] opacity-25 mt-0.5" style={{ paddingLeft: yGutter }}>
        <span>Date</span>
        <span>{unit ? `Value (${unit})` : "Value"}</span>
      </div>
    </div>
  );
}

export function KpiWidgetDisplay({ config, allWidgets }) {
  const c = config || {};
  const { label, target, unit, displayMode = "number", source = "manual", category, direction = "higherIsBetter" } = c;

  // Hooks run unconditionally (rules of hooks) - only the relevant one's
  // result actually gets used, based on source.
  const linkedValue = useLinkedValue(source === "linked" ? c.linkedRef : null);
  const apiState = useApiValue(source === "api" ? c.apiConfig : null);

  const value = source === "consolidation" ? computeConsolidatedValue(c, allWidgets)
    : source === "linked" ? linkedValue
    : source === "api" ? apiState.value
    : c.value;

  const color = category ? CATEGORY_COLORS[category] : null;

  const onTrack = isOnTrack(value, target, direction);

  const displayValue = value === null || value === undefined || value === ""
    ? (source === "api" && apiState.loading ? "…" : "—")
    : displayMode === "percent" ? `${value}%` : value;

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        {color && <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: color }} />}
        <p className="text-xs opacity-50">{label || "KPI"}</p>
        {source === "consolidation" && <span className="text-[9px] uppercase font-bold opacity-30">({c.consolidation?.type || "sum"})</span>}
        {source === "linked" && <span className="text-[9px] uppercase font-bold opacity-30">(linked)</span>}
        {source === "api" && <span className="text-[9px] uppercase font-bold opacity-30">(api)</span>}
      </div>

      {source === "api" && apiState.error && <p className="text-[10px] text-red-500 mb-1">{apiState.error}</p>}

      {displayMode === "graph" ? (
        <>
          <p className="text-xl font-black">{displayValue}{unit && displayMode !== "percent" ? <span className="text-sm font-medium opacity-50 ml-1">{unit}</span> : null}</p>
          <TrendChart history={c.history} color={color} chartType={c.chartType} unit={c.measurementType === "Percentage" ? "%" : unit} />
        </>
      ) : (
        <p className="text-2xl font-black">
          {displayValue}{unit && displayMode !== "percent" ? <span className="text-sm font-medium opacity-50 ml-1">{unit}</span> : null}
        </p>
      )}

      {target !== undefined && target !== "" && (
        <p className={`text-xs mt-1 ${onTrack === false ? "text-red-500" : "text-emerald-600"}`}>
          Target: {target}{displayMode === "percent" ? "%" : unit} <span className="opacity-40">({direction === "lowerIsBetter" ? "lower is better" : "higher is better"})</span>
        </p>
      )}

      {c.whatSuccessLooksLike && (
        <p className="text-[11px] opacity-40 mt-1.5 leading-snug">{c.whatSuccessLooksLike}</p>
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

function sortByDate(history) {
  return [...(history || [])].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

// Manual entry, one value per date, rather than a single "current value"
// field - lets a KPI's actual trend be entered directly (e.g. backfilling
// last week's numbers) instead of only ever recording "now." The most
// recent date's value becomes the KPI's current value automatically.
function ManualValueHistory({ config, onChange }) {
  const c = config || {};
  const sorted = sortByDate(c.history);

  function commit(nextEntries) {
    const cleaned = sortByDate(nextEntries.filter((h) => h.date)).slice(-30);
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
        {sorted.map((h, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <input type="date" className="input text-xs py-1" value={h.date || ""} onChange={(e) => updateEntry(i, "date", e.target.value)} />
            <input className="input text-xs py-1" placeholder="Value" value={h.value ?? ""} onChange={(e) => updateEntry(i, "value", e.target.value)} />
            <button type="button" onClick={() => removeEntry(i)} className="p-1 opacity-40 hover:text-red-500 flex-shrink-0"><X className="h-3 w-3" /></button>
          </div>
        ))}
      </div>
      <button type="button" onClick={addEntry} className="text-[11px] font-semibold" style={{ color: "var(--color-accent)" }}>+ Add a date</button>
      <p className="text-[10px] opacity-35">The most recent date's value is used as the KPI's current value.</p>
    </div>
  );
}

function KpiSettingsTab({ config, onChange, siblingWidgets, widgetId }) {
  const c = config || {};
  function set(field) {
    return (e) => onChange({ ...c, [field]: e.target.value });
  }
  function toggleSourceWidget(id) {
    const current = c.consolidation?.sourceWidgetIds || [];
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    onChange({ ...c, consolidation: { ...(c.consolidation || { type: "sum" }), sourceWidgetIds: next } });
  }

  const eligibleSources = (siblingWidgets || []).filter((w) => w.type === "kpi" && w._id !== widgetId);
  const onTrack = isOnTrack(c.value, c.target, c.direction);

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[11px] font-medium opacity-60 mb-1 block">Category</label>
        <select className="input" value={c.category || ""} onChange={set("category")}>
          <option value="">No category</option>
          <option value="Safety">Safety</option>
          <option value="Quality">Quality</option>
          <option value="Throughput">Throughput</option>
          <option value="People">People</option>
          <option value="Cost">Cost</option>
        </select>
      </div>

      <div>
        <label className="text-[11px] font-medium opacity-60 mb-1 block">Display</label>
        <div className="flex gap-2">
          <select className="input" value={c.displayMode || "number"} onChange={set("displayMode")}>
            <option value="number">Single value</option>
            <option value="percent">Percent</option>
            <option value="graph">Graph (trend)</option>
          </select>
          {c.displayMode === "graph" && (
            <select className="input" value={c.chartType || "line"} onChange={set("chartType")}>
              <option value="line">Line</option>
              <option value="bar">Bar</option>
            </select>
          )}
        </div>
      </div>

      <div>
        <label className="text-[11px] font-medium opacity-60 mb-1 block">Target (for gap vs. actual)</label>
        <div className="flex gap-2">
          <input className="input" placeholder="Target" value={c.target || ""} onChange={set("target")} />
          <input className="input" placeholder="Unit" value={c.unit || ""} onChange={set("unit")} disabled={c.measurementType === "Percentage"} />
        </div>
        {c.target && (
          <p className={`text-[11px] mt-1 font-medium ${onTrack === false ? "text-red-500" : onTrack === true ? "text-emerald-600" : "opacity-40"}`}>
            {onTrack === null ? "Enter a current value to see the gap" : onTrack ? "On track" : "Off track"}
            {onTrack !== null && c.value !== undefined && c.value !== "" && (
              <span className="opacity-60"> - actual {c.value}, target {c.target}{c.measurementType === "Percentage" ? "%" : c.unit ? ` ${c.unit}` : ""}</span>
            )}
          </p>
        )}
      </div>

      <div>
        <label className="text-[11px] font-medium opacity-60 mb-1 block">Where does the data come from?</label>
        <select className="input mb-2" value={c.source || "manual"} onChange={set("source")}>
          <option value="manual">Manual entry</option>
          <option value="linked">Linked to another KPI or item</option>
          <option value="api">API connected</option>
          <option value="consolidation">Consolidation of other KPI tiles</option>
        </select>

        {c.source === "consolidation" && (
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
        )}

        {c.source === "linked" && (
          <LinkedSourcePicker value={c.linkedRef} onChange={(ref) => onChange({ ...c, linkedRef: ref })} currentWidgetId={widgetId} />
        )}

        {c.source === "api" && (
          <div className="rounded-lg border p-2 space-y-2" style={{ borderColor: "var(--color-border)" }}>
            <input
              className="input text-xs py-1.5"
              placeholder="https://api.example.com/metrics"
              value={c.apiConfig?.url || ""}
              onChange={(e) => onChange({ ...c, apiConfig: { ...(c.apiConfig || {}), url: e.target.value } })}
            />
            <input
              className="input text-xs py-1.5"
              placeholder="JSON path to the value (e.g. data.value) - optional"
              value={c.apiConfig?.jsonPath || ""}
              onChange={(e) => onChange({ ...c, apiConfig: { ...(c.apiConfig || {}), jsonPath: e.target.value } })}
            />
            <p className="text-[10px] opacity-35">Fetched server-side, expects a JSON response. Only point this at URLs you trust.</p>
          </div>
        )}

        {(c.source === "manual" || !c.source) && (
          <ManualValueHistory config={c} onChange={onChange} />
        )}
      </div>
    </div>
  );
}

export function KpiWidgetForm({ config, onChange, siblingWidgets, widgetId }) {
  const c = config || {};
  const [tab, setTab] = useState("definition");

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1 border-b" style={{ borderColor: "var(--color-border)" }}>
        {["definition", "settings"].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className="px-2.5 py-1.5 text-xs font-semibold capitalize border-b-2 transition"
            style={{ borderColor: tab === t ? "var(--color-accent)" : "transparent", color: tab === t ? "var(--color-accent)" : "inherit", opacity: tab === t ? 1 : 0.5 }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "definition" ? (
        <>
          <KpiBuilder value={c} onChange={onChange} />
          {c.hoshinLink && (
            <div className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-[11px]" style={{ background: "var(--color-bg)" }}>
              <span className="opacity-60 truncate">Linked to {itemTypeLabel(c.hoshinLink.itemType)}: {c.hoshinLink.itemText}</span>
              <button type="button" onClick={() => onChange({ ...c, hoshinLink: null })} className="opacity-40 hover:text-red-500 transition flex-shrink-0">
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </>
      ) : (
        <KpiSettingsTab config={c} onChange={onChange} siblingWidgets={siblingWidgets} widgetId={widgetId} />
      )}
    </div>
  );
}
