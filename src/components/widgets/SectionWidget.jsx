"use client";

// A section is just a full-width heading used to visually group the tiles
// beneath it - no data, purely a layout aid. Its accent color is optional -
// unset falls back to the theme's default border/text color.
export function SectionWidgetDisplay({ config }) {
  const color = config?.color || null;
  return (
    <div className="py-1" style={color ? { borderLeft: `3px solid ${color}`, paddingLeft: "0.75rem" } : undefined}>
      <p className="text-sm font-bold tracking-tight" style={color ? { color } : undefined}>{config?.title || "Section"}</p>
      <div className="h-px mt-2" style={{ background: color || "var(--color-border)" }} />
    </div>
  );
}

const SECTION_COLOR_PRESETS = ["#dc2626", "#2563eb", "#16a34a", "#9333ea", "#d97706", "#64748b"];

export function SectionWidgetForm({ config, onChange }) {
  const c = config || {};
  return (
    <div className="space-y-2">
      <input
        className="input"
        placeholder="Section title (e.g. Safety)"
        value={c.title || ""}
        onChange={(e) => onChange({ ...c, title: e.target.value })}
      />
      <div>
        <label className="text-[11px] font-medium opacity-60 mb-1 block">Accent color</label>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onChange({ ...c, color: "" })}
            className="h-6 w-6 rounded-full border-2 flex-shrink-0"
            style={{ borderColor: !c.color ? "var(--color-accent)" : "var(--color-border)", background: "var(--color-bg)" }}
            title="Default"
          />
          {SECTION_COLOR_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onChange({ ...c, color: preset })}
              className="h-6 w-6 rounded-full border-2 flex-shrink-0"
              style={{ background: preset, borderColor: c.color === preset ? "var(--color-text)" : "transparent" }}
              title={preset}
            />
          ))}
          <input
            type="color"
            className="h-6 w-8 rounded cursor-pointer border-0 flex-shrink-0"
            value={c.color || "#64748b"}
            onChange={(e) => onChange({ ...c, color: e.target.value })}
            title="Custom color"
          />
        </div>
      </div>
    </div>
  );
}
