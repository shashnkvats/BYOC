"use client";

import { createSupabaseBrowserClient } from "./supabase/browser";
import type {
  ClassifierOut,
  ClassifierSummary,
  DraftAIResponse,
  LogOut,
  PublishResponse,
  QuestionIn,
  TemplateType,
  TestResponse,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8001";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function authHeader(): Promise<Record<string, string>> {
  const supabase = createSupabaseBrowserClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const { auth = true, headers, ...rest } = options;
  const authHeaders = auth ? await authHeader() : {};

  const resp = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...headers,
    },
  });

  if (!resp.ok) {
    let detail = resp.statusText;
    try {
      const body = await resp.json();
      detail = body.detail ?? detail;
    } catch {
      // ignore non-JSON error bodies
    }
    throw new ApiError(resp.status, typeof detail === "string" ? detail : JSON.stringify(detail));
  }

  if (resp.status === 204) return undefined as T;
  return resp.json() as Promise<T>;
}

export const api = {
  listClassifiers: () => request<ClassifierSummary[]>("/classifiers"),

  getClassifier: (id: string) => request<ClassifierOut>(`/classifiers/${id}`),

  createClassifier: (payload: {
    name: string;
    description?: string | null;
    template_type: TemplateType;
    questions?: QuestionIn[];
    below_threshold_action?: string;
  }) =>
    request<ClassifierOut>("/classifiers", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateClassifier: (
    id: string,
    payload: Partial<{
      name: string;
      description: string | null;
      jev_model_version: string;
      questions: QuestionIn[];
      below_threshold_action: string;
    }>
  ) =>
    request<ClassifierOut>(`/classifiers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  deleteClassifier: (id: string) =>
    request<void>(`/classifiers/${id}`, { method: "DELETE" }),

  testClassifier: (
    id: string,
    payload: { state: string; questions?: QuestionIn[]; model?: string }
  ) =>
    request<TestResponse>(`/classifiers/${id}/test`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  publishClassifier: (id: string) =>
    request<PublishResponse>(`/classifiers/${id}/publish`, { method: "POST" }),

  listLogs: (id: string) => request<LogOut[]>(`/classifiers/${id}/logs`),

  draftAi: (payload: { description: string; template_type: TemplateType }) =>
    request<DraftAIResponse>("/ai/draft", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
