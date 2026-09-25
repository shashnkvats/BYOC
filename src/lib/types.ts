// Mirrors backend/app/schemas.py - keep in sync manually for now.

export type QuestionType = "choice" | "score" | "noul";
export type TemplateType =
  | "guardrail"
  | "agent_routing"
  | "mcp_tool_routing"
  | "model_routing"
  | "custom";
export type BelowThresholdAction = "return_as_is" | "flag_for_review";

/** choice/noul: {"option_key": "description"}. score: ["level 0", "level 1", ...] */
export type Criteria = Record<string, string> | string[];

export interface QuestionIn {
  key: string;
  type: QuestionType;
  instructions: string;
  criteria: Criteria;
  confidence_threshold: number;
}

export interface QuestionOut extends QuestionIn {
  id: string;
  position: number;
}

export interface ClassifierSummary {
  id: string;
  name: string;
  slug: string;
  template_type: TemplateType;
  status: "draft" | "published";
  updated_at: string;
}

export interface ClassifierOut {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  template_type: TemplateType;
  jev_model_version: string;
  status: "draft" | "published";
  below_threshold_action: BelowThresholdAction;
  questions: QuestionOut[];
  created_at: string;
  updated_at: string;
  has_api_key: boolean;
}

export interface QuestionAnswerFlag {
  key: string;
  needs_review: boolean;
  effective_confidence: number | null;
}

// biome-ignore-file: raw Jev answer shapes are intentionally loose (choice/score/noul differ)
export type JevAnswer = Record<string, unknown>;

export interface TestResponse {
  model: string;
  answers: Record<string, JevAnswer>;
  flags: QuestionAnswerFlag[];
  needs_review: boolean;
  usage: Record<string, unknown> | null;
  warnings: string[];
}

export interface PublishResponse {
  api_key: string;
  endpoint_path: string;
  classifier: ClassifierOut;
}

export interface LogOut {
  id: string;
  created_at: string;
  state_excerpt: string | null;
  answers: Record<string, JevAnswer> | null;
  needs_review: boolean;
  latency_ms: number | null;
  jev_model_version_used: string | null;
}

export interface DraftAIResponse {
  questions: QuestionIn[];
  note: string | null;
}
