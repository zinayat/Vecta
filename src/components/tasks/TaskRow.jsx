"use client";

import Link from "next/link";
import { AlertTriangle, Users as UsersIcon, RefreshCw } from "lucide-react";
import { STATUS_LABELS, STATUS_COLORS, userNameById } from "../../lib/taskMeta";
import { FREQUENCY_LABELS } from "../../lib/recurrence";

export default function TaskRow({ task, users, teams, tags, blocked }) {
  const assigneeNames = (task.assigneeUserIds || []).map((id) => userNameById(users, id));
  const teamName = task.assigneeTeamId ? (teams || []).find((t) => String(t._id) === String(task.assigneeTeamId))?.name : null;
  const taskTags = (tags || []).filter((t) => (task.tagIds || []).some((id) => String(id) === String(t._id)));

  return (
    <Link href={`/tasks/${task._id}`} className="card p-3 flex items-start justify-between gap-3 hover:opacity-90 transition">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold flex-shrink-0 ${STATUS_COLORS[task.status]}`}>{STATUS_LABELS[task.status]}</span>
          <p className="text-sm font-medium break-words min-w-0">{task.title}</p>
          {blocked && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-600 flex-shrink-0">
              <AlertTriangle className="h-3 w-3" /> Blocked
            </span>
          )}
          {task.recurrence?.frequency && (
            <span className="inline-flex items-center gap-0.5 text-[10px] opacity-40 flex-shrink-0">
              <RefreshCw className="h-2.5 w-2.5" /> {FREQUENCY_LABELS[task.recurrence.frequency]}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap text-[11px] opacity-50">
          {task.dueDate && <span>Due {task.dueDate}</span>}
          {(assigneeNames.length > 0 || teamName) && (
            <span className="inline-flex items-center gap-1">
              <UsersIcon className="h-3 w-3" />
              {[...assigneeNames, teamName].filter(Boolean).join(", ")}
            </span>
          )}
        </div>
        {taskTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {taskTags.map((t) => (
              <span key={t._id} className="rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={{ background: `color-mix(in srgb, ${t.color} 14%, transparent)`, color: t.color }}>{t.name}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
