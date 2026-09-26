"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { kpiStatusColor } from "../../lib/kpiBuilder";

const STATUS_STYLES = {
  green: "bg-emerald-500 text-white",
  yellow: "bg-amber-400 text-white",
  red: "bg-red-500 text-white",
};

const WEEKDAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

// Monday-first month grid, padded with null cells so the first day lands
// in its real weekday column - same Monday-anchored week convention as
// the Planning module's rollout.
function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (first.getDay() + 6) % 7; // 0 = Monday
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// A calendar view for a KPI's history, one small box per day, colored by
// comparing that day's value to the target - green (acceptable), yellow
// (close to unacceptable), red (unacceptable), or gray for a day with no
// entry. Browsable by month since history can span up to a year.
export default function KpiCalendar({ history, target, direction, unit }) {
  const entriesByDate = useMemo(() => {
    const map = {};
    for (const h of history || []) {
      if (h.date) map[h.date] = h.value;
    }
    return map;
  }, [history]);

  const latestDate = useMemo(() => {
    const dates = Object.keys(entriesByDate).sort();
    return dates.length > 0 ? new Date(`${dates[dates.length - 1]}T00:00:00`) : new Date();
  }, [entriesByDate]);

  const [viewed, setViewed] = useState(() => new Date(latestDate.getFullYear(), latestDate.getMonth(), 1));

  const year = viewed.getFullYear();
  const month = viewed.getMonth();
  const cells = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const hasTarget = target !== undefined && target !== "" && target !== null;

  function shiftMonth(delta) {
    setViewed(new Date(year, month + delta, 1));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <button type="button" onClick={() => shiftMonth(-1)} className="p-0.5 opacity-40 hover:opacity-80" aria-label="Previous month">
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <p className="text-[11px] font-semibold opacity-70">{viewed.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</p>
        <button type="button" onClick={() => shiftMonth(1)} className="p-0.5 opacity-40 hover:opacity-80" aria-label="Next month">
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {WEEKDAY_LABELS.map((w) => (
          <p key={w} className="text-center text-[9px] font-semibold opacity-35">{w}</p>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const value = entriesByDate[dateStr];
          const hasValue = value !== undefined && value !== "";
          const status = hasValue && hasTarget ? kpiStatusColor(value, target, direction) : null;
          const style = status ? STATUS_STYLES[status] : "opacity-25";
          const title = hasValue ? `${dateStr}: ${value}${unit ? ` ${unit}` : ""}${hasTarget ? ` (target ${target}${unit ? ` ${unit}` : ""})` : ""}` : dateStr;
          return (
            <div
              key={dateStr}
              title={title}
              className={`aspect-square rounded flex items-center justify-center text-[9px] font-semibold ${style}`}
              style={!status ? { background: "var(--color-bg)" } : undefined}
            >
              {day}
            </div>
          );
        })}
      </div>

      {hasTarget ? (
        <div className="flex items-center gap-2.5 mt-2 flex-wrap">
          <span className="inline-flex items-center gap-1 text-[9px] opacity-50"><span className="h-2 w-2 rounded-sm bg-emerald-500 inline-block" /> Acceptable</span>
          <span className="inline-flex items-center gap-1 text-[9px] opacity-50"><span className="h-2 w-2 rounded-sm bg-amber-400 inline-block" /> Near target</span>
          <span className="inline-flex items-center gap-1 text-[9px] opacity-50"><span className="h-2 w-2 rounded-sm bg-red-500 inline-block" /> Unacceptable</span>
        </div>
      ) : (
        <p className="text-[10px] opacity-35 mt-1.5">Enter a target above to color each day by how close it is to acceptable.</p>
      )}
    </div>
  );
}
