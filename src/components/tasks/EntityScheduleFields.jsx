"use client";

import UserMultiPicker from "./UserMultiPicker";
import TagPicker from "./TagPicker";
import DependencyPicker from "./DependencyPicker";
import RecurrencePicker from "./RecurrencePicker";
import { STATUS_LABELS, STATUS_ORDER } from "../../lib/taskMeta";

// Everything a Task and a TaskList have in common besides their own
// title/name+description - dates, status, RACI, tags, dependencies,
// repeats. Shared by TaskForm and TaskListFormModal (and the task list
// detail page's own edit form) so this substantial chunk of UI, and its
// behavior, only exists in one place.
export default function EntityScheduleFields({
  value, onChange, users, teams, tags, onTagCreated, tasks, taskLists, selfType, selfId,
}) {
  const v = value || {};
  function set(field) {
    return (e) => onChange({ ...v, [field]: e.target.value });
  }
  function setRaci(field, ids) {
    onChange({ ...v, raci: { ...(v.raci || {}), [field]: ids } });
  }

  return (
    <>
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
          A fresh copy (status reset, dated to that day{selfType === "list" ? ", every item in it recreated too" : ""}) is created next time someone opens Tasks on or after it's due.
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
          selfType={selfType}
          selfId={selfId}
        />
      </div>
    </>
  );
}
