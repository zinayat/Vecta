"use client";

// A plain checkbox list of company users - shared by "assigned to" and
// each RACI role, since they're all the same interaction (pick zero or
// more real accounts from the company).
export default function UserMultiPicker({ users, selectedIds, onChange, emptyLabel }) {
  const selected = selectedIds || [];

  function toggle(id) {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  }

  if (!users || users.length === 0) {
    return <p className="text-[11px] opacity-35 italic">{emptyLabel || "No teammates yet"}</p>;
  }

  return (
    <div className="max-h-28 overflow-y-auto space-y-1 rounded-lg border p-2" style={{ borderColor: "var(--color-border)" }}>
      {users.map((u) => (
        <label key={u._id} className="flex items-center gap-1.5 text-xs">
          <input type="checkbox" checked={selected.includes(u._id)} onChange={() => toggle(u._id)} />
          <span className="truncate">{u.name}</span>
        </label>
      ))}
    </div>
  );
}
