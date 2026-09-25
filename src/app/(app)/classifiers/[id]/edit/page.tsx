"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EditableQuestion, QuestionEditor } from "@/components/QuestionEditor";
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
      setAiNote(result.note ?? "Draft questions added below - review before saving.");
    } catch (e) {
      setAiNote(e instanceof ApiError ? e.message : "AI draft failed");
    } finally {
      setAiDrafting(false);
    }
  }

  if (loadError) {
    return <p className="text-sm text-red-600">{loadError}</p>;
  }
  if (!classifier) {
    return <p className="text-sm text-gray-500">Loading...</p>;
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{classifier.name}</h1>
          <p className="text-sm text-gray-500">
            Status: <span className="font-medium">{classifier.status}</span>
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <Link
            href={`/classifiers/${id}/playground`}
            className="rounded-md border border-gray-300 px-3 py-1.5"
          >
            Playground
          </Link>
          <Link
            href={`/classifiers/${id}/deploy`}
            className="rounded-md border border-gray-300 px-3 py-1.5"
          >
            Deploy
          </Link>
          <Link
            href={`/classifiers/${id}/logs`}
            className="rounded-md border border-gray-300 px-3 py-1.5"
          >
            Logs
          </Link>
        </div>
      </div>

      <section className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-md border border-gray-300 px-2.5 py-1.5 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="rounded-md border border-gray-300 px-2.5 py-1.5 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">When a question falls below its threshold</label>
          <select
            value={belowThresholdAction}
            onChange={(e) => setBelowThresholdAction(e.target.value as BelowThresholdAction)}
            className="w-fit rounded-md border border-gray-300 px-2.5 py-1.5 text-sm"
          >
            <option value="flag_for_review">Flag response as needs_review</option>
            <option value="return_as_is">Return the answer as-is</option>
          </select>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-dashed border-gray-300 bg-white p-4">
        <label className="text-sm font-medium">Optional: draft questions with AI</label>
        <textarea
          value={aiDescription}
          onChange={(e) => setAiDescription(e.target.value)}
          rows={3}
          placeholder="Describe in plain English what this classifier should check for..."
          className="rounded-md border border-gray-300 px-2.5 py-1.5 text-sm"
        />
        <button
          type="button"
          onClick={handleAiDraft}
          disabled={aiDrafting || !aiDescription.trim()}
          className="w-fit rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
        >
          {aiDrafting ? "Drafting..." : "Draft with AI"}
        </button>
        {aiNote && <p className="text-sm text-gray-500">{aiNote}</p>}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Questions</h2>
          <button
            type="button"
            onClick={() => setQuestions((prev) => [...prev, makeBlankEditable()])}
            className="text-sm underline"
          >
            + Add question
          </button>
        </div>
        {questions.length === 0 && (
          <p className="text-sm text-gray-500">No questions yet - add at least one.</p>
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
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        {saved && <span className="text-sm text-green-600">Saved.</span>}
        {saveError && <span className="text-sm text-red-600">{saveError}</span>}
        <button
          type="button"
          onClick={handleDelete}
          className="ml-auto text-sm text-red-600 hover:underline"
        >
          Delete classifier
        </button>
      </div>
    </div>
  );
}
