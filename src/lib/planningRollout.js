import { parseNumericValue } from "./aggregation";

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Monday of the week containing dateStr - same convention as the Stat
// widget's own week bucketing (lib/aggregation.js), kept local here since
// that one isn't exported and this is a small, self-contained utility.
function weekStartOf(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d.toISOString().slice(0, 10);
}

// Splits a whole-unit quantity (production is counted in real units, not
// fractions) across `count` buckets so they sum back to exactly `total` -
// the first `remainder` buckets get one extra unit rather than every
// bucket getting an identical, slightly-off average that would quietly
// under- or over-count the total.
export function evenSplit(total, count) {
  if (count <= 0) return [];
  const t = parseNumericValue(total);
  if (isNaN(t)) return Array(count).fill(null);
  const base = Math.floor(t / count);
  const remainder = Math.round(t - base * count);
  return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0));
}

// Every Monday from the week containing `fromDate` through the week
// containing `toDate`, inclusive - the weeks a production run needs to
// cover to hit a delivery date starting today (or wherever it's re-rolled
// from). Guards against runaway loops if a delivery date is absurdly far
// out or, from bad data, before the start.
export function generateWeekStarts(fromDate, toDate) {
  const starts = [];
  let cur = weekStartOf(fromDate);
  const lastWeek = weekStartOf(toDate);
  let guard = 0;
  while (cur <= lastWeek && guard < 260) {
    starts.push(cur);
    cur = addDays(cur, 7);
    guard += 1;
  }
  return starts.length > 0 ? starts : [weekStartOf(fromDate)];
}

export function generateWeekDays(weekStart) {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

// Rolls a production line's total quantity out into weekly buckets from
// `fromDate` (normally today) through its delivery date - the "roll out
// weekly" step. Each week starts with an even split; the user can adjust
// individual weeks afterward without this re-running and overwriting them.
export function rolloutWeekly(totalQuantity, deliveryDate, fromDate) {
  const from = fromDate || todayStr();
  const to = deliveryDate && deliveryDate >= from ? deliveryDate : from;
  const weekStarts = generateWeekStarts(from, to);
  const quantities = evenSplit(totalQuantity, weekStarts.length);
  return weekStarts.map((weekStart, i) => ({ weekStart, quantity: String(quantities[i] ?? 0), dailyBreakdown: [] }));
}

// Rolls one week's quantity out into its 7 days - the "then daily" step,
// done per week (only once someone actually needs that week's detail)
// rather than exploding the whole horizon into days up front.
export function rolloutDaily(weekQuantity, weekStart) {
  const days = generateWeekDays(weekStart);
  const quantities = evenSplit(weekQuantity, 7);
  return days.map((date, i) => ({ date, quantity: String(quantities[i] ?? 0) }));
}

export function sumQuantities(entries, key) {
  return (entries || []).reduce((sum, e) => {
    const v = parseNumericValue(key ? e[key] : e);
    return isNaN(v) ? sum : sum + v;
  }, 0);
}
