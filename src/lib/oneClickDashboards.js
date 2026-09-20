// Rule-based (not LLM) generation for the one-click tier-board flow. Given a
// Hoshin plan, produces the widget payloads for three dashboards - T1 Daily,
// T2 Weekly, T3 Monthly - each carrying Safety/Quality/Throughput/People/Cost
// tiles, keyword-matched to the plan's metrics where possible.
import { CATEGORY_KEYWORDS } from "./hoshinAutoLink";

const CATEGORIES = ["Safety", "Quality", "Throughput", "People", "Cost"];

function matchMetric(metrics, category) {
  const keywords = CATEGORY_KEYWORDS[category];
  return metrics.find((m) => keywords.some((k) => m.text.toLowerCase().includes(k))) || null;
}

function kpiTile(category, metric, displayMode, plan) {
  return {
    type: "kpi",
    title: "",
    config: {
      label: metric ? metric.text : `${category} (not yet linked to a Hoshin metric)`,
      category,
      displayMode,
      source: "manual",
      target: metric?.target || "",
      unit: "",
      value: "",
      history: [],
      hoshinLink: metric
        ? { planId: plan._id, planName: plan.name, itemType: "metric", itemId: metric._id, itemText: metric.text }
        : null,
    },
  };
}

function sectionTile(title) {
  return { type: "section", title: "", config: { title } };
}

function timerTile(label, durationMinutes) {
  return { type: "timer", title: "", config: { label, durationMinutes } };
}

function noteTile(title, text) {
  return { type: "note", title, config: { text } };
}

function categoryTiles(plan, displayMode) {
  const metrics = plan.metrics || [];
  return CATEGORIES.map((category) => kpiTile(category, matchMetric(metrics, category), displayMode, plan));
}

export function generateTierDashboards(plan) {
  const metrics = plan.metrics || [];
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
