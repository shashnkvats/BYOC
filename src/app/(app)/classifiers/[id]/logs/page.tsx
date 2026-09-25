"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ClassifierPageHeader, EmptyState, StatusBadge } from "@/components/ui";
import { api, ApiError } from "@/lib/api-client";
import { TemplateTypeHint } from "@/lib/templates";
import type { ClassifierOut, LogOut } from "@/lib/types";

export default function LogsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [logs, setLogs] = useState<LogOut[] | null>(null);
  const [classifier, setClassifier] = useState<ClassifierOut | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getClassifier(id).then(setClassifier).catch(() => undefined);
    api
      .listLogs(id)
      .then(setLogs)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load logs"));
  }, [id]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <ClassifierPageHeader
        id={id}
        current="logs"
        kicker="Audit"
        title="Logs"
        subtitle={classifier?.name}
        meta={classifier ? <TemplateTypeHint type={classifier.template_type} /> : undefined}
      />

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
            <li key={log.id} className="card p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-ink-mute">
                  {new Date(log.created_at).toLocaleString()}
                </p>
                <StatusBadge status={log.needs_review ? "needs_review" : "confident"} />
              </div>
              {log.state_excerpt && (
                <p className="display-card mt-3 text-[1.15rem]">{log.state_excerpt}</p>
              )}
              {log.answers && (
                <div className="mt-4 overflow-hidden rounded-xl bg-ink">
                  <pre className="tech-output overflow-x-auto px-4 py-3 text-paper/90">
                    {JSON.stringify(log.answers, null, 2)}
                  </pre>
                </div>
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
