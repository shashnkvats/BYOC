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
  onChange,
  onRemove,
}: {
  question: EditableQuestion;
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
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">
              Key (used in the response JSON)
            </label>
            <input
              value={question.key}
              onChange={(e) => set("key", e.target.value)}
              placeholder="e.g. is_out_of_scope"
              className="rounded-md border border-gray-300 px-2.5 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Type</label>
            <select
              value={question.type}
              onChange={(e) => setType(e.target.value as QuestionType)}
              className="rounded-md border border-gray-300 px-2.5 py-1.5 text-sm"
            >
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="mt-5 text-sm text-red-600 hover:underline"
        >
          Remove
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">
          Instructions - the plain-English question Jev should answer
        </label>
        <textarea
          value={question.instructions}
          onChange={(e) => set("instructions", e.target.value)}
          rows={2}
          className="rounded-md border border-gray-300 px-2.5 py-1.5 text-sm"
        />
      </div>

      <div className="mt-3">
        {question.type === "score" ? (
          <ScoreLevelsEditor question={question} onChange={onChange} />
        ) : (
          <ChoicePairsEditor question={question} onChange={onChange} />
        )}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <label className="text-xs font-medium text-gray-500">
          Confidence threshold ({question.confidence_threshold.toFixed(2)})
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={question.confidence_threshold}
          onChange={(e) => set("confidence_threshold", Number(e.target.value))}
          className="w-40"
        />
        <span className="text-xs text-gray-400">
          Below this, the response is flagged <code>needs_review</code>.
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
      <label className="text-xs font-medium text-gray-500">{label}</label>
      {question.choicePairs.map((pair, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={pair.key}
            onChange={(e) => updatePair(i, "key", e.target.value)}
            placeholder={question.type === "noul" ? "true / false" : "option_key"}
            disabled={question.type === "noul"}
            className="w-36 rounded-md border border-gray-300 px-2.5 py-1.5 text-sm disabled:bg-gray-100"
          />
          <input
            value={pair.value}
            onChange={(e) => updatePair(i, "value", e.target.value)}
            placeholder="plain-English description"
            className="flex-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-sm"
          />
          {question.type !== "noul" && (
            <button
              type="button"
              onClick={() => removePair(i)}
              className="text-sm text-gray-400 hover:text-red-600"
            >
              ✕
            </button>
          )}
        </div>
      ))}
      {question.type !== "noul" && (
        <button
          type="button"
          onClick={addPair}
          className="w-fit text-sm text-gray-600 underline"
        >
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
      <label className="text-xs font-medium text-gray-500">
        Levels, ordered low to high
      </label>
      {question.scoreLevels.map((level, i) => (
        <div key={i} className="flex gap-2">
          <span className="w-6 pt-1.5 text-xs text-gray-400">{i}</span>
          <input
            value={level}
            onChange={(e) => updateLevel(i, e.target.value)}
            placeholder={`Level ${i} label`}
            className="flex-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={() => removeLevel(i)}
            className="text-sm text-gray-400 hover:text-red-600"
          >
            ✕
          </button>
        </div>
      ))}
      <button type="button" onClick={addLevel} className="w-fit text-sm text-gray-600 underline">
        + Add level
      </button>
    </div>
  );
}
