// Vecta Live's conversation script - a fixed decision tree, not an LLM.
// Same honest approach as every other "AI-assisted" tool in Vecta: it
// feels like talking to an agent (one question at a time, branches by
// project type) but there's no model behind it, just a scripted flow that
// writes its answers straight into the Project shape. Each step's `path`
// is a dot path into the answers object the chat UI builds up; the final
// step turns that into the POST /api/projects payload.

export const CATEGORIES = [
  { key: "CapEx", label: "CapEx / Capital Request", blurb: "New equipment, capital spend, an ROI-justified investment" },
  { key: "Improvement", label: "Improvement / Kaizen", blurb: "Incremental process or performance improvement" },
  { key: "ProblemSolving", label: "Problem-Solving", blurb: "Root-cause a specific issue or defect" },
  { key: "Innovation", label: "Innovation", blurb: "A new idea, concept, or capability worth exploring" },
];

// Each category's pertinent questions, in order, before the shared
// questions (owner, success measure, plan link) every project gets asked.
const CATEGORY_QUESTIONS = {
  CapEx: [
    { path: "a3.background", prompt: "What are you requesting this capital for?", placeholder: "e.g. Replace the aging CNC on Line 2" },
    { path: "capex.justification", prompt: "What's the business justification - why this spend, why now?", textarea: true },
    { path: "a3.goal", prompt: "What's the target outcome once this is approved and running?" },
    { path: "capex.budgetRequested", prompt: "How much budget are you requesting? Just the number is fine.", numeric: true },
    { path: "capex.expectedROI", prompt: "What's the expected ROI or payback period?", placeholder: "e.g. 18 months, 22% IRR" },
  ],
  Improvement: [
    { path: "a3.currentCondition", prompt: "What's the current situation or performance gap?", textarea: true },
    { path: "a3.goal", prompt: "What's your target condition - what does success look like?" },
    { path: "a3.rootCause", prompt: "What's driving the gap, if you already know?", textarea: true },
    { path: "a3.countermeasures", prompt: "What improvement are you planning to make?", textarea: true },
  ],
  ProblemSolving: [
    { path: "a3.background", prompt: "Why does this problem matter - what's the business impact?", textarea: true },
    { path: "a3.currentCondition", prompt: "What's happening today? Give me the facts.", textarea: true },
    { path: "a3.goal", prompt: "What's the target condition once this is fixed?" },
    { path: "a3.rootCause", prompt: "What do you suspect is the root cause? (5 Whys, fishbone, whatever you've got)", textarea: true },
  ],
  Innovation: [
    { path: "a3.background", prompt: "What's the opportunity or idea you're exploring?", textarea: true },
    { path: "a3.goal", prompt: "What would success look like if this idea works out?" },
    { path: "a3.countermeasures", prompt: "What's your initial concept or approach?", textarea: true },
    { path: "a3.implementationPlan", prompt: "What's the first step to test or validate this?" },
  ],
};

const SHARED_QUESTIONS_BEFORE_MEASURE = [
  { path: "ownerName", prompt: "Who's driving this project?", placeholder: "Name" },
];

const MEASURE_QUESTION = { path: "successMeasure.label", prompt: "What's the one metric that tells you this worked?", placeholder: "e.g. Defect Rate, Cycle Time, Cost Savings" };
const TARGET_QUESTION = { path: "successMeasure.target", prompt: "What target are you aiming for? (skip if you're not sure yet)", optional: true };

// The full step list for a category - the chat UI just walks this array.
export function stepsForCategory(category) {
  return [
    ...CATEGORY_QUESTIONS[category],
    ...SHARED_QUESTIONS_BEFORE_MEASURE,
    MEASURE_QUESTION,
    TARGET_QUESTION,
  ];
}

export function categoryLabel(key) {
  return CATEGORIES.find((c) => c.key === key)?.label || key;
}

// CapEx is the only category that still needs the separate financial
// shape (type: "CapEx") for existing filters/widgets elsewhere in the app
// that key off it - everything else is type: "A3". Every category still
// gets the full A3 canvas either way.
export function projectTypeForCategory(category) {
  return category === "CapEx" ? "CapEx" : "A3";
}

// Writes a value at a dot path ("a3.background") into a shallow-nested
// answers object, without mutating the input.
export function setPath(obj, path, value) {
  const [head, ...rest] = path.split(".");
  if (rest.length === 0) return { ...obj, [head]: value };
  return { ...obj, [head]: setPath(obj[head] || {}, rest.join("."), value) };
}
