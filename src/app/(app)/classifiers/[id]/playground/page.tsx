"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ClassifierPageHeader, StatusBadge } from "@/components/ui";
import { api, ApiError } from "@/lib/api-client";
import { TemplateTypeHint } from "@/lib/templates";
import type { ClassifierOut, JevAnswer, QuestionAnswerFlag, TestResponse } from "@/lib/types";

function answerValue(answer: JevAnswer | undefined): string {
  if (!answer) return "—";
  if (typeof answer === "object") {
    if ("answer" in answer && answer.answer != null) return String(answer.answer);
    if ("choice" in answer && answer.choice != null) return String(answer.choice);
    if ("score" in answer && answer.score != null) return String(answer.score);
  }
  return String(answer);
}

function formatLedger(flags: QuestionAnswerFlag[], answers: Record<string, JevAnswer>): string {
  const keyWidth = Math.max(12, ...flags.map((f) => f.key.length));
  return flags
    .map((f) => {
      const value = answerValue(answers[f.key]);
      const conf =
        f.effective_confidence !== null ? f.effective_confidence.toFixed(2) : "n/a";
      return `${f.key.padEnd(keyWidth + 2)}${value.padEnd(10)}${conf}`;
    })
    .join("\n");
}

export default function PlaygroundPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [classifier, setClassifier] = useState<ClassifierOut | null>(null);
  const [state, setState] = useState("");
  const [result, setResult] = useState<TestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    api.getClassifier(id).then(setClassifier).catch(() => undefined);
  }, [id]);

  async function handleRun() {
    if (!state.trim()) return;
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.testClassifier(id, { state });
      setResult(res);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Test run failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <ClassifierPageHeader
        id={id}
        current="playground"
        kicker="Try it"
        title="Playground"
        subtitle={classifier?.name}
        meta={classifier ? <TemplateTypeHint type={classifier.template_type} /> : undefined}
      />

      <div className="card flex flex-col gap-4 p-5 sm:p-6">
        <div>
          <p className="kicker">A trial run</p>
          <h2 className="display-card mt-2">Give it a message.</h2>
          <p className="mt-1 text-[15px] leading-6 text-ink-mute">
            The state Jev will classify — a user message, or a scrap of conversation.
          </p>
        </div>
        <textarea
          value={state}
          onChange={(e) => setState(e.target.value)}
          rows={7}
          placeholder="Paste a sample user message here..."
          className="field resize-none"
        />
        <button
          type="button"
          onClick={handleRun}
          disabled={running || !state.trim()}
          className="btn btn-copper w-fit text-[14px] font-semibold"
        >
          {running ? "Running..." : "Run"}
        </button>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {result && (
        <div className="overflow-hidden rounded-2xl border border-line bg-ink text-paper">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
            <span className="text-[0.7rem] uppercase tracking-[0.16em] text-paper/55">
              {result.model}
            </span>
            <StatusBadge status={result.needs_review ? "needs_review" : "confident"} />
          </div>
          {result.warnings.length > 0 && (
            <ul className="border-b border-white/10 px-5 py-3 text-sm text-amber-soft">
              {result.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          )}
          <pre className="tech-output overflow-x-auto px-5 py-4 text-paper/90">
            {formatLedger(result.flags, result.answers)}
          </pre>
        </div>
      )}
    </div>
  );
}
