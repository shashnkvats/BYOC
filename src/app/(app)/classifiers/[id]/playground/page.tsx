"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
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
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Playground {classifier ? `- ${classifier.name}` : ""}</h1>
        <Link href={`/classifiers/${id}/edit`} className="text-sm underline">
          Back to editor
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">
          Input state - the message/context Jev will classify
        </label>
        <textarea
          value={state}
          onChange={(e) => setState(e.target.value)}
          rows={6}
          placeholder="Paste a sample user message or conversation context here..."
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={handleRun}
          disabled={running || !state.trim()}
          className="w-fit rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {running ? "Running..." : "Run"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {result && (
        <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Model: {result.model}</span>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                result.needs_review
                  ? "bg-amber-100 text-amber-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {result.needs_review ? "needs review" : "confident"}
            </span>
          </div>

          {result.warnings.length > 0 && (
            <ul className="text-sm text-amber-600">
              {result.warnings.map((w, i) => (
                <li key={i}>⚠ {w}</li>
              ))}
            </ul>
          )}

          <pre className="overflow-x-auto rounded-md bg-gray-50 p-3 text-xs">
            {JSON.stringify(result.answers, null, 2)}
          </pre>

          <div className="flex flex-col gap-1">
            {result.flags.map((f) => (
              <div key={f.key} className="flex items-center justify-between text-sm">
                <span>{f.key}</span>
                <span className={f.needs_review ? "text-amber-600" : "text-gray-500"}>
                  confidence:{" "}
                  {f.effective_confidence !== null ? f.effective_confidence.toFixed(2) : "n/a"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
