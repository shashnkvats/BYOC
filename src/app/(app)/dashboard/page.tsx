"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { NewClassifierButton } from "@/components/NewClassifierButton";
import { EmptyState, StatusBadge } from "@/components/ui";
import { api, ApiError } from "@/lib/api-client";
import { TEMPLATE_META, TemplateIcon } from "@/lib/templates";
import type { ClassifierSummary, TemplateType } from "@/lib/types";
import { useSession } from "@/lib/use-session";

function formatUpdatedAt(iso: string, status: ClassifierSummary["status"]): string | null {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return null;

  const minutes = Math.max(0, Math.floor((Date.now() - then.getTime()) / 60000));
  const verb = status === "draft" ? "Edited" : "Updated";

  if (minutes < 60) return `${verb} recently`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${verb} ${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${verb} ${days}d ago`;
  return `${verb} ${then.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

function classifierMeta(c: ClassifierSummary): string {
  const type = (c.template_type as TemplateType) ?? "custom";
  const parts = [TEMPLATE_META[type]?.label, formatUpdatedAt(c.updated_at, c.status)].filter(
    (part): part is string => Boolean(part),
  );
  return parts.join(" · ");
}

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
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xl">
          <p className="kicker">Workshop</p>
          <h1 className="display-page mt-1">Your classifiers</h1>
          <p className="mt-2.5 text-[15px] font-normal leading-6 text-ink-mute">
            Build and manage decisions your agents can call.
          </p>
        </div>
        <NewClassifierButton className="w-fit shrink-0 sm:mt-7" />
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
            const type = (c.template_type as TemplateType) ?? "custom";
            const meta = classifierMeta(c);
            return (
              <li key={c.id}>
                <Link
                  href={`/classifiers/${c.id}/edit`}
                  className="workshop-row group card flex items-center gap-4 px-5 py-4 no-underline"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-copper-soft text-copper">
                    <TemplateIcon type={type} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="display-card truncate">{c.name}</p>
                    {meta && (
                      <p className="mt-1 text-[13px] leading-5 text-ink-mute">{meta}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2.5">
                    <StatusBadge status={c.status} />
                    <ChevronRight
                      size={16}
                      strokeWidth={1.5}
                      aria-hidden="true"
                      className="text-ink-mute opacity-25 transition-opacity duration-150 ease-out group-hover:opacity-70"
                    />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
