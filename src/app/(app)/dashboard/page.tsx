"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import type { ClassifierSummary } from "@/lib/types";
import { useSession } from "@/lib/use-session";

const TEMPLATE_LABELS: Record<string, string> = {
  guardrail: "Guardrail",
  agent_routing: "Agent / skill routing",
  mcp_tool_routing: "MCP / tool selection",
  model_routing: "Model routing",
  custom: "Custom",
};

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
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your classifiers</h1>
        <Link
          href="/classifiers/new"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
        >
          New classifier
        </Link>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {classifiers === null && !error && (
        <p className="mt-6 text-sm text-gray-500">Loading...</p>
      )}

      {classifiers?.length === 0 && (
        <div className="mt-10 rounded-lg border border-dashed border-gray-300 p-10 text-center">
          <p className="text-gray-600">No classifiers yet.</p>
          <Link href="/classifiers/new" className="mt-2 inline-block text-sm underline">
            Create your first one
          </Link>
        </div>
      )}

      {classifiers && classifiers.length > 0 && (
        <ul className="mt-6 divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
          {classifiers.map((c) => (
            <li key={c.id}>
              <Link
                href={`/classifiers/${c.id}/edit`}
                className="flex items-center justify-between px-4 py-4 hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-sm text-gray-500">
                    {TEMPLATE_LABELS[c.template_type] ?? c.template_type}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    c.status === "published"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {c.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
