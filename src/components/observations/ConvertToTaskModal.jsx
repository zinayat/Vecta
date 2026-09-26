"use client";

import { useState } from "react";
import { X } from "lucide-react";
import UserMultiPicker from "../tasks/UserMultiPicker";

// Kicks off the "observation becomes a task" process - the resulting task
// carries over the observation's own text (as description) and tags
// automatically, so this only needs to collect what a task requires that
// an observation doesn't have yet: a short title, and optionally who it's
// assigned to and when it's due. Everything from here on (status, RACI,
// recurrence, dependencies...) is managed on the task itself.
export default function ConvertToTaskModal({ observation, users, teams, onConvert, onClose }) {
  const [title, setTitle] = useState((observation.text || "").slice(0, 60));
  const [dueDate, setDueDate] = useState("");
  const [assigneeUserIds, setAssigneeUserIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function convert() {
    if (!title.trim()) {
      setError("Give the task a title");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onConvert({ title: title.trim(), dueDate, assigneeUserIds });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
      <div className="card w-full max-w-md p-5 max-h-full overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold">Convert to task</p>
          <button onClick={onClose} className="opacity-40 hover:opacity-80"><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-medium opacity-60 mb-1 block">Task title</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="text-[11px] font-medium opacity-60 mb-1 block">Due date</label>
            <input type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div>
            <label className="text-[11px] font-medium opacity-60 mb-1 block">Assigned to (Responsible)</label>
            <UserMultiPicker users={users} selectedIds={assigneeUserIds} onChange={setAssigneeUserIds} />
          </div>
          <p className="text-[10px] opacity-35">The observation's own text and tags carry over automatically.</p>
        </div>

        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        <button onClick={convert} disabled={saving} className="btn-primary w-full mt-3 disabled:opacity-50">
          {saving ? "Converting..." : "Convert to task"}
        </button>
      </div>
    </div>
  );
}
