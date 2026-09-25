"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EditableQuestion, QuestionEditor } from "@/components/QuestionEditor";
import { ClassifierSubnav, StatusBadge } from "@/components/ui";
import { api, ApiError } from "@/lib/api-client";
import {
  editableToQuestionIn,
  makeBlankEditable,
  questionInToEditable,
  questionOutToEditable,
} from "@/lib/question-convert";
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="kicker">Editor</p>
          <h1 className="display-page mt-1">
            {classifier.name}
          </h1>
          <div className="mt-2">
            <StatusBadge status={classifier.status} />
          </div>
        </div>
        <ClassifierSubnav id={id} current="edit" />
      </div>

      <section className="card flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-1.5">
          <label className="label">
            Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="field"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="label">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="field"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="label">
            When a question falls below its threshold
          </label>
          <select
            value={belowThresholdAction}
            onChange={(e) => setBelowThresholdAction(e.target.value as BelowThresholdAction)}
            className="field w-fit"
          >
            <option value="flag_for_review">Flag response as needs_review</option>
            <option value="return_as_is">Return the answer as-is</option>
          </select>
        </div>
      </section>

      <section className="card flex flex-col gap-3 border-dashed p-5">
        <p className="kicker">Optional assist</p>
        <label className="display-card">Draft questions with AI</label>
        <textarea
          value={aiDescription}
          onChange={(e) => setAiDescription(e.target.value)}
          rows={3}
          placeholder="Describe in plain English what this classifier should check for..."
          className="field"
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
        <div className="flex items-center justify-between">
          <h2 className="display-section">Questions</h2>
          <button
            type="button"
            onClick={() => setQuestions((prev) => [...prev, makeBlankEditable()])}
            className="text-sm text-copper underline"
          >
            + Add question
          </button>
        </div>
        {questions.length === 0 && (
          <p className="copy text-ink-mute">No questions yet — add at least one.</p>
        )}
        {questions.map((q, i) => (
          <QuestionEditor
            key={q.uid}
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
          className="btn btn-primary"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        {saved && <span className="text-sm text-moss">Saved.</span>}
        {saveError && <span className="text-sm text-danger">{saveError}</span>}
        <button
          type="button"
          onClick={handleDelete}
          className="ml-auto text-sm text-danger hover:underline"
        >
          Delete classifier
        </button>
      </div>
    </div>
  );
}
