"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import { TEMPLATE_META } from "@/lib/templates";
import type { TemplateType } from "@/lib/types";

const TEMPLATES = (Object.keys(TEMPLATE_META) as TemplateType[]).map((id) => ({
  id,
  ...TEMPLATE_META[id],
}));

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
    <div className="mx-auto max-w-3xl">
      <p className="kicker">New work</p>
      <h1 className="display-page mt-1">New classifier</h1>
      <p className="lede mt-2 max-w-lg text-ink-mute">
        Pick a starting point. You can add, edit, or remove questions afterward — the
        template is a sketch, not a contract.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-7">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {TEMPLATES.map((t) => (
            <button
              type="button"
              key={t.id}
              onClick={() => setTemplate(t.id)}
              className={`card p-4 text-left transition-colors ${
                template === t.id
                  ? "border-copper ring-2 ring-copper-soft"
                  : "hover:border-ink/20"
              }`}
            >
              <p className="text-copper">{t.mark}</p>
              <p className="display-card mt-1">{t.label}</p>
              <p className="copy mt-1 text-ink-mute">{t.blurb}</p>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="label">
            Name
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Amazon shopping assistant guardrail"
            className="field"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="description" className="label">
            Description (optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="field"
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button type="submit" disabled={submitting} className="btn btn-primary w-fit">
          {submitting ? "Creating..." : "Create classifier"}
        </button>
      </form>
    </div>
  );
}
