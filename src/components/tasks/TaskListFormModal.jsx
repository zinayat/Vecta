"use client";

import { useState } from "react";
import { X } from "lucide-react";
import DependencyPicker from "./DependencyPicker";
import RecurrencePicker from "./RecurrencePicker";

export default function TaskListFormModal({ title, initialValue, onSave, onClose, tasks, taskLists, selfId }) {
  const [value, setValue] = useState(initialValue || {});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (!value.name?.trim()) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(value);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
      <div className="card w-full max-w-sm p-5 max-h-full overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold">{title}</p>
          <button onClick={onClose} className="opacity-40 hover:opacity-80"><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-medium opacity-60 mb-1 block">Name</label>
            <input className="input" placeholder="e.g. Plant startup task list" value={value.name || ""} onChange={(e) => setValue({ ...value, name: e.target.value })} />
          </div>
          <div>
            <label className="text-[11px] font-medium opacity-60 mb-1 block">Description (optional)</label>
            <textarea className="input" rows={2} value={value.description || ""} onChange={(e) => setValue({ ...value, description: e.target.value })} />
          </div>
          <div>
            <label className="text-[11px] font-medium opacity-60 mb-1 block">This list depends on (optional)</label>
            <DependencyPicker
              tasks={tasks}
              taskLists={taskLists}
              selected={value.dependencies || []}
              onChange={(deps) => setValue({ ...value, dependencies: deps })}
              selfType="list"
              selfId={selfId}
            />
          </div>
          <div>
            <label className="text-[11px] font-medium opacity-60 mb-1 block">Repeats</label>
            <RecurrencePicker value={value.recurrence} onChange={(recurrence) => setValue({ ...value, recurrence })} />
            <p className="text-[10px] opacity-40 mt-1">
              A fresh copy of this list, with every task currently in it, is created next time someone opens Tasks on or after it's due.
            </p>
          </div>
        </div>

        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        <button onClick={save} disabled={saving} className="btn-primary w-full mt-3 disabled:opacity-50">
          {saving ? "Saving..." : "Save list"}
        </button>
      </div>
    </div>
  );
}
