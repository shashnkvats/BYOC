"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ClassifierSubnav, EmptyState, StatusBadge } from "@/components/ui";
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
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="kicker">Audit</p>
          <h1 className="display-page mt-1">Logs</h1>
        </div>
        <ClassifierSubnav id={id} current="logs" />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      {logs === null && !error && <p className="copy text-ink-mute">Loading...</p>}
      {logs?.length === 0 && (
        <EmptyState
          title="The ledger is empty."
          body="Once your endpoint is deployed and called, every classification will land here."
        />
      )}

      {logs && logs.length > 0 && (
        <ul className="flex flex-col gap-3">
          {logs.map((log) => (
            <li key={log.id} className="card p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-mute">{new Date(log.created_at).toLocaleString()}</span>
                <StatusBadge status={log.needs_review ? "needs_review" : "confident"} />
              </div>
              {log.state_excerpt && (
                <p className="copy mt-3 truncate text-ink">{log.state_excerpt}</p>
              )}
              {log.answers && (
                <pre className="code-block mt-3">{JSON.stringify(log.answers, null, 2)}</pre>
              )}
              <p className="mt-3 font-mono text-xs text-ink-mute">
                {log.jev_model_version_used ?? "unknown model"} · {log.latency_ms ?? "?"}ms
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
