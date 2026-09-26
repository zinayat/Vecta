// A dashboard has no real nesting - a "section" is just a Section-type
// widget acting as a full-width divider, and everything between one and
// the next (or the end of the board) reads as "that section's content."
// These two helpers are the one place that boundary gets computed, shared
// by AddWidgetModal (to default the "which section?" picker) and the
// dashboard page (to actually insert a new widget in the right spot).

// Null means "no section" - the content before the first Section widget
// (or the whole board, if there are no sections at all).
export function sectionIdForIndex(widgets, index) {
  let current = null;
  for (let i = 0; i < index; i++) {
    if (widgets[i].type === "section") current = widgets[i]._id;
  }
  return current;
}

// The [start, end) index range a section's content occupies - start is
// right after the section header itself (or 0, for "no section"), end is
// the next Section widget's index (or the array length).
export function segmentBounds(widgets, sectionId) {
  if (!sectionId) {
    const firstSectionIdx = widgets.findIndex((w) => w.type === "section");
    return { start: 0, end: firstSectionIdx === -1 ? widgets.length : firstSectionIdx };
  }
  const startIdx = widgets.findIndex((w) => w._id === sectionId);
  if (startIdx === -1) return { start: 0, end: widgets.length };
  let end = widgets.length;
  for (let i = startIdx + 1; i < widgets.length; i++) {
    if (widgets[i].type === "section") { end = i; break; }
  }
  return { start: startIdx + 1, end };
}
