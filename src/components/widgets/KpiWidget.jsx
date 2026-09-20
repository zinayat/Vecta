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

function TrendChart({ history, color, chartType = "line" }) {
  const points = (history || []).slice(-12);
  if (points.length < 2) return <p className="text-[10px] opacity-30 mt-1">Not enough history yet</p>;

  const values = points.map((p) => Number(p.value)).filter((v) => !isNaN(v));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 100, h = 28;
  const stroke = color || "var(--color-accent)";

  if (chartType === "bar") {
    const barWidth = w / points.length;
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-7 mt-1.5" preserveAspectRatio="none">
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
  }

  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - ((Number(p.value) - min) / range) * h;
    return `${x},${isNaN(y) ? h / 2 : y}`;
  });

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-7 mt-1.5" preserveAspectRatio="none">
      <polyline points={coords.join(" ")} fill="none" stroke={stroke} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
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
          <TrendChart history={c.history} color={color} chartType={c.chartType} />
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
          <input className="input" placeholder="Current value" value={c.value || ""} onChange={set("value")} />
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
