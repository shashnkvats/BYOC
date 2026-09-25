import type { EditableQuestion } from "@/components/QuestionEditor";
import type { QuestionIn, QuestionOut } from "./types";

let uidCounter = 0;
function nextUid() {
  uidCounter += 1;
  return `q_${Date.now()}_${uidCounter}`;
}

export function questionOutToEditable(q: QuestionOut): EditableQuestion {
  return questionInToEditable(q);
}

export function questionInToEditable(q: QuestionIn): EditableQuestion {
  if (q.type === "score") {
    const levels = Array.isArray(q.criteria) ? q.criteria : Object.values(q.criteria);
    return {
      uid: nextUid(),
      key: q.key,
      type: q.type,
      instructions: q.instructions,
      confidence_threshold: q.confidence_threshold,
      choicePairs: [],
      scoreLevels: levels.length > 0 ? levels : ["", ""],
    };
  }
  const record = Array.isArray(q.criteria) ? {} : q.criteria;
  const pairs = Object.entries(record).map(([key, value]) => ({ key, value }));
  return {
    uid: nextUid(),
    key: q.key,
    type: q.type,
    instructions: q.instructions,
    confidence_threshold: q.confidence_threshold,
    choicePairs: pairs.length > 0 ? pairs : [{ key: "", value: "" }],
    scoreLevels: [],
  };
}

export function editableToQuestionIn(q: EditableQuestion): QuestionIn {
  if (q.type === "score") {
    return {
      key: q.key,
      type: q.type,
      instructions: q.instructions,
      confidence_threshold: q.confidence_threshold,
      criteria: q.scoreLevels,
    };
  }
  const criteria: Record<string, string> = {};
  for (const pair of q.choicePairs) {
    if (pair.key.trim()) criteria[pair.key.trim()] = pair.value;
  }
  return {
    key: q.key,
    type: q.type,
    instructions: q.instructions,
    confidence_threshold: q.confidence_threshold,
    criteria,
  };
}

export function makeBlankEditable(): EditableQuestion {
  return {
    uid: nextUid(),
    key: "",
    type: "noul",
    instructions: "",
    confidence_threshold: 0.6,
    choicePairs: [
      { key: "true", value: "" },
      { key: "false", value: "" },
    ],
    scoreLevels: [],
  };
}
