"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2, Check, X, Loader2, AlertTriangle, ClipboardList } from "lucide-react";
import AppShell from "../../../components/AppShell";
import { apiFetch } from "../../../lib/apiClient";
import { resolveDependencies } from "../../../lib/taskDependencies";
import { STATUS_LABELS, STATUS_COLORS, STATUS_ORDER, RACI_ROLE_LABELS, userNameById } from "../../../lib/taskMeta";
import TaskForm from "../../../components/tasks/TaskForm";

export default function TaskDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [task, setTask] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [taskLists, setTaskLists] = useState([]);
  const [tags, setTags] = useState([]);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch(`/api/tasks/${id}`),
      apiFetch("/api/tasks"),
      apiFetch("/api/task-lists"),
      apiFetch("/api/tags"),
      apiFetch("/api/users"),
      apiFetch("/api/teams"),
    ])
      .then(([t, allT, l, tg, u, tm]) => {
        setTask(t.task);
        setTasks(allT.tasks);
        setTaskLists(l.taskLists);
        setTags(tg.tags);
        setUsers(u.users);
        setTeams(tm.teams);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  function startEdit() {
    setDraft(task);
    setEditing(true);
  }

  async function save() {
    setSaving(true);
    try {
      const { task: updated } = await apiFetch(`/api/tasks/${id}`, { method: "PUT", body: draft });
      setTask(updated);
      setTasks((prev) => prev.map((t) => (t._id === id ? updated : t)));
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function quickSetStatus(status) {
    const { task: updated } = await apiFetch(`/api/tasks/${id}`, { method: "PUT", body: { status } });
    setTask(updated);
  }

  async function confirmDelete() {
    setDeleteBusy(true);
    try {
      await apiFetch(`/api/tasks/${id}`, { method: "DELETE" });
      router.push(task.taskListId ? `/tasks/lists/${task.taskListId}` : "/tasks");
    } catch (err) {
      setError(err.message);
      setDeleteBusy(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin opacity-40" /></div>
      </AppShell>
    );
  }

  if (!task) {
    return (
      <AppShell>
        <p className="text-sm opacity-50">Task not found.</p>
      </AppShell>
    );
  }

  const deps = resolveDependencies(task, tasks, taskLists);
  const blockedDeps = deps.filter((d) => !d.done);

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto pb-10">
        <Link href={task.taskListId ? `/tasks/lists/${task.taskListId}` : "/tasks"} className="inline-flex items-center gap-1.5 text-xs opacity-50 hover:opacity-80 mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> {task.taskListId ? "Back to list" : "Back to Tasks"}
        </Link>

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        {editing ? (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold">Edit task</p>
              <div className="flex items-center gap-1">
                <button onClick={save} disabled={saving} className="p-1.5 text-emerald-600 disabled:opacity-40"><Check className="h-4 w-4" /></button>
                <button onClick={() => setEditing(false)} className="p-1.5 opacity-40"><X className="h-4 w-4" /></button>
              </div>
            </div>
            <TaskForm
              value={draft}
              onChange={setDraft}
              users={users}
              teams={teams}
              tags={tags}
              onTagCreated={(tag) => setTags((prev) => [...prev, tag])}
              tasks={tasks}
              taskLists={taskLists}
              selfTaskId={task._id}
            />
          </div>
        ) : (
          <div className="card p-5">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h1 className="text-lg font-bold break-words min-w-0">{task.title}</h1>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={startEdit} className="p-1.5 opacity-40 hover:opacity-80"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => setDeleting(true)} className="p-1.5 opacity-40 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>

            {task.taskListId && (
              <Link href={`/tasks/lists/${task.taskListId}`} className="inline-flex items-center gap-1 text-[11px] opacity-50 hover:opacity-80 mb-2">
                <ClipboardList className="h-3 w-3" /> {taskLists.find((l) => l._id === task.taskListId)?.name || "Part of a task list"}
              </Link>
            )}

            <div className="flex items-center gap-1.5 flex-wrap mb-3">
              {STATUS_ORDER.map((s) => (
                <button
                  key={s}
                  onClick={() => quickSetStatus(s)}
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold transition ${task.status === s ? STATUS_COLORS[s] : "opacity-40 hover:opacity-70"}`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>

            {blockedDeps.length > 0 && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-2 mb-3 flex items-start gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-700">Blocked by: {blockedDeps.map((d) => d.label).join(", ")}</p>
              </div>
            )}

            {task.description && <p className="text-sm opacity-70 mb-3 break-words leading-relaxed">{task.description}</p>}

            <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
              <div>
                <p className="opacity-40 mb-0.5">Start date</p>
                <p>{task.startDate || "—"}</p>
              </div>
              <div>
                <p className="opacity-40 mb-0.5">Due date</p>
                <p>{task.dueDate || "—"}</p>
              </div>
            </div>

            <div className="mb-3">
              <p className="text-[11px] opacity-40 mb-1">Assigned to (Responsible)</p>
              <p className="text-xs">
                {[...(task.assigneeUserIds || []).map((uid) => userNameById(users, uid)), task.assigneeTeamId ? teams.find((t) => t._id === task.assigneeTeamId)?.name : null].filter(Boolean).join(", ") || "Nobody yet"}
              </p>
            </div>

            {["accountableUserIds", "consultedUserIds", "informedUserIds"].some((f) => (task.raci?.[f] || []).length > 0) && (
              <div className="mb-3 space-y-1">
                {["accountableUserIds", "consultedUserIds", "informedUserIds"].map((f) => (
                  (task.raci?.[f] || []).length > 0 && (
                    <p key={f} className="text-xs"><span className="opacity-40">{RACI_ROLE_LABELS[f]}:</span> {(task.raci[f] || []).map((uid) => userNameById(users, uid)).join(", ")}</p>
                  )
                ))}
              </div>
            )}

            {(task.tagIds || []).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {tags.filter((t) => (task.tagIds || []).some((id2) => String(id2) === String(t._id))).map((t) => (
                  <span key={t._id} className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: `color-mix(in srgb, ${t.color} 14%, transparent)`, color: t.color }}>{t.name}</span>
                ))}
              </div>
            )}

            {deps.length > 0 && (
              <div>
                <p className="text-[11px] opacity-40 mb-1">Depends on</p>
                <div className="space-y-0.5">
                  {deps.map((d, i) => (
                    <p key={i} className={`text-xs ${d.done ? "opacity-50" : "text-amber-700"}`}>
                      {d.done ? "✓" : "○"} {d.label} <span className="opacity-40">({d.type})</span>
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
          <div className="card w-full max-w-sm p-5 max-h-full overflow-y-auto">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-9 w-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
              <p className="text-sm font-bold break-words min-w-0">Delete "{task.title}"?</p>
            </div>
            <p className="text-xs opacity-60 leading-relaxed mb-5">
              This task will be deleted permanently. This action cannot be undone.
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setDeleting(false)} disabled={deleteBusy} className="flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition hover:bg-black/[0.03]" style={{ borderColor: "var(--color-border)" }}>
                Cancel
              </button>
              <button onClick={confirmDelete} disabled={deleteBusy} className="flex-1 rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 flex items-center justify-center gap-1.5">
                {deleteBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
