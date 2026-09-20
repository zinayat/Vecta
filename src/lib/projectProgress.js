// Rule-based progress estimate for a project's A3 - not smart content
// analysis, just a length heuristic on each field (empty / short / longer),
// consistent with the rest of Vecta's honestly-labeled "not AI" helpers.
// Used on the Projects list to summarize where a project stands without
// opening it.
export const A3_SECTIONS = [
  { key: "background", label: "Background" },
  { key: "currentCondition", label: "Current Condition" },
  { key: "goal", label: "Goal" },
  { key: "rootCause", label: "Root Cause" },
  { key: "countermeasures", label: "Countermeasures" },
  { key: "implementationPlan", label: "Implementation Plan" },
  { key: "followUp", label: "Follow-Up" },
];

// A section under ~60 characters reads as a placeholder/fragment rather
// than a real answer - "in progress," not "not started" (there's
// something there) and not "completed" (it's too thin to be one).
const WIP_THRESHOLD = 60;

export function sectionStatus(text) {
  const len = (text || "").trim().length;
  if (len === 0) return "notStarted";
  if (len < WIP_THRESHOLD) return "wip";
  return "completed";
}

export function a3Progress(a3) {
  const sections = A3_SECTIONS.map((s) => ({ ...s, status: sectionStatus(a3?.[s.key]) }));
  const score = sections.reduce((sum, s) => sum + (s.status === "completed" ? 1 : s.status === "wip" ? 0.5 : 0), 0);
  const percent = Math.round((score / sections.length) * 100);
  return { sections, percent };
}
