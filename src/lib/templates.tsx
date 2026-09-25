import { Cpu, GitBranch, ShieldCheck, SlidersHorizontal, Wrench, type LucideIcon } from "lucide-react";
import type { TemplateType } from "./types";

export const TEMPLATE_ICONS: Record<TemplateType, LucideIcon> = {
  guardrail: ShieldCheck,
  agent_routing: GitBranch,
  mcp_tool_routing: Wrench,
  model_routing: Cpu,
  custom: SlidersHorizontal,
};

export const TEMPLATE_META: Record<
  TemplateType,
  { label: string; blurb: string; icon: LucideIcon }
> = {
  guardrail: {
    label: "Guardrail",
    blurb:
      "Keep a chatbot on-topic and safe — e.g. stop a shopping assistant from writing code or recipes.",
    icon: ShieldCheck,
  },
  agent_routing: {
    label: "Agent / skill routing",
    blurb: "Pick which specialist agent or skill should handle a request.",
    icon: GitBranch,
  },
  mcp_tool_routing: {
    label: "MCP / tool selection",
    blurb: "Choose which tool should run next out of a dynamic tool list.",
    icon: Wrench,
  },
  model_routing: {
    label: "Model routing",
    blurb: "Route a request to a fast, cheap model or a more powerful one.",
    icon: Cpu,
  },
  custom: {
    label: "Custom",
    blurb: "Start blank and add your own Choice, Score, or Noul questions.",
    icon: SlidersHorizontal,
  },
};

export function TemplateIcon({
  type,
  className = "text-copper",
}: {
  type: TemplateType;
  className?: string;
}) {
  const Icon = TEMPLATE_ICONS[type] ?? SlidersHorizontal;
  return <Icon size={18} strokeWidth={1.5} className={className} />;
}

export function TemplateTypeHint({
  type,
  className = "",
}: {
  type: TemplateType;
  className?: string;
}) {
  const meta = TEMPLATE_META[type];
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <TemplateIcon type={type} />
      <span className="copy text-ink-mute">{meta?.label ?? type}</span>
    </span>
  );
}
