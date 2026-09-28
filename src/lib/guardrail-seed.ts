import type { QuestionIn } from "./types";
import { TEMPLATE_QUESTIONS } from "./template-questions";

export const FLAG_KEY_PATTERN = /^[A-Za-z0-9_]+$/;
export const FLAG_KEY_MAX = 64;

const DEFAULT_SCOPE = TEMPLATE_QUESTIONS.guardrail[0];

function noulCriteria(question: QuestionIn): Record<string, string> {
  return !Array.isArray(question.criteria) ? question.criteria : {};
}

export function isValidFlagKey(value: string): boolean {
  const key = value.trim();
  return key.length >= 1 && key.length <= FLAG_KEY_MAX && FLAG_KEY_PATTERN.test(key);
}

export function exampleFlagLabel(value: string): string {
  return isValidFlagKey(value) ? value.trim().toUpperCase() : "YOUR_FLAG";
}

/** Heading for the configure card, derived from the Step 2 name. */
export function guardrailCheckTitle(name: string): string {
  const raw = name.trim();
  if (!raw) return "Is this out of scope?";

  const stripped = raw
    .replace(/\b(guardrail|detector|classifier|checker|filter|model)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  const phrase = (stripped || raw).toLowerCase();
  return `Is this ${phrase}?`;
}

export function briefToYesNoQuestion(brief: string): string {
  let text = brief.trim().replace(/\s+/g, " ");
  if (!text) return DEFAULT_SCOPE.instructions;
  if (text.endsWith("?")) return text;

  text = text.replace(/\.$/, "");
  text = text.replace(
    /^(determine whether|check (?:if|whether)|detect (?:if|whether)|decide (?:if|whether)|evaluate whether)\s+/i,
    "",
  );
  text = text.replace(
    /^(the user's input|user(?:'s)? input|a user's input)\s+/i,
    "this message ",
  );
  text = text.replace(/^this message attempts /i, "this message attempt ");

  if (/^does /i.test(text)) return `${text}?`;
  if (/^this message /i.test(text)) return `Does ${text}?`;
  return `Does this message involve the following: ${text}?`;
}

/** One Noul question. Key is left empty — the user must name the flag. */
export function seedGuardrailQuestion(opts: {
  name?: string;
  description?: string;
}): QuestionIn {
  const description = opts.description?.trim() ?? "";
  const instructions = briefToYesNoQuestion(description);

  return {
    key: "",
    type: "noul",
    instructions,
    criteria: {
      true: description
        ? "The message matches the condition in the question"
        : (noulCriteria(DEFAULT_SCOPE).true ?? "Yes"),
      false: description
        ? "The message does not match the condition in the question"
        : (noulCriteria(DEFAULT_SCOPE).false ?? "No"),
    },
    confidence_threshold: 0.6,
  };
}
