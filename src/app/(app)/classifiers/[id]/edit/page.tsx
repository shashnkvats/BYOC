"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { EditableQuestion, QuestionEditor } from "@/components/QuestionEditor";
import { ClassifierPageHeader, StatusBadge } from "@/components/ui";
import { api, ApiError } from "@/lib/api-client";
import {
  editableToQuestionIn,
  makeBlankEditable,
  questionInToEditable,
  questionOutToEditable,
} from "@/lib/question-convert";
import { TemplateTypeHint } from "@/lib/templates";
import type { BelowThresholdAction, ClassifierOut } from "@/lib/types";

export default function EditClassifierPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  const [classifier, setClassifier] = useState<ClassifierOut | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [belowThresholdAction, setBelowThresholdAction] =
    useState<BelowThresholdAction>("flag_for_review");
  const [questions, setQuestions] = useState<EditableQuestion[]>([]);

  const [aiDescription, setAiDescription] = useState("");
  const [aiDrafting, setAiDrafting] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api
      .getClassifier(id)
      .then((c) => {
        setClassifier(c);
        setName(c.name);
        setDescription(c.description ?? "");
        setBelowThresholdAction(c.below_threshold_action);
        setQuestions(c.questions.map(questionOutToEditable));
      })
      .catch((e) =>
        setLoadError(e instanceof ApiError ? e.message : "Failed to load classifier")
      );
  }, [id]);

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const updated = await api.updateClassifier(id, {
        name,
        description: description || null,
        below_threshold_action: belowThresholdAction,
        questions: questions.map(editableToQuestionIn),
      });
      setClassifier(updated);
      setSaved(true);
    } catch (e) {
      setSaveError(e instanceof ApiError ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this classifier? This cannot be undone.")) return;
    try {
      await api.deleteClassifier(id);
      router.push("/dashboard");
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Failed to delete");
    }
  }

  async function handleAiDraft() {
    if (!classifier || !aiDescription.trim()) return;
    setAiDrafting(true);
    setAiNote(null);
    try {
      const result = await api.draftAi({
        description: aiDescription.trim(),
        template_type: classifier.template_type,
      });
      setQuestions((prev) => [...prev, ...result.questions.map(questionInToEditable)]);
      setAiNote(result.note ?? "Draft questions added below — review before saving.");
    } catch (e) {
      setAiNote(e instanceof ApiError ? e.message : "AI draft failed");
    } finally {
      setAiDrafting(false);
    }
  }

  if (loadError) {
    return <p className="text-sm text-danger">{loadError}</p>;
  }
  if (!classifier) {
    return <p className="copy text-ink-mute">Loading the classifier...</p>;
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <ClassifierPageHeader
        id={id}
        current="edit"
        kicker="Editor"
        title={classifier.name}
        meta={
          <>
            <TemplateTypeHint type={classifier.template_type} />
            <StatusBadge status={classifier.status} />
          </>
        }
      />

      <section className="card flex flex-col gap-5 p-5 sm:p-6">
        <p className="kicker">The brief</p>
        <div className="flex flex-col gap-1.5">
          <label className="label">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="field"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="label">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="field resize-none"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="label">When confidence falls short</label>
          <select
            value={belowThresholdAction}
            onChange={(e) => setBelowThresholdAction(e.target.value as BelowThresholdAction)}
            className="field max-w-md"
          >
            <option value="flag_for_review">Flag the response for review</option>
            <option value="return_as_is">Return the answer as-is</option>
          </select>
        </div>
      </section>

      <section className="card flex flex-col gap-4 p-5 sm:p-6">
        <div>
          <p className="kicker">Optional</p>
          <h2 className="display-card mt-2">Draft questions with AI</h2>
          <p className="mt-1 text-[15px] leading-6 text-ink-mute">
            Describe the decision in plain English. Review anything it drafts before you save.
          </p>
        </div>
        <textarea
          value={aiDescription}
          onChange={(e) => setAiDescription(e.target.value)}
          rows={3}
          placeholder="What should this classifier check for?"
          className="field resize-none"
        />
        <button
          type="button"
          onClick={handleAiDraft}
          disabled={aiDrafting || !aiDescription.trim()}
          className="btn btn-ghost w-fit"
        >
          {aiDrafting ? "Drafting..." : "Draft with AI"}
        </button>
        {aiNote && <p className="copy text-ink-mute">{aiNote}</p>}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="kicker">The questions</p>
            <h2 className="display-section mt-1">What Jev should decide</h2>
          </div>
          <button
            type="button"
            onClick={() => setQuestions((prev) => [...prev, makeBlankEditable()])}
            className="btn btn-ghost w-fit"
          >
            <Plus size={16} strokeWidth={2} aria-hidden="true" />
            Add question
          </button>
        </div>
        {questions.length === 0 && (
          <p className="copy text-ink-mute">No questions yet — add at least one.</p>
        )}
        {questions.map((q, i) => (
          <QuestionEditor
            key={q.uid}
            index={i}
            question={q}
            onChange={(next) =>
              setQuestions((prev) => prev.map((p, idx) => (idx === i ? next : p)))
            }
            onRemove={() => setQuestions((prev) => prev.filter((_, idx) => idx !== i))}
          />
        ))}
      </section>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn btn-copper text-[14px] font-semibold"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        {saved && <span className="text-sm text-moss">Saved.</span>}
        {saveError && <span className="text-sm text-danger">{saveError}</span>}
        <button
          type="button"
          onClick={handleDelete}
          className="ml-auto text-sm text-ink-mute transition-colors hover:text-danger"
        >
          Delete classifier
        </button>
      </div>
    </div>
  );
}
