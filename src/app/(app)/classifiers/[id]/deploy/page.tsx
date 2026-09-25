"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ClassifierSubnav } from "@/components/ui";
import { api, ApiError } from "@/lib/api-client";
import type { ClassifierOut } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8001";

export default function DeployPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [classifier, setClassifier] = useState<ClassifierOut | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [endpointPath, setEndpointPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    api.getClassifier(id).then(setClassifier).catch(() => undefined);
  }, [id]);

  async function handlePublish() {
    setPublishing(true);
    setError(null);
    try {
      const res = await api.publishClassifier(id);
      setClassifier(res.classifier);
      setApiKey(res.api_key);
      setEndpointPath(res.endpoint_path);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Publish failed");
    } finally {
      setPublishing(false);
    }
  }

  if (!classifier) {
    return <p className="copy text-ink-mute">Loading...</p>;
  }

  const fullUrl = `${API_URL}${endpointPath ?? "/v1/classify/<YOUR_API_KEY>"}`;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="kicker">Go live</p>
          <h1 className="display-page mt-1">Deploy</h1>
          <p className="copy mt-1 text-ink-mute">{classifier.name}</p>
        </div>
        <ClassifierSubnav id={id} current="deploy" />
      </div>

      {classifier.status !== "published" && !apiKey && (
        <div className="card p-6">
          <h2 className="display-section">
            Still a <span className="font-editorial text-copper">draft.</span>
          </h2>
          <p className="copy mt-2 text-ink-mute">
            Publish to mint a live API key and endpoint. The raw key is shown once —
            after that, only its hash lives in the database.
          </p>
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing}
            className="btn btn-copper mt-5"
          >
            {publishing ? "Publishing..." : "Publish"}
          </button>
        </div>
      )}

      {classifier.status === "published" && !apiKey && (
        <div className="card p-6">
          <h2 className="display-section">
            Already <span className="font-editorial text-copper">live.</span>
          </h2>
          <p className="copy mt-2 text-ink-mute">
            The API key was only shown once at publish time and can&apos;t be retrieved
            again. Re-publishing mints a new key and revokes the old one.
          </p>
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing}
            className="btn btn-ghost mt-5"
          >
            {publishing ? "Publishing..." : "Re-publish (rotate key)"}
          </button>
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      {apiKey && (
        <div className="flex flex-col gap-5">
          <div className="rounded-2xl border border-amber/30 bg-amber-soft p-5">
            <p className="text-sm font-medium text-amber">
              Copy this API key now — it will not be shown again.
            </p>
            <code className="mt-3 block break-all rounded-xl bg-paper-raised p-3 font-mono text-sm">
              {apiKey}
            </code>
          </div>

          <div className="flex flex-col gap-2">
            <label className="label">
              Endpoint
            </label>
            <code className="break-all rounded-xl bg-ink px-3 py-2 font-mono text-sm text-paper">
              {fullUrl}
            </code>
          </div>

          <Snippet label="curl">{`curl -X POST '${fullUrl}' \\
  -H 'Content-Type: application/json' \\
  -d '{"state": "the message or context to classify"}'`}</Snippet>

          <Snippet label="JavaScript">{`const res = await fetch("${fullUrl}", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ state: "the message or context to classify" }),
});
const result = await res.json();
if (result.needs_review) {
  // fall back to a safe default / ask a human
}`}</Snippet>

          <Snippet label="Python">{`import httpx

resp = httpx.post(
    "${fullUrl}",
    json={"state": "the message or context to classify"},
)
result = resp.json()
if result["needs_review"]:
    ...  # fall back to a safe default / ask a human`}</Snippet>
        </div>
      )}
    </div>
  );
}

function Snippet({ label, children }: { label: string; children: string }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="label">
        {label}
      </label>
      <pre className="code-block">{children}</pre>
    </div>
  );
}
