"use client";

import { useMemo } from "react";
import { Plus } from "lucide-react";
import { kpiStatusColor } from "../../lib/kpiBuilder";

// A fixed hourglass/diamond template rather than a real Monday-Sunday
// month grid - this display exists to show "where today sits relative to
// the month," not to be a literal wall calendar, so a wide middle band
// tapering to a narrow top/bottom reads at a glance without needing
// weekday alignment. 3+3+7+7+7+3+3 = 33 slots, always enough for a
// month's up-to-31 days plus the "add" tile.
const ROW_WIDTHS = [3, 3, 7, 7, 7, 3, 3];
const TOTAL_SLOTS = ROW_WIDTHS.reduce((a, b) => a + b, 0);

const DARK = {
  card: "#252932",
  tile: "#14161b",
  ring: "#f4f5f7",
  addIcon: "#ff6b6b",
  numberMuted: "rgba(255,255,255,0.3)",
};
const STATUS_BG = { green: "#1fbf83", yellow: "#f0a020", red: "#e94444" };

function pad2(n) {
  return String(n).padStart(2, "0");
}

// One flat list of day/add/blank slots, in the fixed reading order the
// template fills row by row. The "add" tile is inserted immediately
// before today's slot (only when the viewed month is the real current
// month) so it always sits right at the boundary between logged days and
// days not yet reached - the same reason today's own tile below.
function buildSlots(daysInMonth, todayDay) {
  const slots = [];
  for (let d = 1; d <= daysInMonth; d++) {
    if (todayDay && d === todayDay) slots.push({ type: "add" });
    slots.push({ type: "day", day: d });
  }
  while (slots.length < TOTAL_SLOTS) slots.push({ type: "blank" });
  return slots.slice(0, TOTAL_SLOTS);
}

// Expands the diamond's row widths into a flat 7-wide grid (49 cells),
// padding narrower rows with invisible filler so every row's real tiles
// line up in the same columns as the wide rows - what actually produces
// the diamond silhouette.
function toGridCells(slots) {
  const cells = [];
  let idx = 0;
  for (const width of ROW_WIDTHS) {
    const indent = Math.floor((7 - width) / 2);
    for (let i = 0; i < indent; i++) cells.push(null);
    for (let i = 0; i < width; i++) cells.push(slots[idx++]);
    for (let i = 0; i < indent; i++) cells.push(null);
  }
  return cells;
}

// A "right now" status board for a KPI, shaped like the reference design
// rather than a literal calendar: always the current month, one small box
// per day colored by comparing that day's history value to the target -
// green (acceptable), amber (close to crossing into unacceptable), red
// (unacceptable) - via kpiStatusColor(). A day with no entry, and every
// day still in the future, renders as an empty dark tile. The "+" tile
// and the ring around today are both quick-add affordances: clicking
// either opens the tile's editor (onRequestEdit) so a value can be logged
// without hunting for the pencil icon.
export default function KpiCalendar({ history, target, direction, unit, onRequestEdit, onClearHistory }) {
  const entriesByDate = useMemo(() => {
    const map = {};
    for (const h of history || []) {
      if (h.date) map[h.date] = h.value;
    }
    return map;
  }, [history]);

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayDay = today.getDate();
  const hasTarget = target !== undefined && target !== "" && target !== null;

  const gridCells = useMemo(() => toGridCells(buildSlots(daysInMonth, todayDay)), [daysInMonth, todayDay]);

  function renderTile(cell, i) {
    if (!cell) return <div key={i} />;

    if (cell.type === "blank") {
      return <div key={i} className="aspect-square rounded-lg" style={{ background: DARK.tile }} />;
    }

    if (cell.type === "add") {
      return (
        <button
          key={i}
          type="button"
          onClick={onRequestEdit}
          disabled={!onRequestEdit}
          title="Add a value"
          className="aspect-square rounded-lg flex items-center justify-center transition hover:brightness-125 disabled:cursor-default"
          style={{ background: DARK.tile }}
        >
          <Plus className="h-3.5 w-3.5" style={{ color: DARK.addIcon }} />
        </button>
      );
    }

    const dateStr = `${year}-${pad2(month + 1)}-${pad2(cell.day)}`;
    const value = entriesByDate[dateStr];
    const hasValue = value !== undefined && value !== "";
    const status = hasValue && hasTarget ? kpiStatusColor(value, target, direction) : null;
    const isToday = cell.day === todayDay;
    const title = hasValue ? `${dateStr}: ${value}${unit ? ` ${unit}` : ""}${hasTarget ? ` (target ${target}${unit ? ` ${unit}` : ""})` : ""}` : dateStr;

    return (
      <div
        key={i}
        title={title}
        className="aspect-square rounded-lg flex items-center justify-center text-[10px] font-semibold"
        style={{
          background: status ? STATUS_BG[status] : DARK.tile,
          color: status ? "#ffffff" : DARK.numberMuted,
          boxShadow: isToday ? `0 0 0 2px ${DARK.ring}` : undefined,
        }}
      >
        {cell.day}
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-3 -mx-1" style={{ background: DARK.card }}>
      <div className="grid grid-cols-7 gap-1.5">{gridCells.map(renderTile)}</div>

      {!hasTarget && <p className="text-[10px] mt-2" style={{ color: "rgba(255,255,255,0.35)" }}>Enter a target above to color each day.</p>}

      {onClearHistory && (
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Clear every entered value for this KPI? This can't be undone.")) onClearHistory();
          }}
          className="mt-2.5 text-[10px] font-medium rounded-full px-2.5 py-1 border transition hover:bg-white/5"
          style={{ borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)" }}
        >
          Clear data
        </button>
      )}
    </div>
  );
}
