"use client";

import { useId } from "react";
import { parseNumericValue } from "../../lib/aggregation";
import { kpiStatusColor } from "../../lib/kpiBuilder";
import { formatAxisValue } from "./TrendChart";

// A gauge sweeps a bit past a flat semicircle (dips below the horizontal
// at both ends, like a speedometer) rather than stopping exactly at 180 -
// that extra reach is what makes the min/max tick labels sit below the
// pivot instead of pinned to it.
const SWEEP_DEG = 210;
const START_ANGLE = 90 + SWEEP_DEG / 2;
const TICK_COUNT = 5; // min, and 3 evenly spaced between, and max
const STATUS_COLORS = { green: "#1fbf83", yellow: "#f0a020", red: "#e94444" };

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

function arcPath(cx, cy, r, angleStart, angleEnd) {
  const p1 = polarToCartesian(cx, cy, r, angleStart);
  const p2 = polarToCartesian(cx, cy, r, angleEnd);
  const largeArc = angleStart - angleEnd > 180 ? 1 : 0;
  return `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${largeArc} 1 ${p2.x} ${p2.y}`;
}

// A KPI doesn't come with its own natural min/max the way a speedometer's
// 0-160mph does, so one is derived: 0 (or the lower of 0/value/target, in
// case this is tracking something that can go negative) up to a bit past
// whichever of the current value or target is larger - enough headroom
// that neither one ever pins to the very edge of the dial.
function deriveRange(numValue, numTarget, isPercentage) {
  if (isPercentage) return { min: 0, max: 100 };
  const hasValue = !isNaN(numValue);
  const hasTarget = !isNaN(numTarget);
  const low = Math.min(0, hasValue ? numValue : 0, hasTarget ? numTarget : 0);
  const high = Math.max(hasValue ? numValue : 0, hasTarget ? numTarget : 0, 1);
  const max = (high - low) * 1.25 + low;
  return { min: low, max };
}

// Same green/amber/red target-tolerance logic as the Calendar display
// mode (kpiStatusColor) - reused here as continuous zone boundaries along
// the dial instead of one color per discrete day, so both display modes
// agree on what "close to unacceptable" means for the same KPI.
function zoneSegments(min, max, target, direction) {
  const numTarget = parseNumericValue(target);
  if (isNaN(numTarget)) return null;
  const tolerance = Math.abs(numTarget) * 0.1;
  const clamp = (v) => Math.max(min, Math.min(max, v));
  if (direction === "lowerIsBetter") {
    return [
      { from: min, to: clamp(numTarget), status: "green" },
      { from: clamp(numTarget), to: clamp(numTarget + tolerance), status: "yellow" },
      { from: clamp(numTarget + tolerance), to: max, status: "red" },
    ];
  }
  return [
    { from: min, to: clamp(numTarget - tolerance), status: "red" },
    { from: clamp(numTarget - tolerance), to: clamp(numTarget), status: "yellow" },
    { from: clamp(numTarget), to: max, status: "green" },
  ];
}

export function DialGauge({ value, target, direction, unit, color, measurementType }) {
  const gradientId = useId();
  const numValue = parseNumericValue(value);
  const numTarget = parseNumericValue(target);
  const hasValue = !isNaN(numValue);
  const hasTarget = !isNaN(numTarget);

  const { min, max } = deriveRange(numValue, numTarget, measurementType === "Percentage");
  const range = max - min || 1;
  const cx = 50, cy = 50, r = 40, trackWidth = 11;

  const angleFor = (v) => START_ANGLE - Math.max(0, Math.min(1, (v - min) / range)) * SWEEP_DEG;

  const segments = hasTarget ? zoneSegments(min, max, numTarget, direction) : null;

  const ticks = Array.from({ length: TICK_COUNT }, (_, i) => min + (range * i) / (TICK_COUNT - 1));

  const needleAngle = angleFor(hasValue ? numValue : min);
  const needleTip = polarToCartesian(cx, cy, r - 16, needleAngle);
  const perp = needleAngle + 90;
  const baseSpread = 3;
  const base1 = polarToCartesian(cx, cy, baseSpread, perp);
  const base2 = polarToCartesian(cx, cy, baseSpread, perp + 180);

  return (
    <div className="flex flex-col items-center mt-1">
      {/* Extra horizontal margin on both sides of the plain 0-100 circle
          coordinate space - the gauge sweeps past a flat semicircle
          (SWEEP_DEG > 180), so the min/max tick labels sit further out
          than the arc's own endpoints and would otherwise clip off the
          edge of a viewBox sized to exactly match the arc. */}
      <svg viewBox="-10 0 120 66" className="w-full max-w-[220px]">
        <defs>
          <radialGradient id={gradientId} cx="35%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#f5f5f5" />
            <stop offset="55%" stopColor="#b8bcc2" />
            <stop offset="100%" stopColor="#6b7076" />
          </radialGradient>
        </defs>

        {segments ? (
          segments.map((seg, i) => seg.from < seg.to && (
            <path
              key={i}
              d={arcPath(cx, cy, r, angleFor(seg.from), angleFor(seg.to))}
              fill="none"
              stroke={STATUS_COLORS[seg.status]}
              strokeWidth={trackWidth}
            />
          ))
        ) : (
          <path d={arcPath(cx, cy, r, START_ANGLE, START_ANGLE - SWEEP_DEG)} fill="none" stroke={color || "var(--color-accent)"} strokeWidth={trackWidth} opacity={0.6} />
        )}

        {ticks.map((t, i) => {
          const pos = polarToCartesian(cx, cy, r + trackWidth / 2 + 7, angleFor(t));
          return (
            <text key={i} x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle" className="fill-current" style={{ fontSize: 6, opacity: 0.45 }}>
              {formatAxisValue(t, "")}
            </text>
          );
        })}

        {hasValue && (
          <>
            <polygon points={`${needleTip.x},${needleTip.y} ${base1.x},${base1.y} ${base2.x},${base2.y}`} fill="#333" />
            <circle cx={cx} cy={cy} r="7.5" fill={`url(#${gradientId})`} stroke="#4a4e54" strokeWidth="0.5" />
          </>
        )}
      </svg>

      <p className="text-xl font-black -mt-1">
        {hasValue ? formatAxisValue(numValue, unit) : "—"}
      </p>

      {!hasTarget && <p className="text-[10px] opacity-35 mt-0.5">Enter a target above to color the dial's zones.</p>}
    </div>
  );
}
