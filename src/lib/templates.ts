import type { TemplateType } from "./types";

export const TEMPLATE_META: Record<
  TemplateType,
  { label: string; blurb: string; mark: string }
> = {
  guardrail: {
    label: "Guardrail",
    blurb:
      "Keep a chatbot on-topic and safe — e.g. stop a shopping assistant from writing code or recipes.",
    mark: "▣",
  },
  agent_routing: {
    label: "Agent / skill routing",
    blurb: "Pick which specialist agent or skill should handle a request.",
    mark: "↳",
  },
  mcp_tool_routing: {
    label: "MCP / tool selection",
    blurb: "Choose which tool should run next out of a dynamic tool list.",
    mark: "⬡",
  },
  model_routing: {
    label: "Model routing",
    blurb: "Route a request to a fast, cheap model or a more powerful one.",
    mark: "◇",
  },
  custom: {
    label: "Custom",
    blurb: "Start blank and add your own Choice, Score, or Noul questions.",
    mark: "·",
  },
};
