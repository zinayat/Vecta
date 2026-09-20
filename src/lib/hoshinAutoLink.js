// Rule-based (not LLM) matching between a KPI tile and a Hoshin plan's
// content - metrics, annual objectives, long-term objectives, and
// improvement priorities all count as candidate "outcomes/items" to link
// against, not just the Metrics list.

export const CATEGORY_KEYWORDS = {
  Safety: ["safety", "incident", "injury", "accident", "near miss", "ehs"],
  Quality: ["quality", "defect", "reject", "scrap", "ppm", "first pass", "fpy", "complaint", "return"],
  Throughput: ["throughput", "output", "production", "otd", "on-time", "on time", "delivery", "cycle time", "efficiency", "oee", "capacity", "volume"],
  People: ["people", "team", "engagement", "turnover", "attendance", "training", "headcount", "absentee", "retention", "morale"],
  Cost: ["cost", "budget", "spend", "expense", "roi", "margin", "saving", "waste"],
};

const ITEM_TYPE_LABEL = {
  metric: "Metric",
  annualObjective: "Annual Objective",
  longTermObjective: "Long-Term Objective",
  improvementPriority: "Improvement Priority",
};

export function itemTypeLabel(type) {
  return ITEM_TYPE_LABEL[type] || type;
}

// Flattens every linkable item across a set of Hoshin plans into one list,
// each carrying enough context to display and to jump back to its plan.
// Reads the Breakthrough Objective -> Annual Objective -> Strategy cascade
// (the primary structure since the spreadsheet-table redesign) rather than
// the old independent flat lists.
export function buildHoshinCorpus(plans) {
  const items = [];
  for (const plan of plans || []) {
    for (const bo of plan.breakthroughObjectives || []) {
      items.push({ planId: plan._id, planName: plan.name, itemType: "longTermObjective", itemId: bo._id, text: bo.text, target: "" });
      for (const ao of bo.annualObjectives || []) {
        items.push({ planId: plan._id, planName: plan.name, itemType: "annualObjective", itemId: ao._id, text: ao.text, target: "" });
        for (const s of ao.strategies || []) {
          items.push({ planId: plan._id, planName: plan.name, itemType: "improvementPriority", itemId: s._id, text: s.text, target: s.target || "" });
        }
      }
    }
  }
  return items;
}

function normalize(text) {
  return (text || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
}

function wordOverlapScore(a, b) {
  if (!a.length || !b.length) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let shared = 0;
  for (const w of setA) if (setB.has(w)) shared++;
  return shared / Math.max(setA.size, setB.size);
}

const MIN_CONFIDENCE = 0.2;

// Finds the best candidate item for a KPI tile's label (and optional SQDCP
// category), or null if nothing scores above the confidence threshold.
export function suggestHoshinLink(label, category, corpus) {
  const labelWords = normalize(label);
  const categoryKeywords = category ? CATEGORY_KEYWORDS[category] || [] : [];
  const labelLower = (label || "").toLowerCase().trim();

  let best = null;
  for (const item of corpus) {
    const itemWords = normalize(item.text);
    let score = wordOverlapScore(labelWords, itemWords);
    const itemLower = item.text.toLowerCase();

    if (labelLower && (itemLower.includes(labelLower) || labelLower.includes(itemLower))) score += 0.3;
    if (categoryKeywords.some((k) => itemLower.includes(k))) score += 0.4;

    if (!best || score > best.score) best = { ...item, score };
  }
  return best && best.score >= MIN_CONFIDENCE ? best : null;
}
