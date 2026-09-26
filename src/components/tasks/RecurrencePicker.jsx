"use client";

import { FREQUENCIES, FREQUENCY_LABELS } from "../../lib/recurrence";

// A task or list's own recurrence - only the "root" of a series actually
// carries this (see Task.js/TaskList.js); editing it on a clone just
// starts a brand new, independent series from that clone. Turning
// recurrence off clears its clock entirely rather than pausing it.
export default function RecurrencePicker({ value, onChange }) {
  const v = value || {};
  const frequency = v.frequency || "";

  return (
    <div className="space-y-1.5">
      <select className="input" value={frequency} onChange={(e) => onChange({ ...v, frequency: e.target.value || null })}>
        <option value="">Doesn't repeat</option>
        {FREQUENCIES.map((f) => <option key={f} value={f}>{FREQUENCY_LABELS[f]}</option>)}
      </select>
      {frequency && (
        <label className="flex items-center gap-1.5 text-xs opacity-70">
          <input type="checkbox" checked={v.active !== false} onChange={(e) => onChange({ ...v, active: e.target.checked })} />
          Active - uncheck to pause without losing the schedule
        </label>
      )}
    </div>
  );
}
