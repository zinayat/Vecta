// Rule-based (not LLM) generation for the one-click tier-board flow. Given a
// Hoshin plan, produces the widget payloads for three dashboards - T1 Daily,
// T2 Weekly, T3 Monthly - each carrying Safety/Quality/Cost/Delivery/People
// tiles, keyword-matched to the plan's strategies (Breakthrough -> Annual ->
// Strategy cascade) where possible.
import { CATEGORY_KEYWORDS, buildHoshinCorpus } from "./hoshinAutoLink";
import { CATEGORY_COLORS } from "../components/widgets/KpiWidget";

// Fixed SQDCP-style order, not alphabetical or insertion order - this is
// the sequence the tier-board reads top to bottom every time.
const CATEGORY_ORDER = ["Safety", "Quality", "Cost", "Throughput", "People"];

// "Throughput" is still the stored category value (matches CATEGORY_COLORS,
// the KPI Settings dropdown, and the Hoshin keyword matcher) - this only
// changes what the auto-generated section header is titled.
const CATEGORY_SECTION_LABELS = { Throughput: "Delivery/Throughput" };

function matchStrategy(plan, category) {
  const keywords = CATEGORY_KEYWORDS[category];
  const strategies = buildHoshinCorpus([plan]).filter((i) => i.itemType === "improvementPriority");
  return strategies.find((s) => keywords.some((k) => s.text.toLowerCase().includes(k))) || null;
}

function kpiTile(category, match, displayMode, plan) {
  return {
    type: "kpi",
    title: "",
    config: {
      label: match ? match.text : `${category} metric`,
      category,
      displayMode,
      source: "manual",
      target: match?.target || "",
      unit: "",
      value: "",
      history: [],
      // Full width under its own section header - with exactly one KPI
      // per category here, a narrow 1-column tile would leave the rest of
      // that row empty since the next item is another full-width section.
      size: 3,
      hoshinLink: match
        ? { planId: plan._id, planName: plan.name, itemType: "improvementPriority", itemId: match.itemId, itemText: match.text }
        : null,
    },
  };
}

function sectionTile(title, color) {
  return { type: "section", title: "", config: { title, color: color || "" } };
}

function timerTile(label, durationMinutes) {
  return { type: "timer", title: "", config: { label, durationMinutes } };
}

function noteTile(title, text) {
  return { type: "note", title, config: { text } };
}

// One colored section header per category, immediately followed by that
// category's own KPI tile - the tier board arrives pre-organized instead
// of leaving the user to add sections and drag tiles under them by hand.
function categoryTiles(plan, displayMode) {
  return CATEGORY_ORDER.flatMap((category) => [
    sectionTile(CATEGORY_SECTION_LABELS[category] || category, CATEGORY_COLORS[category]),
    kpiTile(category, matchStrategy(plan, category), displayMode, plan),
  ]);
}

export function generateTierDashboards(plan) {
  const base = { hoshinPlanId: plan._id, theme: "executive" };

  const t1 = {
    ...base,
    tier: "T1",
    name: `T1 Daily Meeting - ${plan.name}`,
    widgets: [
      sectionTile("Daily Operational Review"),
      timerTile("Daily Huddle", 15),
      ...categoryTiles(plan, "number"),
      noteTile("Notes", ""),
    ],
  };

  const t2 = {
    ...base,
    tier: "T2",
    name: `T2 Weekly Meeting - ${plan.name}`,
    widgets: [
      sectionTile("Weekly Review"),
      timerTile("Weekly Review", 30),
      ...categoryTiles(plan, "graph"),
      noteTile("Escalated Items from T1", "Log items escalated from the daily huddle here."),
    ],
  };

  const t3 = {
    ...base,
    tier: "T3",
    name: `T3 Monthly Meeting - ${plan.name}`,
    widgets: [
      sectionTile("Monthly KPI & Outcome Review"),
      timerTile("Monthly Review", 60),
      ...categoryTiles(plan, "graph"),
      sectionTile("Innovation & Project Status"),
      { type: "hoshinSummary", title: "", config: { hoshinPlanId: plan._id } },
      { type: "projectList", title: "Active Projects", config: { typeFilter: "All", statusFilter: "Active", limit: 8 } },
      noteTile("Notes", "Escalated items from T2, plus innovation and project status discussion."),
    ],
  };

  return [t1, t2, t3];
}
