// Shared status/RACI display constants - one place so the Tasks hub, a
// task's own page, and a task list's page all render status the same way.
export const STATUS_LABELS = { notStarted: "Not started", inProgress: "In progress", done: "Done" };
export const STATUS_COLORS = {
  notStarted: "bg-gray-100 text-gray-600",
  inProgress: "bg-blue-100 text-blue-700",
  done: "bg-emerald-100 text-emerald-700",
};
export const STATUS_ORDER = ["notStarted", "inProgress", "done"];

export const RACI_ROLE_LABELS = { accountableUserIds: "Accountable", consultedUserIds: "Consulted", informedUserIds: "Informed" };
export const RACI_BADGE_COLORS = { R: "bg-blue-100 text-blue-700", A: "bg-red-100 text-red-700", C: "bg-amber-100 text-amber-700", I: "bg-gray-100 text-gray-600" };

export function userNameById(users, id) {
  return (users || []).find((u) => String(u._id) === String(id))?.name || "Unknown";
}
