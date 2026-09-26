"use client";

// A multi-select tag filter - toggle any number of tags on, and an item
// matches if it has at least one of them (matchesTagFilter below). Same
// toggle-chip interaction as TagPicker, but without its "create a new
// tag" affordance, which belongs to assigning tags, not filtering by
// them.
export default function TagFilterChips({ tags, selectedIds, onChange }) {
  const selected = selectedIds || [];
  if (!tags || tags.length === 0) return null;

  function toggle(id) {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((t) => {
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
    </div>
  );
}

// An empty filter (nothing selected) matches everything - "no filter
// applied" reads as "show all," same convention as the old single-select
// "All tags" option. Otherwise an item matches if it carries at least one
// of the selected tags (OR, not AND) - "quality OR safety" is what people
// mean by picking two tags to filter by, not "must have both."
export function matchesTagFilter(itemTagIds, selectedTagIds) {
  if (!selectedTagIds || selectedTagIds.length === 0) return true;
  return (itemTagIds || []).some((id) => selectedTagIds.includes(String(id)));
}
