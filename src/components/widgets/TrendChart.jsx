"use client";

import { useState } from "react";
import { parseNumericValue } from "../../lib/aggregation";

export function formatAxisValue(v, unit) {
  const rounded = Math.round(parseNumericValue(v) * 100) / 100;
  return unit === "%" ? `${rounded}%` : unit ? `${rounded} ${unit}` : `${rounded}`;
}

export function formatAxisDate(d) {
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
// carries identity, and y-ticks are labeled with the series' own unit so
// the axis reads correctly regardless of what's plotted. A crosshair +
// tooltip on hover, per the dataviz interaction convention - every
// plotted point's exact date and value should be reachable, not just the
// axis min/max/first/last already shown as static labels.
//
// Shared between KPI tiles and Stat tiles - "history" is
// just {date, value}[], so it works equally well for a KPI's raw daily
// entries or a Stat's period-bucketed (day/week/month/season) series.
export function TrendChart({ history, color, chartType = "line", unit, emptyMessage, target }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const points = (history || []).slice(-12);
  const w = 100, h = 28;
  const stroke = color || "var(--color-accent)";
  const targetNum = parseNumericValue(target);
  const hasTarget = !isNaN(targetNum);

  if (points.length === 0) {
    return <p className="text-[10px] opacity-30 mt-1">{emptyMessage || "No values recorded yet - the trend fills in as this value changes."}</p>;
  }

  const values = points.map((p) => parseNumericValue(p.value)).filter((v) => !isNaN(v));
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  // A line's shape reads fine scaled to its own min-max range - that's
  // what makes small fluctuations visible instead of flattened out. A
  // bar's HEIGHT is read as a real magnitude, so without a zero baseline
  // the single highest bar fills the entire chart (looking like a solid
  // block) while the rest look nearly invisible, even when the real
  // values are close together - the classic bar-chart-without-a-baseline
  // trap. So bar mode always includes 0 in its axis range; line mode
  // doesn't.
  let min = chartType === "bar" ? Math.min(0, dataMin) : dataMin;
  let max = chartType === "bar" ? Math.max(0, dataMax) : dataMax;
  // The target reference line has to fall inside the plotted range or it
  // just wouldn't be visible - if every month came in well under (or
  // over) target, stretch the range to include it rather than clipping
  // the one value this whole chart exists to compare against.
  if (hasTarget) {
    min = Math.min(min, targetNum);
    max = Math.max(max, targetNum);
  }
  const range = max - min || 1;
  const singlePoint = points.length === 1;
  const barWidth = w / points.length;
  // Bar mode leaves headroom above the tallest bar for its value label
  // (plain HTML text overlaid on the SVG, not SVG <text> - the SVG uses
  // preserveAspectRatio="none" to stretch to any card width, which would
  // distort glyph shapes if text lived inside it too, same reason the
  // axis chrome below is HTML). Line mode has no labels, so it keeps
  // using the chart's full height.
  const plotTop = chartType === "bar" ? h * 0.26 : 0;
  const valueY = (v) => (isNaN(v) ? h / 2 : plotTop + (1 - (v - min) / range) * (h - plotTop));

  // Every point's SVG position, shared by the marks themselves, the hover
  // crosshair/marker, and the tooltip's readout.
  const positions = points.map((p, i) => {
    const v = parseNumericValue(p.value);
    if (singlePoint) return { x: w / 2, y: h / 2, date: p.date, value: v };
    const x = chartType === "bar" ? i * barWidth + barWidth / 2 : (i / (points.length - 1)) * w;
    return { x, y: valueY(v), date: p.date, value: v };
  });
  const targetY = hasTarget ? valueY(targetNum) : null;

  function handleMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = rect.width ? (e.clientX - rect.left) / rect.width : 0;
    const idx = chartType === "bar" && !singlePoint
      ? Math.floor(fraction * points.length)
      : Math.round(fraction * (points.length - 1));
    setHoverIndex(Math.min(points.length - 1, Math.max(0, idx)));
  }

  let marks;
  if (singlePoint) {
    // Only one data point so far - still render something graph-shaped
    // (a flat marker) instead of a blank "not enough history" message,
    // which reads like the display never actually switched to a graph.
    marks = (
      <>
        <line x1="0" y1={h / 2} x2={w} y2={h / 2} stroke={stroke} strokeWidth="1.5" strokeDasharray="3,3" opacity={0.4} vectorEffect="non-scaling-stroke" />
        <circle cx={w / 2} cy={h / 2} r="2.5" fill={stroke} />
      </>
    );
  } else if (chartType === "bar") {
    marks = positions.map((p, i) => {
      const barH = h - p.y;
      return (
        <rect
          key={i}
          x={i * barWidth + barWidth * 0.15}
          y={p.y}
          width={barWidth * 0.7}
          height={Math.max(barH, 1)}
          fill={stroke}
          opacity={hoverIndex === i ? 1 : 0.85}
        />
      );
    });
  } else {
    marks = <polyline points={positions.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke={stroke} strokeWidth="2" vectorEffect="non-scaling-stroke" />;
  }

  const first = points[0];
  const last = points[points.length - 1];
  const yGutter = "2.1rem";
  const hovered = hoverIndex !== null ? positions[hoverIndex] : null;
  const TARGET_RED = "#e94444";
  // Bar mode renders taller (not just the same viewBox stretched further)
  // so plotTop's headroom is real screen pixels a value label can actually
  // sit in, not a fraction of the same cramped 28px line-mode chart has.
  const svgHeightClass = chartType === "bar" ? "h-11" : "h-7";

  return (
    <div className="mt-1.5">
      <div className="flex items-stretch gap-1.5">
        <div className="relative text-right text-[9px] leading-none opacity-40" style={{ minWidth: yGutter, fontVariantNumeric: "tabular-nums" }}>
          <span className="absolute top-0 right-0">{formatAxisValue(max, unit)}</span>
          {!singlePoint && <span className="absolute bottom-0 right-0">{formatAxisValue(min, unit)}</span>}
          {/* The target's own tick lives in the gutter, not floating over
              the plot area - a bar's value label sits at whatever height
              that bar happens to reach, and a target near a tall bar's
              own value would otherwise land right on top of it. */}
          {hasTarget && (
            <span
              className="absolute right-0 font-bold whitespace-nowrap"
              style={{ top: `${(targetY / h) * 100}%`, transform: "translateY(-50%)", color: TARGET_RED, opacity: 1 }}
            >
              {formatAxisValue(targetNum, unit)}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0 relative">
          <svg
            viewBox={`0 0 ${w} ${h}`}
            className={`w-full ${svgHeightClass} block`}
            preserveAspectRatio="none"
            onMouseMove={handleMove}
            onMouseLeave={() => setHoverIndex(null)}
          >
            {marks}
            {hasTarget && (
              <line x1="0" y1={targetY} x2={w} y2={targetY} stroke={TARGET_RED} strokeWidth="1" strokeDasharray="2.5,2" vectorEffect="non-scaling-stroke" />
            )}
            {hovered && chartType !== "bar" && (
              <line x1={hovered.x} y1="0" x2={hovered.x} y2={h} stroke="currentColor" strokeWidth="1" opacity="0.15" vectorEffect="non-scaling-stroke" />
            )}
            {hovered && (
              <circle cx={hovered.x} cy={hovered.y} r="3" fill={stroke} stroke="var(--color-surface)" strokeWidth="1.5" />
            )}
          </svg>

          {/* Value-above-bar labels and the target line's own label are
              plain HTML overlays, positioned by percentage against the
              same w/h coordinate space the SVG uses - text inside the
              SVG itself would get squashed non-uniformly the moment the
              card is wider or narrower than 100:28, since the SVG stretches
              with preserveAspectRatio="none". */}
          {chartType === "bar" && !singlePoint && positions.map((p, i) => (
            <div
              key={i}
              className="absolute text-[8px] font-semibold whitespace-nowrap pointer-events-none"
              style={{
                left: `${(p.x / w) * 100}%`,
                top: `${(p.y / h) * 100}%`,
                transform: "translate(-50%, -100%) translateY(-2px)",
                color: stroke,
              }}
            >
              {formatAxisValue(p.value, unit)}
            </div>
          ))}

          {hovered && (
            <div
              className="absolute bottom-full mb-1 px-1.5 py-0.5 rounded text-[9px] font-medium whitespace-nowrap pointer-events-none border z-10"
              style={{
                left: `${(hovered.x / w) * 100}%`,
                transform: `translateX(${hovered.x < w * 0.15 ? "0%" : hovered.x > w * 0.85 ? "-100%" : "-50%"})`,
                background: "var(--color-surface)",
                borderColor: "var(--color-border)",
              }}
            >
              {formatAxisDate(hovered.date)} · <strong>{formatAxisValue(hovered.value, unit)}</strong>
            </div>
          )}
        </div>
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
