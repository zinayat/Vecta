"use client";

// Picks other tasks/lists this task or list depends on - excludes itself
// (a task list picking dependencies passes selfType="list", a task passes
// "task", both pass selfId so the item currently being edited never shows
// up as its own dependency option).
export default function DependencyPicker({ tasks, taskLists, selected, onChange, selfType, selfId }) {
  const deps = selected || [];

  function isSelected(type, id) {
    return deps.some((d) => d.type === type && String(d.id) === String(id));
  }

  function toggle(type, id) {
    if (isSelected(type, id)) {
      onChange(deps.filter((d) => !(d.type === type && String(d.id) === String(id))));
    } else {
      onChange([...deps, { type, id }]);
    }
  }

  const eligibleTasks = (tasks || []).filter((t) => !(selfType === "task" && String(t._id) === String(selfId)));
  const eligibleLists = (taskLists || []).filter((l) => !(selfType === "list" && String(l._id) === String(selfId)));

  if (eligibleTasks.length === 0 && eligibleLists.length === 0) {
    return <p className="text-[11px] opacity-35 italic">No other tasks or lists yet</p>;
  }

  return (
    <div className="max-h-28 overflow-y-auto space-y-1 rounded-lg border p-2" style={{ borderColor: "var(--color-border)" }}>
      {eligibleLists.map((l) => (
        <label key={`list-${l._id}`} className="flex items-center gap-1.5 text-xs">
          <input type="checkbox" checked={isSelected("list", l._id)} onChange={() => toggle("list", l._id)} />
          <span className="text-[9px] uppercase font-bold opacity-30 flex-shrink-0">List</span>
          <span className="truncate">{l.name}</span>
        </label>
      ))}
      {eligibleTasks.map((t) => (
        <label key={`task-${t._id}`} className="flex items-center gap-1.5 text-xs">
          <input type="checkbox" checked={isSelected("task", t._id)} onChange={() => toggle("task", t._id)} />
          <span className="text-[9px] uppercase font-bold opacity-30 flex-shrink-0">Task</span>
          <span className="truncate">{t.title}</span>
        </label>
      ))}
    </div>
  );
}
