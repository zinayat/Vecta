"use client";

import { useEffect, useState } from "react";
import { Settings as SettingsIcon, Tag as TagIcon, Plus, Check, X, Pencil, Trash2, Loader2, AlertTriangle } from "lucide-react";
import AppShell from "../../components/AppShell";
import { apiFetch } from "../../lib/apiClient";
import { TAG_COLOR_PRESETS } from "../../components/tasks/TagPicker";

// One place to create/rename/recolor/delete a tag, instead of only ever
// being able to create one inline from whatever form happened to need it
// first - tags are shared across Tasks, Task Lists, Observations, and Projects, so
// managing them shouldn't live inside any one of those modules.
export default function SettingsPage() {
  const [tags, setTags] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [taskLists, setTaskLists] = useState([]);
  const [observations, setObservations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(TAG_COLOR_PRESETS[0]);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  const [deletingTag, setDeletingTag] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  function loadAll() {
    setLoading(true);
    return Promise.all([
      apiFetch("/api/tags"),
      apiFetch("/api/tasks"),
      apiFetch("/api/task-lists"),
      apiFetch("/api/observations"),
      apiFetch("/api/projects"),
    ])
      .then(([tg, t, l, o, p]) => {
        setTags(tg.tags);
        setTasks(t.tasks);
        setTaskLists(l.taskLists);
        setObservations(o.observations);
        setProjects(p.projects);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadAll(); }, []);

  function usageCount(tagId) {
    const has = (item) => (item.tagIds || []).some((id) => String(id) === String(tagId));
    return tasks.filter(has).length + taskLists.filter(has).length + observations.filter(has).length + projects.filter(has).length;
  }

  async function createTag() {
    if (!newName.trim() || saving) return;
    setSaving(true);
    setError("");
    try {
      const { tag } = await apiFetch("/api/tags", { method: "POST", body: { name: newName.trim(), color: newColor } });
      setTags((prev) => [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
      setNewColor(TAG_COLOR_PRESETS[0]);
      setCreating(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(tag) {
    setEditingId(tag._id);
    setEditName(tag.name);
    setEditColor(tag.color);
  }

  async function saveEdit() {
    if (!editName.trim()) return;
    setSaving(true);
    setError("");
    try {
      const { tag } = await apiFetch(`/api/tags/${editingId}`, { method: "PUT", body: { name: editName.trim(), color: editColor } });
      setTags((prev) => prev.map((t) => (t._id === tag._id ? tag : t)).sort((a, b) => a.name.localeCompare(b.name)));
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    setDeleteBusy(true);
    try {
      await apiFetch(`/api/tags/${deletingTag._id}`, { method: "DELETE" });
      setTags((prev) => prev.filter((t) => t._id !== deletingTag._id));
      setDeletingTag(null);
      // Usage counts elsewhere on this page are now stale (the tag was
      // pulled off every task/list/observation server-side) - reload
      // rather than let a leftover "used 3 times" badge linger.
      loadAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto pb-10">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--color-primary) 10%, transparent)" }}>
            <SettingsIcon className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
          </div>
          <div>
            <h1 className="text-lg font-bold">Settings</h1>
            <p className="text-xs opacity-50">Application-wide settings, shared across every module</p>
          </div>
        </div>

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        <div className="card p-5">
          <div className="flex items-center gap-1.5 mb-1">
            <TagIcon className="h-4 w-4 opacity-50" />
            <p className="text-sm font-bold">Tags</p>
          </div>
          <p className="text-xs opacity-50 mb-4">
            Create, rename, recolor, or delete tags here - the same set is used across Tasks, Task Lists, Observations, and Projects, wherever you see a tag picker.
          </p>

          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin opacity-40" /></div>
          ) : (
            <div className="space-y-1.5">
              {tags.length === 0 && !creating && <p className="text-xs opacity-40 italic mb-2">No tags yet.</p>}

              {tags.map((tag) => {
                const count = usageCount(tag._id);
                const isEditing = editingId === tag._id;
                return (
                  <div key={tag._id} className="flex items-center gap-2 rounded-lg border px-2.5 py-2" style={{ borderColor: "var(--color-border)" }}>
                    {isEditing ? (
                      <>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {TAG_COLOR_PRESETS.map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setEditColor(preset)}
                              className="h-5 w-5 rounded-full border-2 flex-shrink-0"
                              style={{ background: preset, borderColor: editColor === preset ? "var(--color-text)" : "transparent" }}
                            />
                          ))}
                        </div>
                        <input className="input text-xs py-1 flex-1 min-w-0" value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
                        <button onClick={saveEdit} disabled={saving} className="p-1 text-emerald-600 flex-shrink-0 disabled:opacity-40"><Check className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setEditingId(null)} className="p-1 opacity-40 flex-shrink-0"><X className="h-3.5 w-3.5" /></button>
                      </>
                    ) : (
                      <>
                        <span
                          className="rounded-full px-2 py-0.5 text-[11px] font-medium flex-shrink-0"
                          style={{ background: `color-mix(in srgb, ${tag.color} 14%, transparent)`, color: tag.color }}
                        >
                          {tag.name}
                        </span>
                        <span className="text-[11px] opacity-40 flex-1 min-w-0">
                          {count === 0 ? "Not used yet" : `Used ${count} time${count === 1 ? "" : "s"}`}
                        </span>
                        <button onClick={() => startEdit(tag)} className="p-1 opacity-40 hover:opacity-80 flex-shrink-0"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setDeletingTag(tag)} className="p-1 opacity-40 hover:text-red-500 flex-shrink-0"><Trash2 className="h-3.5 w-3.5" /></button>
                      </>
                    )}
                  </div>
                );
              })}

              {creating ? (
                <div className="flex items-center gap-2 rounded-lg border p-2" style={{ borderColor: "var(--color-border)" }}>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {TAG_COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setNewColor(preset)}
                        className="h-5 w-5 rounded-full border-2 flex-shrink-0"
                        style={{ background: preset, borderColor: newColor === preset ? "var(--color-text)" : "transparent" }}
                      />
                    ))}
                  </div>
                  <input className="input text-xs py-1 flex-1 min-w-0" placeholder="Tag name" value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus />
                  <button onClick={createTag} disabled={saving || !newName.trim()} className="text-[11px] font-semibold flex-shrink-0 disabled:opacity-40" style={{ color: "var(--color-accent)" }}>Add</button>
                  <button onClick={() => { setCreating(false); setNewName(""); }} className="text-[11px] opacity-40 flex-shrink-0">Cancel</button>
                </div>
              ) : (
                <button onClick={() => setCreating(true)} className="inline-flex items-center gap-1 text-xs font-semibold mt-1" style={{ color: "var(--color-accent)" }}>
                  <Plus className="h-3.5 w-3.5" /> New tag
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {deletingTag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
          <div className="card w-full max-w-sm p-5 max-h-full overflow-y-auto">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-9 w-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
              <p className="text-sm font-bold break-words min-w-0">Delete "{deletingTag.name}"?</p>
            </div>
            <p className="text-xs opacity-60 leading-relaxed mb-5">
              {usageCount(deletingTag._id) > 0
                ? `This tag is used ${usageCount(deletingTag._id)} time${usageCount(deletingTag._id) === 1 ? "" : "s"} across Tasks, Task Lists, Observations, and Projects - it will be removed from all of them.`
                : "This tag isn't used anywhere yet."} This action cannot be undone.
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setDeletingTag(null)} disabled={deleteBusy} className="flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition hover:bg-black/[0.03]" style={{ borderColor: "var(--color-border)" }}>
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
