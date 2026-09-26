"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ListChecks, Plus, Loader2, ClipboardList, AlertTriangle, RefreshCw } from "lucide-react";
import AppShell from "../../components/AppShell";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../lib/apiClient";
import { isBlocked } from "../../lib/taskDependencies";
import { FREQUENCY_LABELS } from "../../lib/recurrence";
import TaskRow from "../../components/tasks/TaskRow";
import TaskFormModal from "../../components/tasks/TaskFormModal";
import TaskListFormModal from "../../components/tasks/TaskListFormModal";

export default function TasksHubPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [taskLists, setTaskLists] = useState([]);
  const [tags, setTags] = useState([]);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [addingTask, setAddingTask] = useState(false);
  const [addingList, setAddingList] = useState(false);

  const [tagFilter, setTagFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [mineOnly, setMineOnly] = useState(false);

  function loadAll() {
    setLoading(true);
    return Promise.all([
      apiFetch("/api/tasks"),
      apiFetch("/api/task-lists"),
      apiFetch("/api/tags"),
      apiFetch("/api/users"),
      apiFetch("/api/teams"),
    ])
      .then(([t, l, tg, u, tm]) => {
        setTasks(t.tasks);
        setTaskLists(l.taskLists);
        setTags(tg.tags);
        setUsers(u.users);
        setTeams(tm.teams);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    // Recurring tasks/lists are checked "on open," not on a real-time
    // schedule - whatever's due gets created right before the hub's own
    // data loads, so a newly-spawned instance shows up immediately rather
    // than needing a second visit. A failure here shouldn't block seeing
    // existing tasks, so it's swallowed rather than surfaced as a page error.
    apiFetch("/api/recurrence/run", { method: "POST" })
      .catch(() => {})
      .finally(() => loadAll());
  }, []);

  async function createTask(value) {
    await apiFetch("/api/tasks", { method: "POST", body: value });
    setAddingTask(false);
    await loadAll();
  }

  async function createTaskList(value) {
    const { taskList } = await apiFetch("/api/task-lists", { method: "POST", body: value });
    setAddingList(false);
    router.push(`/tasks/lists/${taskList._id}`);
  }

  function matchesFilters(task) {
    if (tagFilter && !(task.tagIds || []).some((id) => String(id) === tagFilter)) return false;
    if (statusFilter && task.status !== statusFilter) return false;
    if (mineOnly && !(task.assigneeUserIds || []).some((id) => String(id) === String(user?._id))) return false;
    return true;
  }

  const standaloneTasks = tasks.filter((t) => !t.taskListId && matchesFilters(t));

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto pb-10">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--color-primary) 10%, transparent)" }}>
              <ListChecks className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
            </div>
            <div>
              <h1 className="text-lg font-bold">Tasks</h1>
              <p className="text-xs opacity-50">Single tasks and task lists, assigned with RACI</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setAddingList(true)} className="rounded-xl border px-3 py-2 text-xs font-semibold transition hover:opacity-80" style={{ borderColor: "var(--color-border)" }}>
              + New list
            </button>
            <button onClick={() => setAddingTask(true)} className="btn-primary text-xs">
              <Plus className="h-3.5 w-3.5" /> New task
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin opacity-40" /></div>
        ) : error ? (
          <p className="text-xs text-red-500">{error}</p>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-5 flex-wrap">
              <select className="input text-xs py-1.5 w-auto" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
                <option value="">All tags</option>
                {tags.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
              <select className="input text-xs py-1.5 w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All statuses</option>
                <option value="notStarted">Not started</option>
                <option value="inProgress">In progress</option>
                <option value="done">Done</option>
              </select>
              <label className="flex items-center gap-1.5 text-xs opacity-70">
                <input type="checkbox" checked={mineOnly} onChange={(e) => setMineOnly(e.target.checked)} /> Assigned to me
              </label>
            </div>

            <div className="mb-8">
              <h2 className="text-xs font-bold uppercase tracking-wide opacity-50 mb-2">Task lists</h2>
              {taskLists.length === 0 ? (
                <p className="text-xs opacity-40 italic">No task lists yet - group related tasks like "Plant startup task list" or "Daily gemba walk task list."</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {taskLists.map((l) => {
                    const listTasks = tasks.filter((t) => String(t.taskListId) === String(l._id));
                    const doneCount = listTasks.filter((t) => t.status === "done").length;
                    const blocked = isBlocked(l, tasks, taskLists);
                    return (
                      <Link key={l._id} href={`/tasks/lists/${l._id}`} className="card p-4 hover:opacity-90 transition">
                        <div className="flex items-center gap-1.5 mb-1">
                          <ClipboardList className="h-3.5 w-3.5 opacity-40 flex-shrink-0" />
                          <p className="text-sm font-semibold break-words min-w-0">{l.name}</p>
                          {blocked && <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />}
                        </div>
                        {l.description && <p className="text-xs opacity-50 mb-2 break-words">{l.description}</p>}
                        <p className="text-[11px] opacity-40">
                          {listTasks.length === 0 ? "No tasks yet" : `${doneCount}/${listTasks.length} done`}
                          {l.recurrence?.frequency && (
                            <span className="inline-flex items-center gap-0.5 ml-1.5">
                              <RefreshCw className="h-2.5 w-2.5" /> {FREQUENCY_LABELS[l.recurrence.frequency]}
                            </span>
                          )}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xs font-bold uppercase tracking-wide opacity-50 mb-2">Standalone tasks</h2>
              {standaloneTasks.length === 0 ? (
                <p className="text-xs opacity-40 italic">Nothing here matches your filters, or there are no standalone tasks yet.</p>
              ) : (
                <div className="space-y-2">
                  {standaloneTasks.map((t) => (
                    <TaskRow key={t._id} task={t} users={users} teams={teams} tags={tags} blocked={isBlocked(t, tasks, taskLists)} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {addingTask && (
        <TaskFormModal
          title="New task"
          onClose={() => setAddingTask(false)}
          onSave={createTask}
          users={users}
          teams={teams}
          tags={tags}
          onTagCreated={(tag) => setTags((prev) => [...prev, tag])}
          tasks={tasks}
          taskLists={taskLists}
        />
      )}
      {addingList && (
        <TaskListFormModal
          title="New task list"
          onClose={() => setAddingList(false)}
          onSave={createTaskList}
          tasks={tasks}
          taskLists={taskLists}
        />
      )}
    </AppShell>
  );
}
