"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ClassifierSubnav, StatusBadge } from "@/components/ui";
import { api, ApiError } from "@/lib/api-client";
import type { ClassifierOut, TestResponse } from "@/lib/types";

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="kicker">Try it</p>
          <h1 className="display-page mt-1">
            Playground
          </h1>
          {classifier && (
            <p className="copy mt-1 text-ink-mute">{classifier.name}</p>
          )}
        </div>
        <ClassifierSubnav id={id} current="playground" />
      </div>

      <div className="card flex flex-col gap-3 p-5">
        <label className="label">
          Input state — the message Jev will classify
        </label>
        <textarea
          value={state}
          onChange={(e) => setState(e.target.value)}
          rows={6}
          placeholder="Paste a sample user message or conversation context here..."
          className="field"
        />
        <button
          type="button"
          onClick={handleRun}
          disabled={running || !state.trim()}
          className="btn btn-copper w-fit"
        >
          {running ? "Running..." : "Run"}
        </button>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {result && (
        <div className="card flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-ink-mute">{result.model}</span>
            <StatusBadge status={result.needs_review ? "needs_review" : "confident"} />
          </div>

          {result.warnings.length > 0 && (
            <ul className="text-sm text-amber">
              {result.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          )}

          <pre className="code-block">{JSON.stringify(result.answers, null, 2)}</pre>

          <div className="flex flex-col gap-2">
            {result.flags.map((f) => (
              <div
                key={f.key}
                className="flex items-center justify-between border-t border-line pt-2 text-sm"
              >
                <span className="font-mono text-xs">{f.key}</span>
                <span className={`font-mono text-sm tracking-[0.02em] ${f.needs_review ? "text-amber" : "text-ink-mute"}`}>
                  {f.effective_confidence !== null
                    ? f.effective_confidence.toFixed(2)
                    : "n/a"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
