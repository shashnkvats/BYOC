import type { EditableQuestion } from "@/components/QuestionEditor";
import { FLAG_KEY_MAX, FLAG_KEY_PATTERN, isValidFlagKey } from "@/lib/guardrail-seed";
import type { McpDiscoveredTool } from "@/lib/types";

export function toolNameToKey(name: string): string {
  let key = name
    .trim()
    .replace(/[^A-Za-z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  if (!key) key = "tool";
  if (key.length > FLAG_KEY_MAX) key = key.slice(0, FLAG_KEY_MAX);
  if (!FLAG_KEY_PATTERN.test(key)) key = "tool";
  return key;
}

export function uniqueToolKey(name: string, used: Set<string>): string {
  const base = toolNameToKey(name);
  let key = base;
  let n = 2;
  while (used.has(key)) {
    const suffix = `_${n}`;
    key = `${base.slice(0, Math.max(1, FLAG_KEY_MAX - suffix.length))}${suffix}`;
    n += 1;
  }
  return key;
}

export function mergeImportedTools(
  existing: EditableQuestion["choicePairs"],
  selected: McpDiscoveredTool[],
): EditableQuestion["choicePairs"] {
  const next = existing.map((pair) => ({ ...pair }));
  const used = new Set(
    next.map((pair) => pair.key.trim()).filter((key) => isValidFlagKey(key)),
  );

  for (const tool of selected) {
    const base = toolNameToKey(tool.name);
    if (used.has(base)) continue;
    const key = uniqueToolKey(tool.name, used);
    used.add(key);
    const value =
      tool.description.trim() || `Use this tool when the request matches ${tool.name}.`;
    const emptyIdx = next.findIndex((pair) => !pair.key.trim() && !pair.value.trim());
    if (emptyIdx >= 0) next[emptyIdx] = { key, value };
    else next.push({ key, value });
  }

  while (next.length < 2) next.push({ key: "", value: "" });
  return next;
}
