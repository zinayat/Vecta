"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";

// A fast "type a title, hit Enter" way to build up a list's items -
// doesn't ask for anything beyond a title, since the point is speed; an
// item that needs its own dates/assignees/RACI can always be opened and
// filled in afterward. `items` is a plain list of {title} the caller
// owns - it's used both for a brand-new list's not-yet-saved draft items
// (parent holds them in local state) and for adding real tasks straight
// to an already-saved list (parent's onAdd posts to the API immediately).
export default function QuickAddItems({ items, onAdd, onRemove, placeholder }) {
  const [text, setText] = useState("");

  function submit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd(text.trim());
    setText("");
  }

  return (
    <div className="space-y-1.5">
      {(items || []).length > 0 && (
        <div className="space-y-1">
          {items.map((item, i) => (
            <div key={i} className="flex items-center justify-between gap-2 rounded-lg border px-2 py-1.5 text-xs" style={{ borderColor: "var(--color-border)" }}>
              <span className="truncate">{item.title}</span>
              <button type="button" onClick={() => onRemove(i)} className="p-0.5 opacity-40 hover:text-red-500 flex-shrink-0"><X className="h-3 w-3" /></button>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={submit} className="flex items-center gap-1.5">
        <input className="input text-xs py-1.5 flex-1 min-w-0" placeholder={placeholder || "Add an item and press Enter"} value={text} onChange={(e) => setText(e.target.value)} />
        <button type="submit" className="p-1.5 rounded-lg opacity-50 hover:opacity-90 transition flex-shrink-0"><Plus className="h-3.5 w-3.5" /></button>
      </form>
    </div>
  );
}
