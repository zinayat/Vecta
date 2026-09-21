"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { apiFetch } from "../../lib/apiClient";

const TAG_COLOR_PRESETS = ["#dc2626", "#2563eb", "#16a34a", "#9333ea", "#d97706", "#64748b"];

// Tags are company-wide and user-created (not fixed like a KPI category),
// so this both picks from existing tags and lets a new one be created
// inline without leaving the task form - the tag then shows up for every
// other task/list to filter by too.
export default function TagPicker({ tags, selectedIds, onChange, onTagCreated }) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(TAG_COLOR_PRESETS[0]);
  const [saving, setSaving] = useState(false);

  const selected = selectedIds || [];

  function toggle(id) {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  }

  async function createTag() {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      const { tag } = await apiFetch("/api/tags", { method: "POST", body: { name: name.trim(), color } });
      onTagCreated(tag);
      onChange([...selected, tag._id]);
      setName("");
      setCreating(false);
    } catch {
      // Tag creation failing is non-critical to the task itself - the
      // form stays open so the user can just retry.
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {(tags || []).map((t) => {
          const active = selected.includes(t._id);
          return (
            <button
              key={t._id}
              type="button"
              onClick={() => toggle(t._id)}
              className="rounded-full px-2 py-0.5 text-[11px] font-medium border transition"
              style={{
                background: active ? t.color : "transparent",
                color: active ? "#fff" : t.color,
                borderColor: t.color,
              }}
            >
              {t.name}
            </button>
          );
        })}
        {!creating && (
          <button type="button" onClick={() => setCreating(true)} className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-medium opacity-50 hover:opacity-90 border border-dashed" style={{ borderColor: "var(--color-border)" }}>
            <Plus className="h-3 w-3" /> New tag
          </button>
        )}
      </div>

      {creating && (
        <div className="flex items-center gap-1.5 rounded-lg border p-1.5" style={{ borderColor: "var(--color-border)" }}>
          <input className="input text-xs py-1 flex-1 min-w-0" placeholder="Tag name" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="flex items-center gap-1 flex-shrink-0">
            {TAG_COLOR_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setColor(preset)}
                className="h-5 w-5 rounded-full border-2 flex-shrink-0"
                style={{ background: preset, borderColor: color === preset ? "var(--color-text)" : "transparent" }}
              />
            ))}
          </div>
          <button type="button" onClick={createTag} disabled={saving || !name.trim()} className="text-[11px] font-semibold flex-shrink-0 disabled:opacity-40" style={{ color: "var(--color-accent)" }}>Add</button>
          <button type="button" onClick={() => { setCreating(false); setName(""); }} className="text-[11px] opacity-40 flex-shrink-0">Cancel</button>
        </div>
      )}
    </div>
  );
}
