"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import type { LogOut } from "@/lib/types";

export default function LogsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [logs, setLogs] = useState<LogOut[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listLogs(id)
      .then(setLogs)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load logs"));
  }, [id]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Logs</h1>
        <Link href={`/classifiers/${id}/edit`} className="text-sm underline">
          Back to editor
        </Link>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {logs === null && !error && <p className="text-sm text-gray-500">Loading...</p>}
      {logs?.length === 0 && (
        <p className="text-sm text-gray-500">
          No classification calls yet. Once your endpoint is deployed and called, results will
          show up here.
        </p>
      )}

      {logs && logs.length > 0 && (
        <ul className="flex flex-col gap-3">
          {logs.map((log) => (
            <li key={log.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{new Date(log.created_at).toLocaleString()}</span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    log.needs_review
                      ? "bg-amber-100 text-amber-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {log.needs_review ? "needs review" : "confident"}
                </span>
              </div>
              {log.state_excerpt && (
                <p className="mt-2 truncate text-sm text-gray-700">{log.state_excerpt}</p>
              )}
              {log.answers && (
                <pre className="mt-2 overflow-x-auto rounded-md bg-gray-50 p-2 text-xs">
                  {JSON.stringify(log.answers, null, 2)}
                </pre>
              )}
              <p className="mt-2 text-xs text-gray-400">
                {log.jev_model_version_used ?? "unknown model"} · {log.latency_ms ?? "?"}ms
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
