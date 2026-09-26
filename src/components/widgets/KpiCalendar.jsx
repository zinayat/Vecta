"use client";

import { useMemo, useState } from "react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
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
// rather than a literal calendar: one small box per day colored by
// comparing that day's history value to the target - green (acceptable),
// amber (close to crossing into unacceptable), red (unacceptable) - via
// kpiStatusColor(). A day with no entry renders as an empty dark tile.
// Defaults to whichever month has the most recent entry (falling back to
// the real current month if there's no history yet) rather than always
// the real current month - history can span up to a year, so hard-coding
// "now" would silently show an all-dark board for any data entered
// outside the current calendar month. The "+" tile and the ring around
// today only appear while viewing the real current month, since they're
// quick-add affordances anchored to "right now," not to whichever month
// happens to be on screen.
export default function KpiCalendar({ history, target, direction, unit, onRequestEdit, onClearHistory }) {
  const entriesByDate = useMemo(() => {
    const map = {};
    for (const h of history || []) {
      if (h.date) map[h.date] = h.value;
    }
    return map;
  }, [history]);

  const realToday = new Date();

  const initialMonth = useMemo(() => {
    const dates = Object.keys(entriesByDate).sort();
    const currentMonthPrefix = `${realToday.getFullYear()}-${pad2(realToday.getMonth() + 1)}`;
    // The real current month wins whenever it has any data at all, even
    // if an entry elsewhere is dated later (a stray or future-dated row
    // shouldn't silently steal the default view away from "today," which
    // is what most people expect this board to open on). Only fall back
    // to the latest entry's month when the current month has nothing.
    if (dates.length === 0 || dates.some((d) => d.startsWith(currentMonthPrefix))) {
      return new Date(realToday.getFullYear(), realToday.getMonth(), 1);
    }
    const latest = new Date(`${dates[dates.length - 1]}T00:00:00`);
    return new Date(latest.getFullYear(), latest.getMonth(), 1);
    // Only ever used to seed the initial view - browsing shouldn't jump
    // back every time history changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [viewed, setViewed] = useState(initialMonth);

  const year = viewed.getFullYear();
  const month = viewed.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const isCurrentMonth = year === realToday.getFullYear() && month === realToday.getMonth();
  const todayDay = isCurrentMonth ? realToday.getDate() : null;
  const hasTarget = target !== undefined && target !== "" && target !== null;

  function shiftMonth(delta) {
    setViewed(new Date(year, month + delta, 1));
  }

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
    // A value that's present but won't parse as a number (a stray unit
    // typed inline, say) shouldn't look identical to "no entry at all" -
    // that's a silent trap that's genuinely hard to spot on a dark tile,
    // so it gets its own dashed-outline treatment instead of just
    // disappearing into the empty-day style.
    const status = hasValue && hasTarget ? kpiStatusColor(value, target, direction) : null;
    const unparseable = hasValue && hasTarget && !status;
    const isToday = cell.day === todayDay;
    const title = hasValue
      ? `${dateStr}: ${value}${unit ? ` ${unit}` : ""}${hasTarget ? ` (target ${target}${unit ? ` ${unit}` : ""})` : ""}${unparseable ? " - not a number, can't compare to target" : ""}`
      : dateStr;

    return (
      <div
        key={i}
        title={title}
        className="aspect-square rounded-lg flex items-center justify-center text-[10px] font-semibold"
        style={{
          background: status ? STATUS_BG[status] : DARK.tile,
          color: status ? "#ffffff" : unparseable ? "#f0a020" : DARK.numberMuted,
          border: unparseable ? "1px dashed #f0a020" : undefined,
          boxShadow: isToday ? `0 0 0 2px ${DARK.ring}` : undefined,
        }}
      >
        {cell.day}
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-3 -mx-1" style={{ background: DARK.card }}>
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={() => shiftMonth(-1)} className="p-0.5 transition hover:opacity-100" style={{ color: "rgba(255,255,255,0.35)" }} aria-label="Previous month">
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <p className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>{viewed.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</p>
        <button type="button" onClick={() => shiftMonth(1)} className="p-0.5 transition hover:opacity-100" style={{ color: "rgba(255,255,255,0.35)" }} aria-label="Next month">
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5">{gridCells.map(renderTile)}</div>

      {!hasTarget && (
        <p className="text-xs font-semibold mt-2 rounded-lg px-2 py-1.5" style={{ color: "#f0a020", background: "rgba(240,160,32,0.12)" }}>
          No target set - every day will stay uncolored until you enter one in Settings.
        </p>
      )}

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
