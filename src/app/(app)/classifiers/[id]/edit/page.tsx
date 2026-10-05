"use client";

import { Plus } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { GuardrailConfigure } from "@/components/GuardrailConfigure";
import { McpImportConnect } from "@/components/McpImportConnect";
import { McpImportSelect } from "@/components/McpImportSelect";
import {
  isValidToolSelector,
  McpToolSelectorConfigure,
  seedMcpToolSelector,
} from "@/components/McpToolSelectorConfigure";
import {
  isValidModelRouter,
  ModelRouterConfigure,
} from "@/components/ModelRouterConfigure";
import { EditableQuestion, QuestionEditor } from "@/components/QuestionEditor";
import { ClassifierPageHeader, StatusBadge } from "@/components/ui";
import { api, ApiError } from "@/lib/api-client";
import { isValidFlagKey, seedGuardrailQuestion } from "@/lib/guardrail-seed";
import { mergeImportedTools } from "@/lib/mcp-import";
import {
  editableToQuestionIn,
  makeBlankEditable,
  questionInToEditable,
  questionOutToEditable,
} from "@/lib/question-convert";
import { TEMPLATE_QUESTIONS } from "@/lib/template-questions";
import { TemplateTypeHint } from "@/lib/templates";
import type { BelowThresholdAction, ClassifierOut, McpDiscoverResponse } from "@/lib/types";

function EditorActions({
  saved,
  onDelete,
}: {
  saved: boolean;
  onDelete: () => void;
}) {
  return (
    <>
      {saved && <span className="text-sm text-moss">Saved.</span>}
      <button
        type="button"
        onClick={onDelete}
        className="ml-auto text-sm text-ink-mute transition-colors hover:text-danger"
      >
        Delete classifier
      </button>
    </>
  );
}

function EditClassifierPageInner() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const step = searchParams.get("step");

  const [classifier, setClassifier] = useState<ClassifierOut | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [belowThresholdAction, setBelowThresholdAction] =
    useState<BelowThresholdAction>("flag_for_review");
  const [questions, setQuestions] = useState<EditableQuestion[]>([]);
  const [discovered, setDiscovered] = useState<McpDiscoverResponse | null>(null);

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
        setLoadError(e instanceof ApiError ? e.message : "Failed to load classifier"),
      );
  }, [id]);

  function setFirstQuestion(next: EditableQuestion) {
    setQuestions((prev) => {
      if (prev.length === 0) return [next];
      return prev.map((q, i) => (i === 0 ? next : q));
    });
  }

  async function handleSave() {
    if (!classifier) return;
    if (classifier.template_type === "guardrail") {
      const q = questions[0];
      if (!q || !q.instructions.trim() || !isValidFlagKey(q.key)) {
        setSaveError("Add a yes/no question and a flag name.");
        return;
      }
    }
    if (classifier.template_type === "model_routing") {
      const q = questions[0];
      if (!q || !isValidModelRouter(q)) {
        setSaveError("Add a question, a response key, and at least two named routes.");
        return;
      }
    }
    if (classifier.template_type === "mcp_tool_routing") {
      const q = questions[0];
      if (!q || !isValidToolSelector(q)) {
        setSaveError("Add a question, a response key, and at least two named tools.");
        return;
      }
    }

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

  const header = (
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
  );

  const editorActions = <EditorActions saved={saved} onDelete={handleDelete} />;

  if (classifier.template_type === "mcp_tool_routing" && step === "mcp-import") {
    return (
      <div className="mx-auto max-w-[56rem]">
        {header}
        <div className="mt-8">
          <McpImportConnect
            onBack={() => router.push(`/classifiers/${id}/edit`)}
            onDiscovered={(result) => {
              setDiscovered(result);
              router.push(`/classifiers/${id}/edit?step=mcp-select`);
            }}
          />
        </div>
      </div>
    );
  }

  if (classifier.template_type === "mcp_tool_routing" && step === "mcp-select") {
    if (!discovered) {
      return (
        <div className="mx-auto max-w-[56rem]">
          {header}
          <div className="mt-8">
            <McpImportConnect
              onBack={() => router.push(`/classifiers/${id}/edit`)}
              onDiscovered={(result) => {
                setDiscovered(result);
                router.push(`/classifiers/${id}/edit?step=mcp-select`);
              }}
            />
          </div>
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-[56rem]">
        {header}
        <div className="mt-8">
          <McpImportSelect
            discovery={discovered}
            onBack={() => router.push(`/classifiers/${id}/edit?step=mcp-import`)}
            onCancel={() => router.push(`/classifiers/${id}/edit`)}
            onImport={(tools) => {
              setQuestions((prev) => {
                const current = prev[0] ?? seedMcpToolSelector();
                return [
                  {
                    ...current,
                    choicePairs: mergeImportedTools(current.choicePairs, tools),
                  },
                ];
              });
              router.push(`/classifiers/${id}/edit`);
            }}
          />
        </div>
      </div>
    );
  }

  if (classifier.template_type === "guardrail") {
    const question =
      questions[0] ??
      questionInToEditable(seedGuardrailQuestion({ name, description }));
    return (
      <GuardrailConfigure
        header={header}
        name={name}
        question={question}
        onQuestion={setFirstQuestion}
        error={saveError}
        submitting={saving}
        onCreate={handleSave}
        primaryLabel="Save"
        submittingLabel="Saving..."
        secondary={editorActions}
      />
    );
  }

  if (classifier.template_type === "model_routing") {
    const question =
      questions[0] ?? questionInToEditable(TEMPLATE_QUESTIONS.model_routing[0]);
    return (
      <ModelRouterConfigure
        header={header}
        question={question}
        onQuestion={setFirstQuestion}
        error={saveError}
        submitting={saving}
        onCreate={handleSave}
        primaryLabel="Save"
        submittingLabel="Saving..."
        secondary={editorActions}
      />
    );
  }

  if (classifier.template_type === "mcp_tool_routing") {
    const question = questions[0] ?? seedMcpToolSelector();
    return (
      <McpToolSelectorConfigure
        header={header}
        question={question}
        onQuestion={setFirstQuestion}
        error={saveError}
        submitting={saving}
        onCreate={handleSave}
        onImportFromServer={() => router.push(`/classifiers/${id}/edit?step=mcp-import`)}
        primaryLabel="Save"
        submittingLabel="Saving..."
        secondary={editorActions}
      />
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      {header}

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

export default function EditClassifierPage() {
  return (
    <Suspense fallback={<p className="copy text-ink-mute">Loading the classifier...</p>}>
      <EditClassifierPageInner />
    </Suspense>
  );
}
