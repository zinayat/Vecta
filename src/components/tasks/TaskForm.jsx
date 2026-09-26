"use client";

import UserMultiPicker from "./UserMultiPicker";
import TagPicker from "./TagPicker";
import DependencyPicker from "./DependencyPicker";
import RecurrencePicker from "./RecurrencePicker";
import { STATUS_LABELS, STATUS_ORDER } from "../../lib/taskMeta";

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
  function setRaci(field, ids) {
    onChange({ ...v, raci: { ...(v.raci || {}), [field]: ids } });
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

      <div className="flex gap-2">
        <div className="flex-1 min-w-0">
          <label className="text-[11px] font-medium opacity-60 mb-1 block">Start date</label>
          <input type="date" className="input flex-1 min-w-0" value={v.startDate || ""} onChange={set("startDate")} />
        </div>
        <div className="flex-1 min-w-0">
          <label className="text-[11px] font-medium opacity-60 mb-1 block">Due date</label>
          <input type="date" className="input flex-1 min-w-0" value={v.dueDate || ""} onChange={set("dueDate")} />
        </div>
      </div>

      <div>
        <label className="text-[11px] font-medium opacity-60 mb-1 block">Status</label>
        <select className="input" value={v.status || "notStarted"} onChange={set("status")}>
          {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </div>

      <div>
        <label className="text-[11px] font-medium opacity-60 mb-1 block">Repeats</label>
        <RecurrencePicker value={v.recurrence} onChange={(recurrence) => onChange({ ...v, recurrence })} />
        <p className="text-[10px] opacity-40 mt-1">
          A fresh copy of this task (status reset, dated to that day) is created next time someone opens Tasks on or after it's due.
        </p>
      </div>

      <div>
        <p className="text-[11px] font-medium opacity-60 mb-1">Assigned to - Responsible in RACI terms</p>
        <div className="space-y-1.5">
          <UserMultiPicker users={users} selectedIds={v.assigneeUserIds || []} onChange={(ids) => onChange({ ...v, assigneeUserIds: ids })} emptyLabel="No teammates yet" />
          <select className="input" value={v.assigneeTeamId || ""} onChange={set("assigneeTeamId")}>
            <option value="">No team assigned</option>
            {(teams || []).map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
        </div>
      </div>

      <div className="rounded-lg border p-2 space-y-2" style={{ borderColor: "var(--color-border)" }}>
        <p className="text-[11px] font-medium opacity-60">RACI - the rest of it</p>
        <div>
          <p className="text-[10px] opacity-50 mb-1">Accountable</p>
          <UserMultiPicker users={users} selectedIds={v.raci?.accountableUserIds || []} onChange={(ids) => setRaci("accountableUserIds", ids)} />
        </div>
        <div>
          <p className="text-[10px] opacity-50 mb-1">Consulted</p>
          <UserMultiPicker users={users} selectedIds={v.raci?.consultedUserIds || []} onChange={(ids) => setRaci("consultedUserIds", ids)} />
        </div>
        <div>
          <p className="text-[10px] opacity-50 mb-1">Informed</p>
          <UserMultiPicker users={users} selectedIds={v.raci?.informedUserIds || []} onChange={(ids) => setRaci("informedUserIds", ids)} />
        </div>
      </div>

      <div>
        <label className="text-[11px] font-medium opacity-60 mb-1 block">Tags</label>
        <TagPicker tags={tags} selectedIds={v.tagIds || []} onChange={(ids) => onChange({ ...v, tagIds: ids })} onTagCreated={onTagCreated} />
      </div>

      <div>
        <label className="text-[11px] font-medium opacity-60 mb-1 block">Depends on (optional)</label>
        <DependencyPicker
          tasks={tasks}
          taskLists={taskLists}
          selected={v.dependencies || []}
          onChange={(deps) => onChange({ ...v, dependencies: deps })}
          selfType="task"
          selfId={selfTaskId}
        />
      </div>
    </div>
  );
}
