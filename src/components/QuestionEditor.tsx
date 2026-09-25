"use client";

import type { QuestionType } from "@/lib/types";

export interface EditableQuestion {
  uid: string;
  key: string;
  type: QuestionType;
  instructions: string;
  confidence_threshold: number;
  /** used when type is "choice" or "noul" */
  choicePairs: { key: string; value: string }[];
  /** used when type is "score", ordered low -> high */
  scoreLevels: string[];
}

export function newEditableQuestion(uid: string): EditableQuestion {
  return {
    uid,
    key: "",
    type: "noul",
    instructions: "",
    confidence_threshold: 0.6,
    choicePairs: [
      { key: "true", value: "" },
      { key: "false", value: "" },
    ],
    scoreLevels: ["", ""],
  };
}

const TYPE_LABELS: Record<QuestionType, string> = {
  noul: "Noul (yes/no)",
  choice: "Choice (pick one)",
  score: "Score (ordered scale)",
};

export function QuestionEditor({
  question,
  index,
  onChange,
  onRemove,
}: {
  question: EditableQuestion;
  index: number;
  onChange: (next: EditableQuestion) => void;
  onRemove: () => void;
}) {
  function set<K extends keyof EditableQuestion>(field: K, value: EditableQuestion[K]) {
    onChange({ ...question, [field]: value });
  }

  function setType(type: QuestionType) {
    if (type === "score" && question.type !== "score") {
      onChange({ ...question, type, scoreLevels: ["", ""] });
    } else if (type !== "score" && question.type === "score") {
      onChange({
        ...question,
        type,
        choicePairs:
          type === "noul"
            ? [
                { key: "true", value: "" },
                { key: "false", value: "" },
              ]
            : [
                { key: "", value: "" },
                { key: "", value: "" },
              ],
      });
    } else {
      onChange({ ...question, type });
    }
  }

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-copper">
          {String(index + 1).padStart(2, "0")}
        </p>
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-ink-mute transition-colors hover:text-danger"
        >
          Remove
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="label">Key</label>
          <input
            value={question.key}
            onChange={(e) => set("key", e.target.value)}
            placeholder="e.g. is_out_of_scope"
            className="field font-mono text-xs"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="label">Type</label>
          <select
            value={question.type}
            onChange={(e) => setType(e.target.value as QuestionType)}
            className="field"
          >
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-1.5">
        <label className="label">The question Jev should answer</label>
        <textarea
          value={question.instructions}
          onChange={(e) => set("instructions", e.target.value)}
          rows={3}
          className="field resize-none"
        />
      </div>

      <div className="mt-4">
        {question.type === "score" ? (
          <ScoreLevelsEditor question={question} onChange={onChange} />
        ) : (
          <ChoicePairsEditor question={question} onChange={onChange} />
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line/80 pt-4">
        <label className="label">Confidence threshold</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={question.confidence_threshold}
          onChange={(e) => set("confidence_threshold", Number(e.target.value))}
          className="w-40"
        />
        <span className="font-mono text-sm text-copper">
          {question.confidence_threshold.toFixed(2)}
        </span>
        <span className="text-xs text-ink-mute">
          Below this, the answer is flagged for review.
        </span>
      </div>
    </div>
  );
}

function ChoicePairsEditor({
  question,
  onChange,
}: {
  question: EditableQuestion;
  onChange: (next: EditableQuestion) => void;
}) {
  const label = question.type === "noul" ? "Yes / no meanings" : "Options";

  function updatePair(index: number, field: "key" | "value", value: string) {
    const pairs = question.choicePairs.map((p, i) =>
      i === index ? { ...p, [field]: value } : p
    );
    onChange({ ...question, choicePairs: pairs });
  }

  function addPair() {
    onChange({ ...question, choicePairs: [...question.choicePairs, { key: "", value: "" }] });
  }

  function removePair(index: number) {
    onChange({
      ...question,
      choicePairs: question.choicePairs.filter((_, i) => i !== index),
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="label">
        {label}
      </label>
      {question.choicePairs.map((pair, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={pair.key}
            onChange={(e) => updatePair(i, "key", e.target.value)}
            placeholder={question.type === "noul" ? "true / false" : "option_key"}
            disabled={question.type === "noul"}
            className="field w-36 font-mono text-xs"
          />
          <input
            value={pair.value}
            onChange={(e) => updatePair(i, "value", e.target.value)}
            placeholder="plain-English description"
            className="field flex-1"
          />
          {question.type !== "noul" && (
            <button
              type="button"
              onClick={() => removePair(i)}
              className="text-xs text-ink-mute transition-colors hover:text-danger"
            >
              Remove
            </button>
          )}
        </div>
      ))}
      {question.type !== "noul" && (
        <button type="button" onClick={addPair} className="w-fit text-sm text-copper">
          + Add option
        </button>
      )}
    </div>
  );
}

function ScoreLevelsEditor({
  question,
  onChange,
}: {
  question: EditableQuestion;
  onChange: (next: EditableQuestion) => void;
}) {
  function updateLevel(index: number, value: string) {
    const levels = question.scoreLevels.map((l, i) => (i === index ? value : l));
    onChange({ ...question, scoreLevels: levels });
  }

  function addLevel() {
    onChange({ ...question, scoreLevels: [...question.scoreLevels, ""] });
  }

  function removeLevel(index: number) {
    onChange({ ...question, scoreLevels: question.scoreLevels.filter((_, i) => i !== index) });
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="label">
        Levels, ordered low to high
      </label>
      {question.scoreLevels.map((level, i) => (
        <div key={i} className="flex gap-2">
          <span className="w-6 pt-2 font-mono text-xs text-ink-mute">{i}</span>
          <input
            value={level}
            onChange={(e) => updateLevel(i, e.target.value)}
            placeholder={`Level ${i} label`}
            className="field flex-1"
          />
          <button
            type="button"
            onClick={() => removeLevel(i)}
            className="text-xs text-ink-mute transition-colors hover:text-danger"
          >
            Remove
          </button>
        </div>
      ))}
      <button type="button" onClick={addLevel} className="w-fit text-sm text-copper">
        + Add level
      </button>
    </div>
  );
}
