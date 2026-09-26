"use client";

// Plain multi-select checkbox list, generic over whatever's being picked
// (teams, people, processes) - reused across the Process designer and the
// Operations Plan assignment editor instead of writing a near-identical
// list for each entity type.
export default function EntityChecklist({ items, selectedIds, onChange, getLabel, getSublabel, emptyLabel }) {
  const selected = selectedIds || [];

  function toggle(id) {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  }

  if (!items || items.length === 0) {
    return <p className="text-[11px] opacity-40 italic">{emptyLabel || "Nothing to pick from yet."}</p>;
  }

  return (
    <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
      {items.map((item) => (
        <label key={item._id} className="flex items-center gap-1.5 text-xs cursor-pointer">
          <input type="checkbox" checked={selected.includes(item._id)} onChange={() => toggle(item._id)} />
          <span className="truncate">{getLabel(item)}</span>
          {getSublabel && <span className="text-[10px] opacity-40 flex-shrink-0">{getSublabel(item)}</span>}
        </label>
      ))}
    </div>
  );
}
