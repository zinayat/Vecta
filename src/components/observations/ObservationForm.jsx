"use client";

import TagPicker from "../tasks/TagPicker";
import ImageUploadField from "./ImageUploadField";
import DashboardPicker from "./DashboardPicker";

// Shared between the "new observation" flow and editing an existing one -
// date/text/tags/photos are locked once an observation has been converted
// to a task (readOnlyContent), but which boards it shows on stays
// editable regardless, since that's just a display preference.
export default function ObservationForm({ value, onChange, tags, onTagCreated, readOnlyContent }) {
  const v = value || {};
  function set(field) {
    return (val) => onChange({ ...v, [field]: val });
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[11px] font-medium opacity-60 mb-1 block">Date observed</label>
        <input type="date" className="input" value={v.date || ""} onChange={(e) => set("date")(e.target.value)} disabled={readOnlyContent} />
      </div>

      <div>
        <label className="text-[11px] font-medium opacity-60 mb-1 block">What did you see?</label>
        <textarea
          className="input min-h-20"
          placeholder="Describe what was observed..."
          value={v.text || ""}
          onChange={(e) => set("text")(e.target.value)}
          disabled={readOnlyContent}
        />
      </div>

      <div>
        <label className="text-[11px] font-medium opacity-60 mb-1 block">Photos</label>
        <ImageUploadField images={v.images} onChange={set("images")} readOnly={readOnlyContent} />
      </div>

      <div>
        <label className="text-[11px] font-medium opacity-60 mb-1 block">Tags</label>
        {readOnlyContent ? (
          <div className="flex flex-wrap gap-1.5">
            {(tags || []).filter((t) => (v.tagIds || []).some((id) => String(id) === String(t._id))).map((t) => (
              <span key={t._id} className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: `color-mix(in srgb, ${t.color} 14%, transparent)`, color: t.color }}>{t.name}</span>
            ))}
            {(v.tagIds || []).length === 0 && <p className="text-[11px] opacity-35 italic">No tags</p>}
          </div>
        ) : (
          <TagPicker tags={tags} selectedIds={v.tagIds} onChange={set("tagIds")} onTagCreated={onTagCreated} />
        )}
      </div>

      <div>
        <label className="text-[11px] font-medium opacity-60 mb-1 block">Show on these dashboards</label>
        <DashboardPicker selectedIds={v.dashboardIds} onChange={set("dashboardIds")} />
      </div>
    </div>
  );
}
