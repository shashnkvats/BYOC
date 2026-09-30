"""Starter question sets for each classifier template.

These map to Jev's own documented preset decision patterns (tool-guard,
model-route, route, decide) - see jevai.org/docs. Users edit freely after
picking a template; nothing here is enforced beyond helping them start.
"""

from __future__ import annotations

from .schemas import QuestionIn

TEMPLATE_DEFAULTS: dict[str, list[QuestionIn]] = {
    "guardrail": [
        QuestionIn(
            key="is_out_of_scope",
            type="noul",
            instructions=(
                "Does this message ask for something outside what this assistant "
                "is meant to help with?"
            ),
            criteria={
                "true": "Off-topic, unrelated to the assistant's purpose",
                "false": "Within the assistant's intended scope",
            },
            confidence_threshold=0.6,
        ),
        QuestionIn(
            key="is_harmful",
            type="noul",
            instructions=(
                "Does this message ask for something harmful, dangerous, or "
                "against policy?"
            ),
            criteria={
                "true": "Harmful, dangerous, or policy-violating request",
                "false": "Not harmful",
            },
            confidence_threshold=0.7,
        ),
    ],
    "agent_routing": [
        QuestionIn(
            key="target_agent",
            type="choice",
            instructions="Which agent should handle this request?",
            criteria={
                "general_assistant": "General questions and conversation",
                "specialist_agent_1": "Describe this agent's specialty",
                "specialist_agent_2": "Describe this agent's specialty",
            },
            confidence_threshold=0.6,
        ),
    ],
    "mcp_tool_routing": [
        QuestionIn(
            key="target_tool",
            type="choice",
            instructions="Which tool should handle this request?",
            criteria={
                "search_web": "Search the web when the request requires current or external information.",
                "get_weather": "Get current weather conditions or forecasts for a location.",
            },
            confidence_threshold=0.6,
        ),
    ],
    "model_routing": [
        QuestionIn(
            key="target_model",
            type="choice",
            instructions="Which model is the best fit for this request?",
            criteria={
                "fast_model": "Simple, routine, low-complexity requests",
                "powerful_model": "Complex reasoning, coding, or high-stakes requests",
            },
            confidence_threshold=0.6,
        ),
    ],
    "custom": [],
}


def get_template_questions(template_type: str) -> list[QuestionIn]:
    return [q.model_copy(deep=True) for q in TEMPLATE_DEFAULTS.get(template_type, [])]
