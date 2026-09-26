// Shared display constants + pending-duration math for Observations, same
// "one place so every page agrees" pattern as taskMeta.js.
export const STATUS_LABELS = { open: "Open", converted: "Converted to task" };
export const STATUS_COLORS = {
  open: "bg-amber-100 text-amber-700",
  converted: "bg-emerald-100 text-emerald-700",
};

export const MAX_IMAGES = 6;

// Whole days between a past date/timestamp and now - used both for a
// still-open observation ("pending 4 days" since it was logged) and for a
// converted one's task ("pending 11 days" since observationCreatedAt,
// which keeps counting through the conversion rather than resetting).
// Floors rather than rounds so "just converted a minute ago" reads as 0,
// not 1.
export function daysSince(dateOrString) {
  if (!dateOrString) return null;
  const then = new Date(dateOrString);
  if (isNaN(then.getTime())) return null;
  const diffMs = Date.now() - then.getTime();
  return Math.max(0, Math.floor(diffMs / 86400000));
}

// Calendar days between two dates - used specifically for "took N days to
// convert this observation into a task" (observation.createdAt vs.
// task.createdAt), distinct from daysSince's "vs. right now."
export function daysBetween(fromDateOrString, toDateOrString) {
  if (!fromDateOrString || !toDateOrString) return null;
  const from = new Date(fromDateOrString);
  const to = new Date(toDateOrString);
  if (isNaN(from.getTime()) || isNaN(to.getTime())) return null;
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / 86400000));
}

export function pendingLabel(days) {
  if (days === null) return "";
  if (days === 0) return "Pending less than a day";
  return `Pending ${days} day${days === 1 ? "" : "s"}`;
}
