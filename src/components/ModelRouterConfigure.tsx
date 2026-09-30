"use client";

import { ArrowLeft, X } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { EditableQuestion } from "@/components/QuestionEditor";
import { FLAG_KEY_MAX, FLAG_KEY_PATTERN, isValidFlagKey } from "@/lib/guardrail-seed";

function validRoutes(question: EditableQuestion) {
  return question.choicePairs.filter(
    (pair) => isValidFlagKey(pair.key) && pair.value.trim().length > 0,
  );
}

export function isValidModelRouter(question: EditableQuestion): boolean {
  return (
    question.instructions.trim().length > 0 &&
    isValidFlagKey(question.key) &&
    validRoutes(question).length >= 2
  );
}

export function ModelRouterConfigure({
  header,
  question,
  onQuestion,
  error,
  submitting,
  onCreate,
}: {
  header: ReactNode;
  question: EditableQuestion;
  onQuestion: (next: EditableQuestion) => void;
  error: string | null;
  submitting: boolean;
  onCreate: () => void;
}) {
  const canCreate = isValidModelRouter(question) && !submitting;
  const responseKey = isValidFlagKey(question.key) ? question.key.trim() : "target_model";
  const exampleRoute = validRoutes(question)[0]?.key.trim() || "fast_model";

  function updatePair(index: number, field: "key" | "value", value: string) {
    onQuestion({
      ...question,
      choicePairs: question.choicePairs.map((pair, i) =>
        i === index ? { ...pair, [field]: value } : pair,
      ),
    });
  }

  function addRoute() {
    onQuestion({
      ...question,
      choicePairs: [...question.choicePairs, { key: "", value: "" }],
    });
  }

  function removeRoute(index: number) {
    if (question.choicePairs.length <= 2) return;
    onQuestion({
      ...question,
      choicePairs: question.choicePairs.filter((_, i) => i !== index),
    });
  }

  return (
    <div className="mx-auto max-w-[56rem]">
      {header}

      <article className="card mt-8 p-5 sm:p-6">
        <p className="kicker">Routing decision</p>
        <h2 className="display-section mt-1">Where should this request go?</h2>
        <p className="mt-2 max-w-xl text-[0.92rem] leading-[1.55] text-ink-mute">
          Give Jev one clear question and the model choices it can return. Keep
          provider-specific execution logic outside the classifier.
        </p>

        <label htmlFor="router-question" className="label mt-6 block">
          The question Jev should answer
        </label>
        <textarea
          id="router-question"
          rows={3}
          value={question.instructions}
          onChange={(e) => onQuestion({ ...question, instructions: e.target.value })}
          className="field mt-2 resize-none"
        />
        <p className="mt-2 text-[0.82rem] leading-[1.45] text-ink-mute">
          Jev will evaluate this question against the incoming request and pick exactly one route.
        </p>

        <label htmlFor="router-key" className="label mt-6 block">
          Response key
        </label>
        <input
          id="router-key"
          type="text"
          value={question.key}
          onChange={(e) => onQuestion({ ...question, key: e.target.value })}
          required
          aria-required="true"
          minLength={1}
          maxLength={FLAG_KEY_MAX}
          pattern={FLAG_KEY_PATTERN.source}
          autoComplete="off"
          spellCheck={false}
          className="field mt-2 font-mono text-sm"
        />
        <p className="mt-2 text-[0.82rem] leading-[1.45] text-ink-mute">
          The field your application reads from the API response.
        </p>

        <p className="label mt-6">Available routes</p>
        <div className="mt-2 flex flex-col gap-2.5">
          {question.choicePairs.map((pair, i) => (
            <div
              key={i}
              className="grid grid-cols-1 items-center gap-2.5 sm:grid-cols-[1fr_1.35fr_auto]"
            >
              <input
                value={pair.key}
                onChange={(e) => updatePair(i, "key", e.target.value)}
                aria-label="route key"
                placeholder="route_key"
                className="field font-mono text-sm"
              />
              <input
                value={pair.value}
                onChange={(e) => updatePair(i, "value", e.target.value)}
                aria-label="when to choose"
                placeholder="When should Jev choose this route?"
                className="field"
              />
              <button
                type="button"
                onClick={() => removeRoute(i)}
                disabled={question.choicePairs.length <= 2}
                title="Remove"
                className="justify-self-start p-2 text-ink-mute disabled:opacity-30 hover:text-ink disabled:hover:text-ink-mute"
              >
                <X size={18} strokeWidth={1.5} aria-hidden="true" />
                <span className="sr-only">Remove route</span>
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addRoute}
          className="mt-2.5 border-0 bg-transparent p-0 text-sm font-semibold text-copper"
        >
          + Add route
        </button>
        <p className="mt-2 text-[0.82rem] leading-[1.45] text-ink-mute">
          Route key on the left; a short semantic description on the right. The description gives
          Jev the context it needs to choose.
        </p>

        <div className="mt-6 border-t border-line" />

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[0.875rem] border border-line bg-[#fbf7ef] p-[17px]">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-ink-mute">
              Example request
            </p>
            <p className="mt-2 text-[0.95rem] leading-6">
              “Summarize this support ticket in three bullets.”
            </p>
          </div>
          <div className="overflow-hidden rounded-[0.875rem] bg-ink p-[17px] text-paper">
            <div className="flex items-center justify-between text-[0.68rem] uppercase tracking-[0.12em] text-paper/55">
              <span>Example response</span>
              <span className="font-mono font-normal normal-case tracking-[0.02em]">
                {responseKey}
              </span>
            </div>
            <p className="tech-output mt-[18px] flex items-baseline justify-between gap-4 text-paper/90">
              <span className="text-[#f3b98e]">{exampleRoute}</span>
              <span className="inline-flex items-baseline gap-[0.65rem] text-[#ddd4c9]">
                <span className="text-[0.68rem] tracking-[0.04em] text-paper/40">score</span>
                <span>0.94</span>
              </span>
            </p>
          </div>
        </div>

        <p className="mt-5 border-l-[3px] border-copper py-0.5 pl-3 text-[13px] leading-5 text-ink-mute">
          No confidence slider here. The router&apos;s job is to return the best route plus its
          score; your application can decide what to do with low-confidence results.
        </p>
      </article>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onCreate}
          disabled={!canCreate}
          className="btn btn-copper w-fit text-[14px] font-semibold"
        >
          {submitting ? "Going live..." : "Create router"}
        </button>
        <Link
          href="/classifiers/new?from=model_routing"
          className="inline-flex items-center gap-1.5 text-sm text-ink-mute no-underline hover:text-ink"
        >
          <ArrowLeft size={14} strokeWidth={1.5} aria-hidden="true" />
          Back
        </Link>
      </div>
    </div>
  );
}
