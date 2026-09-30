"use client";

import { ArrowLeft, Zap } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import type { EditableQuestion } from "@/components/QuestionEditor";
import { FLAG_KEY_MAX, FLAG_KEY_PATTERN, isValidFlagKey } from "@/lib/guardrail-seed";
import { questionInToEditable } from "@/lib/question-convert";

const TOOL_PLACEHOLDERS = [
  {
    key: "search_web",
    value: "Search the web when the request requires current or external information.",
  },
  {
    key: "get_weather",
    value: "Get current weather conditions or forecasts for a location.",
  },
] as const;

export function seedMcpToolSelector(): EditableQuestion {
  const question = questionInToEditable({
    key: "target_tool",
    type: "choice",
    instructions: "Which tool should handle this request?",
    criteria: {},
    confidence_threshold: 0.6,
  });
  return {
    ...question,
    choicePairs: [
      { key: "", value: "" },
      { key: "", value: "" },
    ],
  };
}

function validTools(question: EditableQuestion) {
  return question.choicePairs.filter(
    (pair) => isValidFlagKey(pair.key) && pair.value.trim().length > 0,
  );
}

export function isValidToolSelector(question: EditableQuestion): boolean {
  return (
    question.instructions.trim().length > 0 &&
    isValidFlagKey(question.key) &&
    validTools(question).length >= 2
  );
}

export function McpToolSelectorConfigure({
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
  const [editingQuestion, setEditingQuestion] = useState(false);
  const canCreate = isValidToolSelector(question) && !submitting;
  const responseKey = isValidFlagKey(question.key) ? question.key.trim() : "target_tool";
  const tools = validTools(question);
  const exampleTool =
    tools.find((pair) => pair.key.trim() === "get_weather")?.key.trim() ||
    tools[0]?.key.trim() ||
    "get_weather";

  function updatePair(index: number, field: "key" | "value", value: string) {
    onQuestion({
      ...question,
      choicePairs: question.choicePairs.map((pair, i) =>
        i === index ? { ...pair, [field]: value } : pair,
      ),
    });
  }

  function addTool() {
    onQuestion({
      ...question,
      choicePairs: [...question.choicePairs, { key: "", value: "" }],
    });
  }

  function removeTool(index: number) {
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
        <p className="kicker">Tool decision</p>
        <h2 className="display-section mt-1">Which tool should handle this?</h2>
        <p className="mt-2 max-w-xl text-[0.92rem] leading-[1.55] text-ink-mute">
          Jev compares the incoming request with the tools you make available and returns the best
          matching tool.
        </p>

        <p className="label mt-6">Decision</p>
        {editingQuestion ? (
          <textarea
            id="tool-question"
            rows={3}
            value={question.instructions}
            onChange={(e) => onQuestion({ ...question, instructions: e.target.value })}
            onBlur={() => setEditingQuestion(false)}
            autoFocus
            className="field mt-2 resize-none"
          />
        ) : (
          <div className="mt-2 flex items-center justify-between gap-4 rounded-[0.875rem] border border-line bg-[#fbf7ef] px-[17px] py-[15px]">
            <strong className="font-semibold text-ink">
              {question.instructions.trim() || "Which tool should handle this request?"}
            </strong>
            <button
              type="button"
              onClick={() => setEditingQuestion(true)}
              className="shrink-0 border-0 bg-transparent p-0 text-sm font-semibold text-copper"
            >
              Edit question
            </button>
          </div>
        )}

        <label htmlFor="tool-key" className="label mt-6 block">
          Response key
        </label>
        <input
          id="tool-key"
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
          The field your agent reads from the BYOC response.
        </p>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-2">
          <p className="label m-0">Available tools</p>
          <p className="text-[13px] text-ink-mute">
            Add manually · <span className="font-semibold text-copper">Import from MCP server</span>
          </p>
        </div>

        <div className="mt-2.5 flex flex-col gap-[11px]">
          {question.choicePairs.map((pair, i) => (
            <div
              key={i}
              className="rounded-[0.875rem] border border-line bg-[#fbf7ef] p-4"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg border border-line text-copper">
                  <Zap size={14} strokeWidth={1.75} aria-hidden="true" />
                </span>
                <input
                  value={pair.key}
                  onChange={(e) => updatePair(i, "key", e.target.value)}
                  aria-label="tool name"
                  placeholder={TOOL_PLACEHOLDERS[i]?.key ?? "tool_name"}
                  className="min-w-0 flex-1 bg-transparent px-1.5 py-1 font-mono text-sm text-ink outline-none placeholder:text-ink-mute/70"
                />
                <button
                  type="button"
                  onClick={() => removeTool(i)}
                  disabled={question.choicePairs.length <= 2}
                  className="shrink-0 border-0 bg-transparent text-sm text-ink-mute disabled:opacity-30 hover:text-ink"
                >
                  Remove
                </button>
              </div>
              <textarea
                value={pair.value}
                onChange={(e) => updatePair(i, "value", e.target.value)}
                aria-label="when to choose this tool"
                placeholder={
                  TOOL_PLACEHOLDERS[i]?.value ?? "When should Jev choose this tool?"
                }
                rows={2}
                className="field mt-2.5 resize-none"
              />
              <p className="mt-1.5 text-[13px] text-ink-mute">
                Describe when this tool should be chosen.
              </p>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addTool}
          className="mt-1 border-0 bg-transparent py-3 pl-0 text-sm font-semibold text-copper"
        >
          + Add tool
        </button>

        <div className="mt-2 border-t border-line" />

        <div className="mt-6 grid gap-3.5 sm:grid-cols-2">
          <div className="rounded-[0.875rem] border border-line bg-[#fbf7ef] p-[17px]">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-ink-mute">
              Example request
            </p>
            <p className="mt-2 text-[0.95rem] leading-6">
              “What&apos;s the weather in Bangalore tomorrow?”
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
              <span className="text-[#f3b98e]">{exampleTool}</span>
              <span className="inline-flex items-baseline gap-[0.65rem] text-[#d9d0c5]">
                <span className="text-[0.68rem] tracking-[0.04em] text-paper/40">score</span>
                <span>0.97</span>
              </span>
            </p>
          </div>
        </div>
      </article>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onCreate}
          disabled={!canCreate}
          className="btn btn-copper w-fit text-[14px] font-semibold"
        >
          {submitting ? "Going live..." : "Create tool selector"}
        </button>
        <Link
          href="/classifiers/new?from=mcp_tool_routing"
          className="inline-flex items-center gap-1.5 text-sm text-ink-mute no-underline hover:text-ink"
        >
          <ArrowLeft size={14} strokeWidth={1.5} aria-hidden="true" />
          Back
        </Link>
      </div>
    </div>
  );
}
