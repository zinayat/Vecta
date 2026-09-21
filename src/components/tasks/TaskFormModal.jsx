"use client";

import { useState } from "react";
import { X } from "lucide-react";
import TaskForm from "./TaskForm";

// Same fixed-overlay-with-internal-scroll shape as AddWidgetModal - a task
// with RACI, tags, and dependencies is a long form, so the dialog caps
// itself to the screen and scrolls internally rather than spilling past
// the top and bottom of it.
export default function TaskFormModal({ title, initialValue, onSave, onClose, ...formProps }) {
  const [value, setValue] = useState(initialValue || { status: "notStarted" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (!value.title?.trim()) {
      setError("Title is required");
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
      <div className="card w-full max-w-md p-5 max-h-full overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold">{title}</p>
          <button onClick={onClose} className="opacity-40 hover:opacity-80"><X className="h-4 w-4" /></button>
        </div>

        <TaskForm value={value} onChange={setValue} {...formProps} />

        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        <button onClick={save} disabled={saving} className="btn-primary w-full mt-3 disabled:opacity-50">
          {saving ? "Saving..." : "Save task"}
        </button>
      </div>
    </div>
  );
}
