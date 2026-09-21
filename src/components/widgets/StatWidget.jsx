"use client";

import { CATEGORY_COLORS } from "./KpiWidget";
import { TrendChart, formatAxisDate } from "./TrendChart";
import ManualValueHistory from "./ManualValueHistory";
import { mergeHistoriesByDate, bucketHistory, AGGREGATE_TYPES, AGGREGATE_LABELS } from "../../lib/aggregation";

// A Stat is deliberately not a KPI - no target/gap, no success-measure
// language, no linked/API sourcing. What it does share with KPI tiles:
// a category tag, and consolidation - combining several Stat tiles'
// date histories (per matching date, via `aggregateType`) rather than
// just reading one static number.
//
// Independent of where the numbers come from (this tile's own manual
// entries, or a cross-tile consolidation), the *time period* the tile
// looks at is its own choice: a specific date (the latest entry, as
// before), or a period-bucketed view - weekly, monthly, or the whole
// season (everything recorded so far, collapsed into one total) - and
// either of those can be shown as a single number (the latest period's
// total) or a graph (a point per period). `lib/aggregation.js`'s
// bucketHistory() does the day/week/month/season grouping; the same
// aggregateType drives both the cross-tile combination and the
// within-period combination, since they're the same question asked
// twice ("how do multiple values become one").
const PERIOD_LABELS = { date: "day", week: "week", month: "month", season: "the season" };

function computeSeries(config, allWidgets) {
  const c = config || {};
  const aggregateType = c.aggregateType || "sum";
  const rawHistory = c.source === "consolidation"
    ? mergeHistoriesByDate(
        (allWidgets || [])
          .filter((w) => (c.consolidation?.sourceWidgetIds || []).includes(w._id))
          .map((w) => w.config?.history || []),
        aggregateType
      )
    : c.history || [];
  return bucketHistory(rawHistory, c.period || "date", aggregateType);
}

function roundValue(v) {
  return Math.round(Number(v) * 100) / 100;
}

export function StatWidgetDisplay({ config, allWidgets }) {
  const c = config || {};
  const { unit, category, source = "manual", displayMode = "number", period = "date", chartType = "line" } = c;
  const aggregateType = c.aggregateType || "sum";
  const color = category ? CATEGORY_COLORS[category] : null;

  const series = computeSeries(c, allWidgets);
  const latest = series[series.length - 1];
  const value = latest ? latest.value : null;
  const displayValue = value === null || value === undefined ? "—" : roundValue(value);

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        {color && <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: color }} />}
        <p className="text-xs opacity-50 break-words min-w-0">{c.label || "Stat"}</p>
        {source === "consolidation" && <span className="text-[9px] uppercase font-bold opacity-30 flex-shrink-0">({AGGREGATE_LABELS[aggregateType]})</span>}
      </div>

      {displayMode === "graph" ? (
        <>
          <p className="text-xl font-black break-words">
            {displayValue}{unit && <span className="text-sm font-medium opacity-50 ml-1">{unit}</span>}
          </p>
          <TrendChart
            history={series}
            color={color}
            chartType={chartType}
            unit={unit}
            emptyMessage="No values recorded yet - the trend fills in as dates are added."
          />
        </>
      ) : (
        <p className="text-3xl font-black break-words">
          {displayValue}{unit && <span className="text-sm font-medium opacity-50 ml-1.5">{unit}</span>}
        </p>
      )}

      {c.caption && <p className="text-[11px] opacity-40 mt-1.5 break-words">{c.caption}</p>}
      {period === "date" && latest?.date && (
        <p className="text-[10px] opacity-30 mt-0.5">As of {formatAxisDate(latest.date)}</p>
      )}
      {period !== "date" && (
        <p className="text-[10px] opacity-30 mt-0.5 break-words">{AGGREGATE_LABELS[aggregateType]} per {PERIOD_LABELS[period]}{period !== "season" && " - latest shown"}</p>
      )}
    </div>
  );
}

export function StatWidgetForm({ config, onChange, siblingWidgets, widgetId }) {
  const c = config || {};
  function set(field) {
    return (e) => onChange({ ...c, [field]: e.target.value });
  }
  function toggleSourceWidget(id) {
    const current = c.consolidation?.sourceWidgetIds || [];
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    onChange({ ...c, consolidation: { ...(c.consolidation || {}), sourceWidgetIds: next } });
  }
  // A graph needs width to be readable (axis labels, tooltip, points) far
  // more than it needs height, so switching into graph mode widens the
  // tile (to at least 2 columns) instead of letting it grow tall and
  // cramped in a 1-column card. Only grows, never auto-shrinks.
  function handleDisplayModeChange(e) {
    const nextMode = e.target.value;
    const nextSize = nextMode === "graph" ? Math.max(c.size || 1, 2) : c.size;
    onChange({ ...c, displayMode: nextMode, size: nextSize });
  }

  const eligibleSources = (siblingWidgets || []).filter((w) => w.type === "stat" && w._id !== widgetId);
  const period = c.period || "date";
  const needsAggregatePicker = c.source === "consolidation" || period !== "date";

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[11px] font-medium opacity-60 mb-1 block">Label</label>
        <input className="input" placeholder="e.g. Daily Throughput, Bags Packed, Trucks Unloaded" value={c.label || ""} onChange={set("label")} />
      </div>

      <div>
        <label className="text-[11px] font-medium opacity-60 mb-1 block">Category</label>
        <select className="input" value={c.category || ""} onChange={set("category")}>
          <option value="">No category</option>
          <option value="Safety">Safety</option>
          <option value="Quality">Quality</option>
          <option value="Cost">Cost</option>
          <option value="Throughput">Delivery/Throughput</option>
          <option value="People">People</option>
        </select>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 min-w-0">
          <label className="text-[11px] font-medium opacity-60 mb-1 block">Unit (optional)</label>
          <input className="input flex-1 min-w-0" placeholder="e.g. bags, trucks" value={c.unit || ""} onChange={set("unit")} />
        </div>
        <div className="flex-1 min-w-0">
          <label className="text-[11px] font-medium opacity-60 mb-1 block">Caption (optional)</label>
          <input className="input flex-1 min-w-0" placeholder="e.g. Shift 1 only" value={c.caption || ""} onChange={set("caption")} />
        </div>
      </div>

      <div>
        <label className="text-[11px] font-medium opacity-60 mb-1 block">Where does the data come from?</label>
        <select className="input mb-2" value={c.source || "manual"} onChange={set("source")}>
          <option value="manual">Manual entry</option>
          <option value="consolidation">Consolidation of other Stat tiles</option>
        </select>

        {c.source === "consolidation" ? (
          <div className="rounded-lg border p-2 space-y-2" style={{ borderColor: "var(--color-border)" }}>
            <p className="text-[10px] opacity-40">Which Stat tiles to combine, matched up by date:</p>
            <div className="max-h-24 overflow-y-auto space-y-1">
              {eligibleSources.length === 0 && <p className="text-[11px] opacity-35 italic">No other Stat tiles on this dashboard yet</p>}
              {eligibleSources.map((w) => (
                <label key={w._id} className="flex items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    checked={(c.consolidation?.sourceWidgetIds || []).includes(w._id)}
                    onChange={() => toggleSourceWidget(w._id)}
                  />
                  {w.title || w.config?.label || "Untitled Stat"}
                </label>
              ))}
            </div>
          </div>
        ) : (
          <ManualValueHistory config={c} onChange={onChange} />
        )}
      </div>

      <div>
        <label className="text-[11px] font-medium opacity-60 mb-1 block">Time period</label>
        <select className="input" value={period} onChange={set("period")}>
          <option value="date">A specific date</option>
          <option value="week">Weekly consolidation</option>
          <option value="month">Monthly consolidation</option>
          <option value="season">Whole season (everything so far)</option>
        </select>
      </div>

      {needsAggregatePicker && (
        <div>
          <label className="text-[11px] font-medium opacity-60 mb-1 block">Combine values by</label>
          <select className="input" value={c.aggregateType || "sum"} onChange={set("aggregateType")}>
            {AGGREGATE_TYPES.map((t) => <option key={t} value={t}>{AGGREGATE_LABELS[t]}</option>)}
          </select>
          <p className="text-[10px] opacity-40 mt-1">
            {c.source === "consolidation" && period !== "date"
              ? "Used both to combine the selected tiles' values on a given date, and to combine days into each period."
              : c.source === "consolidation"
              ? "How the selected tiles' values are combined for each date."
              : "How multiple days are combined into each period."}
          </p>
        </div>
      )}

      <div>
        <label className="text-[11px] font-medium opacity-60 mb-1 block">Show as</label>
        <div className="flex gap-2">
          <select className="input flex-1 min-w-0" value={c.displayMode || "number"} onChange={handleDisplayModeChange}>
            <option value="number">Single number</option>
            <option value="graph">Graph</option>
          </select>
          {c.displayMode === "graph" && (
            <select className="input flex-1 min-w-0" value={c.chartType || "line"} onChange={set("chartType")}>
              <option value="line">Line</option>
              <option value="bar">Bar</option>
            </select>
          )}
        </div>
      </div>
    </div>
  );
}
