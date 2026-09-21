// Shared rule-based math for combining numbers - used by both KPI tile
// consolidation and Stat tiles' consolidation + period bucketing. Plain
// arithmetic, not AI, same as everything else in Vecta labeled "assisted."

export const AGGREGATE_TYPES = ["sum", "count", "average", "min", "max"];
export const AGGREGATE_LABELS = { sum: "Sum", count: "Count", average: "Average", min: "Min", max: "Max" };

// How many dated entries a KPI/Stat tile's manual history keeps - a full
// season of continuous daily entry (roughly a year) rather than a rolling
// month, so a tile being filled in every day doesn't start silently
// dropping its oldest entries well before the season's over.
export const MAX_HISTORY_ENTRIES = 360;

// A typed value like "1,842" is a completely normal way to write a
// number, but plain Number("1,842") is NaN - so a value entered with a
// thousands separator would otherwise silently vanish from history
// (filtered out as "not a number") with no error shown anywhere, on a
// tile that still looks like it saved fine. Stripping thousands commas
// (and surrounding whitespace) before parsing is what a human means by
// that text, without trying to guess at anything else (a trailing unit
// like "1842 kg" still fails - that belongs in the tile's own Unit
// field, not typed into the value).
export function parseNumericValue(raw) {
  if (typeof raw === "number") return raw;
  if (raw === null || raw === undefined) return NaN;
  const cleaned = String(raw).trim().replace(/,/g, "");
  return cleaned === "" ? NaN : Number(cleaned);
}

export function aggregate(values, type = "sum") {
  if (!values || values.length === 0) return null;
  switch (type) {
    case "count": return values.length;
    case "average": return values.reduce((a, b) => a + b, 0) / values.length;
    case "min": return Math.min(...values);
    case "max": return Math.max(...values);
    case "sum":
    default: return values.reduce((a, b) => a + b, 0);
  }
}

function sortByDate(history) {
  return [...(history || [])].filter((h) => h?.date).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

// Combines several tiles' date histories into one series - for each date
// that appears in any of them, aggregates the values recorded on that
// exact date across tiles. Tiles that don't have an entry for a given
// date simply don't contribute to that date's bucket, rather than
// counting as zero.
export function mergeHistoriesByDate(historyArrays, type = "sum") {
  const byDate = new Map();
  for (const hist of historyArrays || []) {
    for (const h of hist || []) {
      if (!h?.date) continue;
      const v = parseNumericValue(h.value);
      if (isNaN(v)) continue;
      if (!byDate.has(h.date)) byDate.set(h.date, []);
      byDate.get(h.date).push(v);
    }
  }
  return [...byDate.entries()]
    .map(([date, values]) => ({ date, value: aggregate(values, type) }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

function weekStartKey(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? 6 : day - 1; // days since Monday
  d.setDate(d.getDate() - diff);
  return d.toISOString().slice(0, 10);
}

function monthStartKey(dateStr) {
  return `${dateStr.slice(0, 7)}-01`;
}

// Groups a date series into day/week/month/"season" buckets, aggregating
// each bucket's values by `type`. "Season" isn't a calendar quarter -
// it's simply the whole series collapsed into one bucket (everything
// recorded so far), which is the simplest honest reading of "for the
// whole season" without inventing a calendar concept Vecta doesn't have
// elsewhere. The returned series is always {date, value}[] - one point
// per day, or one per week/month (dated to that period's start), or a
// single point for "season" - so it can be handed straight to a trend
// chart or read as "the latest bucket" for a single-number display.
export function bucketHistory(history, period = "date", type = "sum") {
  const sorted = sortByDate(history);
  if (sorted.length === 0) return [];

  if (period === "date") {
    return sorted
      .map((h) => ({ date: h.date, value: parseNumericValue(h.value) }))
      .filter((h) => !isNaN(h.value));
  }

  if (period === "season") {
    const values = sorted.map((h) => parseNumericValue(h.value)).filter((v) => !isNaN(v));
    if (values.length === 0) return [];
    return [{ date: sorted[sorted.length - 1].date, value: aggregate(values, type) }];
  }

  const keyFn = period === "week" ? weekStartKey : monthStartKey;
  const buckets = new Map();
  for (const h of sorted) {
    const v = parseNumericValue(h.value);
    if (isNaN(v)) continue;
    const key = keyFn(h.date);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(v);
  }
  return [...buckets.entries()]
    .map(([date, values]) => ({ date, value: aggregate(values, type) }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}
