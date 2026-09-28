"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { EditableQuestion } from "@/components/QuestionEditor";
import {
  exampleFlagLabel,
  FLAG_KEY_MAX,
  FLAG_KEY_PATTERN,
  guardrailCheckTitle,
  isValidFlagKey,
} from "@/lib/guardrail-seed";

export function GuardrailConfigure({
  header,
  name,
  question,
  onQuestion,
  error,
  submitting,
  onCreate,
}: {
  header: ReactNode;
  name: string;
  question: EditableQuestion;
  onQuestion: (next: EditableQuestion) => void;
  error: string | null;
  submitting: boolean;
  onCreate: () => void;
}) {
  const flagValid = isValidFlagKey(question.key);
  const canCreate = flagValid && question.instructions.trim().length > 0 && !submitting;
  const title = guardrailCheckTitle(name);

  return (
    <div className="mx-auto max-w-5xl">
      {header}

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_14.5rem] lg:items-start">
        <div className="flex flex-col gap-4">
          <article className="card p-5 sm:p-6">
            <p className="kicker">From your brief</p>
            <h2 className="display-card mt-[0.45rem] text-[clamp(1.6rem,2.4vw,1.9rem)] leading-[1.12]">
              {title}
            </h2>
            <p className="mt-[0.9rem] text-[0.88rem] leading-[1.5] text-ink-mute">
              For <strong className="font-medium text-ink">{name.trim() || "this guardrail"}</strong>.
              Jev will evaluate this question for every message.
            </p>

            <label htmlFor="guardrail-question" className="label mt-5 block">
              The question, in plain English
            </label>
            <textarea
              id="guardrail-question"
              rows={4}
              value={question.instructions}
              onChange={(e) => onQuestion({ ...question, instructions: e.target.value })}
              className="field mt-1.5 resize-none"
            />
            <p className="mt-1.5 text-[0.82rem] leading-[1.45] text-ink-mute">
              Keep it yes or no. Put what “yes” means in the sentence.
            </p>

            <label htmlFor="guardrail-flag" className="label mt-5 block">
              Flag name
            </label>
            <input
              id="guardrail-flag"
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
              placeholder="e.g. is_prompt_injection"
              className="field mt-1.5 font-mono text-sm"
            />
            <p className="mt-1.5 text-[0.82rem] leading-[1.45] text-ink-mute">
              The key in the API response. Letters, numbers, and underscores.
            </p>

            <div className="mt-5 overflow-hidden rounded-[0.85rem] bg-ink">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-[0.7rem] uppercase tracking-[0.16em] text-paper/55">
                <span>Example response</span>
                <span className="font-mono font-normal normal-case tracking-[0.02em] text-[#e8b089]">
                  {exampleFlagLabel(question.key)}
                </span>
              </div>
              <pre className="tech-output px-4 pb-1.5 pt-3.5 text-paper/90">{`yes    0.88
no     0.12`}</pre>
              <p className="px-4 pb-3.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-paper/40">
                Example
              </p>
            </div>
          </article>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onCreate}
              disabled={!canCreate}
              className="btn btn-copper w-fit text-[14px] font-semibold"
            >
              {submitting ? "Going live..." : "Create guardrail"}
            </button>
            <Link
              href="/classifiers/new?from=guardrail"
              className="inline-flex items-center gap-1.5 text-sm text-ink-mute no-underline hover:text-ink"
            >
              <ArrowLeft size={14} strokeWidth={1.5} aria-hidden="true" />
              Back
            </Link>
          </div>
        </div>

        <aside className="card p-4 lg:sticky lg:top-[5.5rem]">
          <p className="kicker">How it works</p>
          <p className="mt-2 text-[0.82rem] leading-[1.5] text-ink-mute">
            Jev returns a yes/no score for every message before your chatbot replies.
            You define the question and the response key.
          </p>
        </aside>
      </div>
    </div>
  );
}
