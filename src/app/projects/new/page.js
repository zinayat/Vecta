"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Sparkles, Send, SkipForward } from "lucide-react";
import AppShell from "../../../components/AppShell";
import { apiFetch } from "../../../lib/apiClient";
import { flattenHoshinTree } from "../../../lib/hoshinTree";
import { suggestKpiShape, suggestSuccessDescription } from "../../../lib/kpiBuilder";
import { CATEGORIES, categoryLabel, stepsForCategory, projectTypeForCategory, setPath } from "../../../lib/vectaLive";

// Vecta Live is a rule-based guided chat, not an LLM - the same honest
// "rule-based, not AI" approach as every other assisted tool in Vecta.
// It's a fixed decision tree (lib/vectaLive.js) walked one step at a
// time, styled as a conversation so building a project feels like
// talking it through rather than filling in a long form.
export default function NewProjectPage() {
  return (
    <Suspense fallback={<AppShell><div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin opacity-40" /></div></AppShell>}>
      <VectaLiveWizard />
    </Suspense>
  );
}

function VectaLiveWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi, I'm Vecta Live. Let's set up your project - what should we call it?" },
  ]);
  const [phase, setPhase] = useState("name"); // name -> category -> questions -> plan -> planStrategy -> summary
  const [answers, setAnswers] = useState({ name: "", ownerName: "", a3: {}, capex: {}, successMeasure: {} });
  const [category, setCategory] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [plans, setPlans] = useState([]);
  const [hoshinPlanId, setHoshinPlanId] = useState(searchParams.get("hoshinPlanId") || "");
  const [hoshinPriorityId, setHoshinPriorityId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    apiFetch("/api/hoshin").then((data) => setPlans(data.plans)).catch(() => setPlans([]));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, phase]);

  function say(text) {
    setMessages((m) => [...m, { from: "bot", text }]);
  }
  function userSay(text) {
    setMessages((m) => [...m, { from: "user", text }]);
  }

  const steps = category ? stepsForCategory(category) : [];
  const currentStep = phase === "questions" ? steps[stepIndex] : null;

  function submitName(e) {
    e.preventDefault();
    if (!inputValue.trim()) return;
    userSay(inputValue.trim());
    setAnswers((a) => ({ ...a, name: inputValue.trim() }));
    setInputValue("");
    say(`Got it - "${inputValue.trim()}". What kind of project is this?`);
    setPhase("category");
  }

  function pickCategory(key) {
    userSay(categoryLabel(key));
    setCategory(key);
    const firstStep = stepsForCategory(key)[0];
    say(firstStep.prompt);
    setPhase("questions");
    setStepIndex(0);
  }

  function advanceQuestion(rawValue) {
    const value = currentStep.numeric ? (rawValue.trim() === "" ? null : Number(rawValue)) : rawValue.trim();
    userSay(currentStep.optional && !rawValue.trim() ? "(skip)" : String(rawValue.trim() || "(skip)"));
    const nextAnswers = setPath(answers, currentStep.path, value);
    setAnswers(nextAnswers);
    setInputValue("");

    const nextIndex = stepIndex + 1;
    if (nextIndex < steps.length) {
      setStepIndex(nextIndex);
      say(steps[nextIndex].prompt);
      return;
    }

    // Rule-based enrichment, not a question - infer how the success
    // measure is likely tracked from its label, same logic the KPI
    // Builder uses everywhere else it appears.
    const label = nextAnswers.successMeasure?.label;
    let finalAnswers = nextAnswers;
    if (label?.trim()) {
      const shape = suggestKpiShape(label);
      const whatSuccessLooksLike = suggestSuccessDescription({ label, ...shape, target: nextAnswers.successMeasure?.target });
      finalAnswers = { ...nextAnswers, successMeasure: { ...nextAnswers.successMeasure, ...shape, whatSuccessLooksLike } };
      setAnswers(finalAnswers);
      say(`Noted - I'll track "${label}" as a ${shape.measurementType.toLowerCase()} metric, ${shape.direction === "lowerIsBetter" ? "lower is better" : "higher is better"} (rule-based on the name, not AI - you can change this later).`);
    }

    say("Should this link to a plan in Planning?");
    setPhase("plan");
  }

  function submitQuestion(e) {
    e.preventDefault();
    advanceQuestion(inputValue);
  }
  function skipQuestion() {
    advanceQuestion("");
  }

  function pickPlan(planId) {
    setHoshinPlanId(planId);
    if (!planId) {
      userSay("(skip)");
      say("All set - here's what I've got. Ready to create it?");
      setPhase("summary");
      return;
    }
    const plan = plans.find((p) => p._id === planId);
    userSay(plan?.name || "");
    const strategies = plan ? flattenHoshinTree(plan).strategies : [];
    if (strategies.length === 0) {
      say("All set - here's what I've got. Ready to create it?");
      setPhase("summary");
      return;
    }
    say("Which strategy or priority does it support?");
    setPhase("planStrategy");
  }

  function pickStrategy(strategyId) {
    setHoshinPriorityId(strategyId);
    const plan = plans.find((p) => p._id === hoshinPlanId);
    const strategy = plan ? flattenHoshinTree(plan).strategies.find((s) => s._id === strategyId) : null;
    userSay(strategy ? strategy.text : "(skip)");
    say("All set - here's what I've got. Ready to create it?");
    setPhase("summary");
  }

  async function createProject() {
    setSubmitting(true);
    setError("");
    try {
      const data = await apiFetch("/api/projects", {
        method: "POST",
        body: {
          name: answers.name,
          type: projectTypeForCategory(category),
          category,
          ownerName: answers.ownerName,
          hoshinPlanId: hoshinPlanId || null,
          hoshinPriorityId: hoshinPriorityId || null,
          a3: answers.a3,
          capex: answers.capex,
          successMeasure: answers.successMeasure,
        },
      });
      router.push(`/projects/${data.project._id}`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  const selectedPlan = plans.find((p) => p._id === hoshinPlanId);
  const selectedPlanStrategies = selectedPlan ? flattenHoshinTree(selectedPlan).strategies : [];

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto pb-10">
        <Link href="/projects" className="inline-flex items-center gap-1.5 text-xs opacity-40 hover:opacity-70 transition mb-3">
          <ArrowLeft className="h-3.5 w-3.5" /> All projects
        </Link>

        <div className="flex items-center gap-2.5 mb-5">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "color-mix(in srgb, var(--color-accent) 14%, transparent)" }}>
            <Sparkles className="h-5 w-5" style={{ color: "var(--color-accent)" }} />
          </div>
          <div>
            <h1 className="text-lg font-bold">Vecta Live</h1>
            <p className="text-xs opacity-50">Guided project setup - rule-based, not an LLM (no AI is configured in Vecta)</p>
          </div>
        </div>

        <div className="card p-4 mb-4 space-y-3">
          {messages.map((m, i) => (
            <ChatBubble key={i} from={m.from} text={m.text} />
          ))}
          <div ref={bottomRef} />
        </div>

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        {phase === "name" && (
          <form onSubmit={submitName} className="flex items-center gap-2">
            <input autoFocus className="input flex-1" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Project name" />
            <button type="submit" className="btn-primary flex-shrink-0"><Send className="h-4 w-4" /></button>
          </form>
        )}

        {phase === "category" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CATEGORIES.map((c) => (
              <button key={c.key} onClick={() => pickCategory(c.key)} className="card p-3.5 text-left hover:shadow-md transition">
                <p className="text-sm font-bold mb-0.5">{c.label}</p>
                <p className="text-[11px] opacity-40 leading-snug">{c.blurb}</p>
              </button>
            ))}
          </div>
        )}

        {phase === "questions" && currentStep && (
          <form onSubmit={submitQuestion} className="flex items-start gap-2">
            {currentStep.textarea ? (
              <textarea autoFocus className="input flex-1 resize-none" rows={3} value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder={currentStep.placeholder || "Type your answer..."} />
            ) : (
              <input
                autoFocus
                type={currentStep.numeric ? "number" : "text"}
                className="input flex-1"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={currentStep.placeholder || "Type your answer..."}
              />
            )}
            <div className="flex flex-col gap-1.5 flex-shrink-0">
              <button type="submit" className="btn-primary"><Send className="h-4 w-4" /></button>
              {currentStep.optional && (
                <button type="button" onClick={skipQuestion} className="inline-flex items-center justify-center gap-1 rounded-xl border px-3 py-2 text-xs font-medium opacity-60 hover:opacity-100 transition" style={{ borderColor: "var(--color-border)" }}>
                  <SkipForward className="h-3.5 w-3.5" /> Skip
                </button>
              )}
            </div>
          </form>
        )}

        {phase === "plan" && (
          <div className="space-y-2">
            <select className="input" value={hoshinPlanId} onChange={(e) => pickPlan(e.target.value)}>
              <option value="">Choose a plan...</option>
              {plans.map((p) => <option key={p._id} value={p._id}>{p.name} (FY{p.fiscalYear})</option>)}
            </select>
            <button onClick={() => pickPlan("")} className="text-xs font-medium opacity-50 hover:opacity-80 transition">Skip - not linked to a plan</button>
          </div>
        )}

        {phase === "planStrategy" && (
          <div className="space-y-2">
            <select className="input" value={hoshinPriorityId} onChange={(e) => pickStrategy(e.target.value)}>
              <option value="">Choose a strategy...</option>
              {selectedPlanStrategies.map((s) => <option key={s._id} value={s._id}>{s.text}</option>)}
            </select>
            <button onClick={() => pickStrategy("")} className="text-xs font-medium opacity-50 hover:opacity-80 transition">Skip</button>
          </div>
        )}

        {phase === "summary" && (
          <div className="card p-4">
            <p className="text-xs font-bold uppercase tracking-wide opacity-50 mb-3">Ready to create</p>
            <dl className="space-y-1.5 text-sm mb-4">
              <SummaryRow label="Name" value={answers.name} />
              <SummaryRow label="Type" value={categoryLabel(category)} />
              {answers.ownerName && <SummaryRow label="Owner" value={answers.ownerName} />}
              {answers.successMeasure?.label && <SummaryRow label="Success measure" value={answers.successMeasure.label} />}
              {selectedPlan && <SummaryRow label="Plan" value={selectedPlan.name} />}
            </dl>
            <button onClick={createProject} disabled={submitting} className="btn-primary w-full">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Project"}
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function ChatBubble({ from, text }) {
  const isBot = from === "bot";
  return (
    <div className={`flex ${isBot ? "justify-start" : "justify-end"}`}>
      <div className={`max-w-[85%] ${isBot ? "" : "text-right"}`}>
        {isBot && <p className="text-[10px] font-bold uppercase tracking-wide opacity-30 mb-0.5 ml-1">Vecta Live</p>}
        <div
          className="inline-block rounded-2xl px-3.5 py-2 text-sm leading-snug whitespace-pre-wrap"
          style={isBot
            ? { background: "var(--color-bg)" }
            : { background: "var(--color-accent)", color: "white" }}
        >
          {text}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-xs opacity-40 flex-shrink-0">{label}</dt>
      <dd className="text-right truncate">{value}</dd>
    </div>
  );
}
