"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
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
    return <p className="text-sm text-gray-500">Loading...</p>;
  }

  const fullUrl = `${API_URL}${endpointPath ?? "/v1/classify/<YOUR_API_KEY>"}`;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Deploy - {classifier.name}</h1>
        <Link href={`/classifiers/${id}/edit`} className="text-sm underline">
          Back to editor
        </Link>
      </div>

      {classifier.status !== "published" && !apiKey && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-600">
            This classifier is a draft. Publish it to generate a live API key and endpoint.
          </p>
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing}
            className="mt-3 rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {publishing ? "Publishing..." : "Publish"}
          </button>
        </div>
      )}

      {classifier.status === "published" && !apiKey && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-600">
            This classifier is published. The API key was only shown once at publish time and
            can&apos;t be retrieved again. Re-publishing generates a new key and revokes the old
            one.
          </p>
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing}
            className="mt-3 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {publishing ? "Publishing..." : "Re-publish (rotate key)"}
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {apiKey && (
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-800">
              Copy this API key now - it will not be shown again.
            </p>
            <code className="mt-2 block break-all rounded-md bg-white p-2 text-sm">{apiKey}</code>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Endpoint</label>
            <code className="break-all rounded-md bg-gray-100 p-2 text-sm">{fullUrl}</code>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">curl</label>
            <pre className="overflow-x-auto rounded-md bg-gray-900 p-3 text-xs text-gray-100">
{`curl -X POST '${fullUrl}' \\
  -H 'Content-Type: application/json' \\
  -d '{"state": "the message or context to classify"}'`}
            </pre>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">JavaScript</label>
            <pre className="overflow-x-auto rounded-md bg-gray-900 p-3 text-xs text-gray-100">
{`const res = await fetch("${fullUrl}", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ state: "the message or context to classify" }),
});
const result = await res.json();
if (result.needs_review) {
  // fall back to a safe default / ask a human
}`}
            </pre>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Python</label>
            <pre className="overflow-x-auto rounded-md bg-gray-900 p-3 text-xs text-gray-100">
{`import httpx

resp = httpx.post(
    "${fullUrl}",
    json={"state": "the message or context to classify"},
)
result = resp.json()
if result["needs_review"]:
    ...  # fall back to a safe default / ask a human`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
