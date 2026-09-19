"use client";

export function NoteWidgetDisplay({ config }) {
  return <p className="text-sm whitespace-pre-wrap opacity-80">{config?.text || "Empty note"}</p>;
}

export function NoteWidgetForm({ config, onChange }) {
  return (
    <textarea
      className="input resize-none"
      rows={4}
      placeholder="Write a note for the team..."
      value={config?.text || ""}
      onChange={(e) => onChange({ text: e.target.value })}
    />
  );
}
