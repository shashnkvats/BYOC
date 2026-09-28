import type { PublishResponse } from "./types";

const PREFIX = "byoc:publish:";

type Handoff = {
  api_key: string;
  endpoint_path: string;
};

export function stashPublishHandoff(id: string, published: PublishResponse) {
  if (typeof window === "undefined") return;
  const payload: Handoff = {
    api_key: published.api_key,
    endpoint_path: published.endpoint_path,
  };
  sessionStorage.setItem(`${PREFIX}${id}`, JSON.stringify(payload));
}

export function readPublishHandoff(id: string): Handoff | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(`${PREFIX}${id}`);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Handoff;
    if (!parsed.api_key || !parsed.endpoint_path) return null;
    return parsed;
  } catch {
    return null;
  }
}
