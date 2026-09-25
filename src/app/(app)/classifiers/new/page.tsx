"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import type { TemplateType } from "@/lib/types";

const TEMPLATES: { id: TemplateType; name: string; blurb: string }[] = [
  {
    id: "guardrail",
    name: "Guardrail",
    blurb:
      "Keep an assistant on-topic and safe. Starts with two yes/no questions: is this off-topic, is this harmful.",
  },
  {
    id: "agent_routing",
    name: "Agent / skill routing",
    blurb: "Pick which specialist agent should handle a request from a list you define.",
  },
  {
    id: "mcp_tool_routing",
    name: "MCP / tool selection",
    blurb: "Choose which tool should run next out of a dynamic tool list.",
  },
  {
    id: "model_routing",
    name: "Model routing",
    blurb: "Route a request to a fast/cheap model or a more powerful one.",
  },
  {
    id: "custom",
    name: "Custom",
    blurb: "Start from a blank slate and add your own Choice / Score / Noul questions.",
  },
];

export default function NewClassifierPage() {
  const router = useRouter();
  const [template, setTemplate] = useState<TemplateType>("guardrail");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Give your classifier a name.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const classifier = await api.createClassifier({
        name: name.trim(),
        description: description.trim() || null,
        template_type: template,
      });
      router.push(`/classifiers/${classifier.id}/edit`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create classifier");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold">New classifier</h1>
      <p className="mt-1 text-sm text-gray-500">
        Pick a starting point. You can add, edit, or remove questions afterward.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {TEMPLATES.map((t) => (
            <button
              type="button"
              key={t.id}
              onClick={() => setTemplate(t.id)}
              className={`rounded-lg border p-4 text-left transition-colors ${
                template === t.id
                  ? "border-black bg-gray-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <p className="font-medium">{t.name}</p>
              <p className="mt-1 text-sm text-gray-500">{t.blurb}</p>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm font-medium">
            Name
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Amazon shopping assistant guardrail"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="description" className="text-sm font-medium">
            Description (optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-fit rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Create classifier"}
        </button>
      </form>
    </div>
  );
}
