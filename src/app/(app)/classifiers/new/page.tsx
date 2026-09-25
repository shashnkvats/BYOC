"use client";

import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { EditableQuestion, QuestionEditor } from "@/components/QuestionEditor";
import { api, ApiError } from "@/lib/api-client";
import {
  editableToQuestionIn,
  makeBlankEditable,
  questionInToEditable,
} from "@/lib/question-convert";
import { TEMPLATE_QUESTIONS } from "@/lib/template-questions";
import { TEMPLATE_META, TemplateIcon } from "@/lib/templates";
import type { TemplateType } from "@/lib/types";

const TEMPLATES = (Object.keys(TEMPLATE_META) as TemplateType[]).map((id) => ({
  id,
  ...TEMPLATE_META[id],
}));

function isTemplateType(value: string | null): value is TemplateType {
  return value !== null && value in TEMPLATE_META;
}

function WizardSteps({
  current,
  template,
}: {
  current: 1 | 2 | 3;
  template?: TemplateType;
}) {
  const steps = [
    { n: 1 as const, label: "Choose a start", href: "/classifiers/new" },
    {
      n: 2 as const,
      label: "Name it",
      href: template ? `/classifiers/new?from=${template}` : undefined,
    },
    { n: 3 as const, label: "Questions" },
  ];

  return (
    <ol className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
      {steps.map((step, i) => {
        const active = current === step.n;
        const done = current > step.n;
        const label = (
          <span className="inline-flex items-center gap-2.5">
            <span
              className={`font-mono text-[0.7rem] tracking-[0.12em] ${
                active ? "text-copper" : "text-ink-mute"
              }`}
            >
              {String(step.n).padStart(2, "0")}
            </span>
            <span
              className={`text-[14px] ${
                active ? "font-medium text-ink" : "text-ink-mute"
              }`}
            >
              {step.label}
            </span>
          </span>
        );

        return (
          <li key={step.n} className="flex items-center gap-5">
            {i > 0 && <span className="hidden h-px w-6 bg-line sm:block" aria-hidden="true" />}
            {done && step.href ? (
              <Link href={step.href} className="no-underline">
                {label}
              </Link>
            ) : (
              label
            )}
          </li>
        );
      })}
    </ol>
  );
}

function WizardHeader({
  current,
  template,
  lede,
}: {
  current: 1 | 2 | 3;
  template?: TemplateType;
  lede: string;
}) {
  return (
    <>
      <p className="kicker">New work</p>
      <h1 className="display-page mt-1">New classifier</h1>
      <p className="mt-2.5 max-w-lg text-[15px] font-normal leading-6 text-ink-mute">
        {lede}
      </p>
      <WizardSteps current={current} template={template} />
    </>
  );
}

function ChooseStart() {
  return (
    <div className="mx-auto max-w-3xl">
      <WizardHeader
        current={1}
        lede="Choose how to start. You will name it, then write the questions."
      />
      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {TEMPLATES.map((t) => (
          <Link
            key={t.id}
            href={`/classifiers/new?from=${t.id}`}
            className="card p-5 no-underline transition-[border-color,transform] duration-150 hover:-translate-y-px hover:border-ink/20"
          >
            <p className="text-copper">
              <TemplateIcon type={t.id} />
            </p>
            <h2 className="display-card mt-2">{t.label}</h2>
            <p className="copy mt-1 text-ink-mute">{t.blurb}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function NameIt({
  template,
  name,
  description,
  onName,
  onDescription,
  onContinue,
}: {
  template: TemplateType;
  name: string;
  description: string;
  onName: (value: string) => void;
  onDescription: (value: string) => void;
  onContinue: () => void;
}) {
  const meta = TEMPLATE_META[template];
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Give your classifier a name.");
      return;
    }
    setError(null);
    onContinue();
  }

  return (
    <div className="mx-auto max-w-3xl">
      <WizardHeader
        current={2}
        template={template}
        lede="Name the decision. Next you will write what Jev should decide."
      />
      <form onSubmit={handleSubmit} className="mt-8">
        <section className="card flex flex-col gap-5 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-copper">
              <TemplateIcon type={template} />
            </span>
            <div>
              <p className="text-[15px] font-medium text-ink">{meta.label}</p>
              <p className="mt-0.5 text-[13px] leading-5 text-ink-mute">{meta.blurb}</p>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="label">
              Name
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => onName(e.target.value)}
              placeholder="e.g. Amazon shopping assistant guardrail"
              className="field"
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="label">
              Description
              <span className="ml-1 font-normal tracking-normal text-ink-mute normal-case">
                optional
              </span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => onDescription(e.target.value)}
              rows={3}
              placeholder="What decision should this classifier make?"
              className="field resize-none"
            />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className="btn btn-copper w-fit text-[14px] font-semibold">
              Continue
            </button>
            <Link
              href="/classifiers/new"
              className="inline-flex items-center gap-1.5 text-sm text-ink-mute no-underline hover:text-ink"
            >
              <ArrowLeft size={14} strokeWidth={1.5} aria-hidden="true" />
              Back
            </Link>
          </div>
        </section>
      </form>
    </div>
  );
}

function WriteQuestions({
  template,
  name,
  description,
  questions,
  onQuestions,
}: {
  template: TemplateType;
  name: string;
  description: string;
  questions: EditableQuestion[];
  onQuestions: (next: EditableQuestion[]) => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate() {
    if (!name.trim()) {
      setError("Go back and give your classifier a name.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.createClassifier({
        name: name.trim(),
        description: description.trim() || null,
        template_type: template,
        questions: questions.map(editableToQuestionIn),
      });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create classifier");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <WizardHeader
        current={3}
        template={template}
        lede="Starter questions for this type. Edit them here — this is the last step."
      />

      <div className="mt-8 flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="kicker">The questions</p>
            <h2 className="display-section mt-1">What Jev should decide</h2>
          </div>
          <button
            type="button"
            onClick={() => onQuestions([...questions, makeBlankEditable()])}
            className="btn btn-ghost w-fit"
          >
            <Plus size={16} strokeWidth={2} aria-hidden="true" />
            Add question
          </button>
        </div>

        {questions.length === 0 && (
          <p className="copy text-ink-mute">No questions yet — add at least one, or create a blank classifier.</p>
        )}

        {questions.map((q, i) => (
          <QuestionEditor
            key={q.uid}
            index={i}
            question={q}
            onChange={(next) =>
              onQuestions(questions.map((p, idx) => (idx === i ? next : p)))
            }
            onRemove={() => onQuestions(questions.filter((_, idx) => idx !== i))}
          />
        ))}

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleCreate}
            disabled={submitting}
            className="btn btn-copper w-fit text-[14px] font-semibold"
          >
            {submitting ? "Creating..." : "Create"}
          </button>
          <Link
            href={`/classifiers/new?from=${template}`}
            className="inline-flex items-center gap-1.5 text-sm text-ink-mute no-underline hover:text-ink"
          >
            <ArrowLeft size={14} strokeWidth={1.5} aria-hidden="true" />
            Back
          </Link>
        </div>
      </div>
    </div>
  );
}

function NewClassifierWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const step = searchParams.get("step");
  const template = isTemplateType(from) ? from : null;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<EditableQuestion[]>([]);
  const seededFor = useRef<TemplateType | null>(null);

  useEffect(() => {
    if (!template) {
      seededFor.current = null;
      return;
    }
    if (seededFor.current === template) return;
    setQuestions(TEMPLATE_QUESTIONS[template].map(questionInToEditable));
    seededFor.current = template;
  }, [template]);

  if (!template) {
    return <ChooseStart />;
  }

  if (step === "questions") {
    return (
      <WriteQuestions
        template={template}
        name={name}
        description={description}
        questions={questions}
        onQuestions={setQuestions}
      />
    );
  }

  return (
    <NameIt
      template={template}
      name={name}
      description={description}
      onName={setName}
      onDescription={setDescription}
      onContinue={() =>
        router.push(`/classifiers/new?from=${template}&step=questions`)
      }
    />
  );
}

export default function NewClassifierPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl">
          <p className="kicker">New work</p>
          <h1 className="display-page mt-1">New classifier</h1>
        </div>
      }
    >
      <NewClassifierWizard />
    </Suspense>
  );
}
