"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2, Plus, Loader2, AlertTriangle, ClipboardList } from "lucide-react";
import AppShell from "../../../../components/AppShell";
import { apiFetch } from "../../../../lib/apiClient";
import { resolveDependencies } from "../../../../lib/taskDependencies";
import TaskRow from "../../../../components/tasks/TaskRow";
import TaskFormModal from "../../../../components/tasks/TaskFormModal";
import DependencyPicker from "../../../../components/tasks/DependencyPicker";

export default function TaskListDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [taskList, setTaskList] = useState(null);
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
  const [addingTask, setAddingTask] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  function loadAll() {
    return Promise.all([
      apiFetch(`/api/task-lists/${id}`),
      apiFetch("/api/tasks"),
      apiFetch("/api/task-lists"),
      apiFetch("/api/tags"),
      apiFetch("/api/users"),
      apiFetch("/api/teams"),
    ]).then(([l, t, ls, tg, u, tm]) => {
      setTaskList(l.taskList);
      setTasks(t.tasks);
      setTaskLists(ls.taskLists);
      setTags(tg.tags);
      setUsers(u.users);
      setTeams(tm.teams);
    });
  }

  useEffect(() => {
    setLoading(true);
    loadAll().catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [id]);

  function startEdit() {
    setDraft(taskList);
    setEditing(true);
  }

  async function save() {
    setSaving(true);
    try {
      const { taskList: updated } = await apiFetch(`/api/task-lists/${id}`, { method: "PUT", body: draft });
      setTaskList(updated);
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function createTask(value) {
    await apiFetch("/api/tasks", { method: "POST", body: { ...value, taskListId: id } });
    setAddingTask(false);
    await loadAll();
  }

  async function confirmDelete() {
    setDeleteBusy(true);
    try {
      await apiFetch(`/api/task-lists/${id}`, { method: "DELETE" });
      router.push("/tasks");
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

  if (!taskList) {
    return (
      <AppShell>
        <p className="text-sm opacity-50">Task list not found.</p>
      </AppShell>
    );
  }

  const listTasks = tasks.filter((t) => String(t.taskListId) === String(taskList._id));
  const doneCount = listTasks.filter((t) => t.status === "done").length;
  const deps = resolveDependencies(taskList, tasks, taskLists);
  const blockedDeps = deps.filter((d) => !d.done);

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto pb-10">
        <Link href="/tasks" className="inline-flex items-center gap-1.5 text-xs opacity-50 hover:opacity-80 mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Tasks
        </Link>

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        <div className="card p-5 mb-4">
          {editing ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold">Edit task list</p>
                <div className="flex items-center gap-1">
                  <button onClick={save} disabled={saving} className="text-xs font-semibold disabled:opacity-40" style={{ color: "var(--color-accent)" }}>Save</button>
                  <button onClick={() => setEditing(false)} className="text-xs opacity-40 ml-2">Cancel</button>
                </div>
              </div>
              <div className="space-y-3">
                <input className="input" value={draft.name || ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                <textarea className="input" rows={2} value={draft.description || ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
                <div>
                  <label className="text-[11px] font-medium opacity-60 mb-1 block">This list depends on</label>
                  <DependencyPicker
                    tasks={tasks}
                    taskLists={taskLists}
                    selected={draft.dependencies || []}
                    onChange={(deps2) => setDraft({ ...draft, dependencies: deps2 })}
                    selfType="list"
                    selfId={taskList._id}
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <ClipboardList className="h-4 w-4 opacity-40 flex-shrink-0" />
                  <h1 className="text-lg font-bold break-words min-w-0">{taskList.name}</h1>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={startEdit} className="p-1.5 opacity-40 hover:opacity-80"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => setDeleting(true)} className="p-1.5 opacity-40 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              {taskList.description && <p className="text-sm opacity-60 mb-2 break-words">{taskList.description}</p>}
              <p className="text-xs opacity-40">{listTasks.length === 0 ? "No tasks yet" : `${doneCount}/${listTasks.length} done`}</p>

              {blockedDeps.length > 0 && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-2 mt-3 flex items-start gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-700">Blocked by: {blockedDeps.map((d) => d.label).join(", ")}</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-bold uppercase tracking-wide opacity-50">Tasks in this list</h2>
          <button onClick={() => setAddingTask(true)} className="btn-primary text-xs">
            <Plus className="h-3.5 w-3.5" /> Add task
          </button>
        </div>

        {listTasks.length === 0 ? (
          <p className="text-xs opacity-40 italic">No tasks in this list yet.</p>
        ) : (
          <div className="space-y-2">
            {listTasks.map((t) => (
              <TaskRow key={t._id} task={t} users={users} teams={teams} tags={tags} blocked={resolveDependencies(t, tasks, taskLists).some((d) => !d.done)} />
            ))}
          </div>
        )}
      </div>

      {addingTask && (
        <TaskFormModal
          title={`Add task to "${taskList.name}"`}
          onClose={() => setAddingTask(false)}
          onSave={createTask}
          users={users}
          teams={teams}
          tags={tags}
          onTagCreated={(tag) => setTags((prev) => [...prev, tag])}
          tasks={tasks}
          taskLists={taskLists}
          fixedTaskListId={taskList._id}
        />
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
          <div className="card w-full max-w-sm p-5 max-h-full overflow-y-auto">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-9 w-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
              <p className="text-sm font-bold break-words min-w-0">Delete "{taskList.name}"?</p>
            </div>
            <p className="text-xs opacity-60 leading-relaxed mb-5">
              This will permanently delete the list and all {listTasks.length} task{listTasks.length === 1 ? "" : "s"} in it. This action cannot be undone.
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
