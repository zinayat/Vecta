// Rule-based (not LLM) assistance for defining a KPI / success measure the
// same way everywhere it appears - Dashboards, Hoshin strategy rows, and
// Projects. Given a plain-language label, suggests how it's likely
// measured and which direction counts as "better," then can draft a
// "what success looks like" sentence from the structured result. Same
// honest approach as the rest of Vecta's "AI assisted" tools: keyword
// matching and templates, not a model call - there's no LLM configured.

export const MEASUREMENT_TYPES = ["Percentage", "Count", "Currency", "Duration", "Ratio"];

export const DEFAULT_UNITS = {
  Percentage: "%",
  Count: "",
  Currency: "$",
  Duration: "days",
  Ratio: "",
};

const LOWER_IS_BETTER_KEYWORDS = [
  "incident", "defect", "reject", "scrap", "downtime", "cost", "expense", "turnover",
  "absentee", "complaint", "error", "waste", "injury", "accident", "delay", "rework",
  "backlog", "churn", "variance", "overrun",
];

const PERCENTAGE_KEYWORDS = [
  "rate", "percentage", "%", "otd", "oee", "utilization", "efficiency", "engagement",
  "satisfaction", "uptime", "first pass", "fpy", "on-time", "on time", "compliance", "yield",
];

const CURRENCY_KEYWORDS = ["cost", "budget", "spend", "revenue", "margin", "saving", "expense", "roi", "price"];

const DURATION_KEYWORDS = ["time", "cycle time", "downtime", "duration", "lead time", "turnaround", "response time"];

const COUNT_KEYWORDS = ["count", "number of", "# of", "incidents", "volume", "units", "output", "quantity", "headcount", "defects"];

// Suggests measurementType + direction + a default unit from a KPI's label.
export function suggestKpiShape(label) {
  const lower = (label || "").toLowerCase();
  const direction = LOWER_IS_BETTER_KEYWORDS.some((k) => lower.includes(k)) ? "lowerIsBetter" : "higherIsBetter";

  let measurementType = "Count";
  if (PERCENTAGE_KEYWORDS.some((k) => lower.includes(k))) measurementType = "Percentage";
  else if (CURRENCY_KEYWORDS.some((k) => lower.includes(k))) measurementType = "Currency";
  else if (DURATION_KEYWORDS.some((k) => lower.includes(k))) measurementType = "Duration";
  else if (COUNT_KEYWORDS.some((k) => lower.includes(k))) measurementType = "Count";

  return { measurementType, direction, unit: DEFAULT_UNITS[measurementType] };
}

// Drafts a "what success looks like" sentence from the structured fields -
// the user can edit it afterward, this is just a starting point.
export function suggestSuccessDescription({ label, measurementType, direction, target, unit }) {
  if (!label?.trim()) return "";
  const unitSuffix = measurementType === "Percentage" ? "%" : unit ? ` ${unit}` : "";
  const comparison = direction === "lowerIsBetter" ? "at or below" : "at or above";
  if (!target) return `Success means "${label.trim()}" is trending in the right direction.`;
  return `Success means "${label.trim()}" stays ${comparison} ${target}${unitSuffix}.`;
}

// Whether a current value meets its target, accounting for direction -
// every KPI display (Dashboards, Hoshin, Projects) should use this rather
// than assuming higher is always better.
export function isOnTrack(value, target, direction) {
  const numValue = Number(value);
  const numTarget = Number(target);
  if (isNaN(numValue) || isNaN(numTarget)) return null;
  return direction === "lowerIsBetter" ? numValue <= numTarget : numValue >= numTarget;
}
