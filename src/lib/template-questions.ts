import type { QuestionIn, TemplateType } from "./types";

/** Mirrors backend/app/templates.py — keep in sync. */
export const TEMPLATE_QUESTIONS: Record<TemplateType, QuestionIn[]> = {
  guardrail: [
    {
      key: "is_out_of_scope",
      type: "noul",
      instructions:
        "Does this message ask for something outside what this assistant is meant to help with?",
      criteria: {
        true: "Off-topic, unrelated to the assistant's purpose",
        false: "Within the assistant's intended scope",
      },
      confidence_threshold: 0.6,
    },
    {
      key: "is_harmful",
      type: "noul",
      instructions:
        "Does this message ask for something harmful, dangerous, or against policy?",
      criteria: {
        true: "Harmful, dangerous, or policy-violating request",
        false: "Not harmful",
      },
      confidence_threshold: 0.7,
    },
  ],
  agent_routing: [
    {
      key: "target_agent",
      type: "choice",
      instructions: "Which agent should handle this request?",
      criteria: {
        general_assistant: "General questions and conversation",
        specialist_agent_1: "Describe this agent's specialty",
        specialist_agent_2: "Describe this agent's specialty",
      },
      confidence_threshold: 0.6,
    },
  ],
  mcp_tool_routing: [
    {
      key: "target_tool",
      type: "choice",
      instructions: "Which tool should run next for this request?",
      criteria: {
        tool_one: "Describe what this tool does and when to use it",
        tool_two: "Describe what this tool does and when to use it",
      },
      confidence_threshold: 0.6,
    },
  ],
  model_routing: [
    {
      key: "target_model",
      type: "choice",
      instructions: "Which model is the best fit for this request?",
      criteria: {
        fast_cheap_model: "Simple requests, low latency/cost priority",
        powerful_model: "Complex reasoning, high-stakes accuracy",
      },
      confidence_threshold: 0.6,
    },
  ],
  custom: [],
};
