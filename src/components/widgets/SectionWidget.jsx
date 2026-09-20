"use client";

// A section is just a full-width heading used to visually group the tiles
// beneath it - no data, purely a layout aid.
export function SectionWidgetDisplay({ config }) {
  return (
    <div className="py-1">
      <p className="text-sm font-bold tracking-tight">{config?.title || "Section"}</p>
      <div className="h-px mt-2" style={{ background: "var(--color-border)" }} />
    </div>
  );
}

export function SectionWidgetForm({ config, onChange }) {
  return (
    <input
      className="input"
      placeholder="Section title (e.g. Safety)"
      value={config?.title || ""}
      onChange={(e) => onChange({ title: e.target.value })}
    />
  );
}
