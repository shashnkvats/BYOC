"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { NewClassifierButton } from "@/components/NewClassifierButton";
import { EmptyState, StatusBadge } from "@/components/ui";
import { api, ApiError } from "@/lib/api-client";
import { TEMPLATE_META } from "@/lib/templates";
import type { ClassifierSummary, TemplateType } from "@/lib/types";
import { useSession } from "@/lib/use-session";

export default function DashboardPage() {
  const { session, loading: sessionLoading } = useSession();
  const [classifiers, setClassifiers] = useState<ClassifierSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionLoading || !session) return;
    api
      .listClassifiers()
      .then(setClassifiers)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load classifiers"));
  }, [sessionLoading, session]);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="kicker">Workshop</p>
          <h1 className="display-page mt-1">Your classifiers</h1>
        </div>
        <NewClassifierButton />
      </div>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      {classifiers === null && !error && (
        <p className="copy mt-8 text-ink-mute">Loading your ledger...</p>
      )}

      {classifiers?.length === 0 && (
        <EmptyState
          title="Nothing on the bench yet."
          body="Pick a template, write a few plain-English questions, and publish an endpoint."
          action={
            <Link href="/classifiers/new" className="btn btn-copper no-underline">
              Create your first one
            </Link>
          }
        />
      )}

      {classifiers && classifiers.length > 0 && (
        <ul className="mt-8 grid grid-cols-1 gap-3">
          {classifiers.map((c) => {
            const meta = TEMPLATE_META[c.template_type as TemplateType];
            return (
              <li key={c.id}>
                <Link
                  href={`/classifiers/${c.id}/edit`}
                  className="card flex items-center justify-between px-5 py-4 no-underline transition-transform hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-copper-soft text-lg text-copper">
                      {meta?.mark ?? "·"}
                    </span>
                    <div>
                      <p className="display-card">{c.name}</p>
                      <p className="copy mt-0.5 text-ink-mute">
                        {meta?.label ?? c.template_type}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={c.status} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
