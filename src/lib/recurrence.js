// Rule-based date math for recurring tasks/lists - no cron library, no
// external scheduler, just "what's the next date" arithmetic plus a
// caught-up check run whenever someone opens the Tasks hub (see
// lib/taskRecurrenceEngine.js). Honest about what that means: a recurring
// item is recreated the next time someone opens Tasks on or after its due
// date, not at the exact instant the clock ticks over.
export const FREQUENCIES = ["daily", "weekly", "monthly", "quarterly", "annually"];
export const FREQUENCY_LABELS = { daily: "Daily", weekly: "Weekly", monthly: "Monthly", quarterly: "Quarterly", annually: "Annually" };

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// Advances a YYYY-MM-DD date string by exactly one period. Month-based
// periods (monthly/quarterly/annually) use the calendar's own month
// lengths via Date's rollover (e.g. Jan 31 + 1 month lands on Mar 3, not
// an invalid Feb 31) - a small, known quirk of date-by-month arithmetic
// rather than a bug, and not worth a bigger date library for.
export function addPeriod(dateStr, frequency) {
  const d = new Date(`${dateStr}T00:00:00`);
  if (frequency === "daily") d.setDate(d.getDate() + 1);
  else if (frequency === "weekly") d.setDate(d.getDate() + 7);
  else if (frequency === "monthly") d.setMonth(d.getMonth() + 1);
  else if (frequency === "quarterly") d.setMonth(d.getMonth() + 3);
  else if (frequency === "annually") d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

// If nobody opened Tasks for a while, a daily item could be many periods
// overdue - this jumps `nextOccurrenceDate` straight to the first period
// that's still in the future, so re-opening Tasks creates exactly one
// fresh instance (dated today) instead of flooding the list with one
// clone per missed day.
export function catchUpNextOccurrence(nextOccurrenceDate, frequency, today) {
  let next = nextOccurrenceDate;
  let guard = 0;
  while (next <= today && guard < 1000) {
    next = addPeriod(next, frequency);
    guard += 1;
  }
  return next;
}

// Builds the recurrence sub-document to save from what a task/list form
// submitted. Turning recurrence off clears the clock entirely. Picking a
// *different* frequency than before (including turning it on for the
// first time) restarts the clock from the given anchor date (the item's
// own due/start date, or today) - but re-saving the same frequency (e.g.
// just flipping the active toggle, or editing an unrelated field) leaves
// an in-progress clock alone rather than pushing its next occurrence out.
export function resolveRecurrenceUpdate(existing, incoming, anchorDate) {
  const frequency = incoming?.frequency || null;
  if (!frequency) return { frequency: null, active: true, nextOccurrenceDate: null };
  const isFreshStart = existing?.frequency !== frequency;
  return {
    frequency,
    active: incoming.active !== undefined ? incoming.active : true,
    nextOccurrenceDate: isFreshStart ? (anchorDate || todayStr()) : existing.nextOccurrenceDate,
  };
}
