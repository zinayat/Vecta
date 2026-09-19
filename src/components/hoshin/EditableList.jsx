"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

export default function EditableList({ label, hint, items, onAdd, onRemove, onUpdateText, extraFields, readOnly }) {
  const [draft, setDraft] = useState("");

  function submitAdd(e) {
    e.preventDefault();
    if (!draft.trim()) return;
    onAdd(draft.trim());
    setDraft("");
  }

  return (
    <div className="card p-4">
      <p className="text-xs font-bold uppercase tracking-wide opacity-50 mb-0.5">{label}</p>
      {hint && <p className="text-[11px] opacity-35 mb-3">{hint}</p>}

      <div className="space-y-1.5 mb-2">
        {items.length === 0 && <p className="text-xs opacity-35 italic">Nothing added yet</p>}
        {items.map((item) =>
          readOnly ? (
            <p key={item._id} className="text-xs py-1.5 px-1">{item.text}</p>
          ) : (
            <div key={item._id} className="flex items-start gap-2 group">
              <input
                className="input text-xs py-1.5 flex-1"
                defaultValue={item.text}
                onBlur={(e) => { if (e.target.value.trim() && e.target.value.trim() !== item.text) onUpdateText(item._id, e.target.value.trim()); }}
              />
              {extraFields?.(item)}
              <button onClick={() => onRemove(item._id)} className="p-1.5 opacity-0 group-hover:opacity-50 hover:!opacity-90 hover:text-red-500 transition flex-shrink-0">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )
        )}
      </div>

      {!readOnly && (
        <form onSubmit={submitAdd} className="flex items-center gap-2">
          <input
            className="input text-xs py-1.5"
            placeholder={`Add ${label.toLowerCase()}...`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button type="submit" className="p-1.5 rounded-lg opacity-50 hover:opacity-90 transition flex-shrink-0">
            <Plus className="h-4 w-4" />
          </button>
        </form>
      )}
    </div>
  );
}
