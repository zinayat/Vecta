"use client";

import EntityScheduleFields from "./EntityScheduleFields";

// Controlled form - `value` is the draft task, `onChange` replaces it -
// same pattern as every widget's Form component in Dashboards, so a
// parent page owns Save/Cancel and any API call around this.
export default function TaskForm({
  value, onChange, users, teams, tags, onTagCreated, tasks, taskLists,
  fixedTaskListId, selfTaskId,
}) {
  const v = value || {};
  function set(field) {
    return (e) => onChange({ ...v, [field]: e.target.value });
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[11px] font-medium opacity-60 mb-1 block">Title</label>
        <input className="input" placeholder="e.g. Verify seed cleaner guard is in place" value={v.title || ""} onChange={set("title")} />
      </div>

      <div>
        <label className="text-[11px] font-medium opacity-60 mb-1 block">Description (optional)</label>
        <textarea className="input" rows={2} placeholder="Any detail someone doing this would need" value={v.description || ""} onChange={set("description")} />
      </div>

      {!fixedTaskListId && (
        <div>
          <label className="text-[11px] font-medium opacity-60 mb-1 block">Part of a task list? (optional)</label>
          <select className="input" value={v.taskListId || ""} onChange={set("taskListId")}>
            <option value="">Standalone task</option>
            {(taskLists || []).map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
          </select>
        </div>
      )}

      <EntityScheduleFields
        value={v}
        onChange={onChange}
        users={users}
        teams={teams}
        tags={tags}
        onTagCreated={onTagCreated}
        tasks={tasks}
        taskLists={taskLists}
        selfType="task"
        selfId={selfTaskId}
      />
    </div>
  );
}
