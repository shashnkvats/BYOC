"""Thin async client for Jev (TypeSafe AI's "System One" model).

Jev has exactly one evaluation endpoint - `POST /v1/systemone` - taking
`{model, state, questions}` and returning typed answers. No chat, no
streaming. See https://learnjev.com and https://jevapi.org/docs/.

Token budget: per TypeSafe's docs (as republished by the pydantic-ai
integration), `jev-1.13` allows ~64k tokens for state+questions combined,
with state alone capped around 32k. We don't have a real tokenizer here, so
we use a conservative chars/4 heuristic and warn well before the real
limit, rather than trying to be exact.
"""

from __future__ import annotations

import time
from typing import Any

import httpx

from .config import get_settings

MAX_STATE_TOKENS = 32_000
MAX_TOTAL_TOKENS = 64_000
CHARS_PER_TOKEN_ESTIMATE = 4


class JevConfigError(RuntimeError):
    """Raised when Jev is called without a configured API key."""


class JevAPIError(RuntimeError):
    """Raised when the Jev API returns a non-2xx response."""

    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail
        super().__init__(f"Jev API error {status_code}: {detail}")


def estimate_tokens(text: str) -> int:
    return max(1, len(text) // CHARS_PER_TOKEN_ESTIMATE)


def check_token_budget(state: str, questions: dict[str, Any]) -> list[str]:
    """Return a list of human-readable warnings (empty if within budget)."""
    warnings: list[str] = []
    state_tokens = estimate_tokens(state)
    questions_tokens = estimate_tokens(str(questions))
    total = state_tokens + questions_tokens

    if state_tokens > MAX_STATE_TOKENS:
        warnings.append(
            f"state is ~{state_tokens} tokens (estimated), over Jev's ~{MAX_STATE_TOKENS} "
            "token guidance for state alone. Consider trimming/summarizing before sending."
        )
    if total > MAX_TOTAL_TOKENS:
        warnings.append(
            f"state + questions is ~{total} tokens (estimated), over Jev's ~{MAX_TOTAL_TOKENS} "
            "combined token limit. The request may fail with max_tokens_exceeded."
        )
    return warnings


async def call_jev(
    *,
    state: str,
    questions: dict[str, dict[str, Any]],
    model: str | None = None,
    timeout_s: float = 30.0,
) -> dict[str, Any]:
    """Call Jev's /v1/systemone endpoint.

    `questions` maps a caller-chosen key -> {"type", "instructions", "criteria"}.
    Returns the raw parsed JSON response: {"model", "answers", "usage", ...}.
    """
    settings = get_settings()
    if not settings.typesafe_api_key:
        raise JevConfigError(
            "TYPESAFE_API_KEY is not set on the backend. Add it to backend/.env "
            "(get one from console.typesafe.ai -> Settings -> Keys)."
        )

    body = {
        "model": model or settings.typesafe_default_model,
        "state": state,
        "questions": questions,
    }

    async with httpx.AsyncClient(timeout=timeout_s) as client:
        resp = await client.post(
            settings.typesafe_base_url,
            headers={
                "Authorization": f"Bearer {settings.typesafe_api_key}",
                "Content-Type": "application/json",
            },
            json=body,
        )

    if resp.status_code >= 400:
        raise JevAPIError(resp.status_code, resp.text)

    return resp.json()


async def call_jev_timed(
    *,
    state: str,
    questions: dict[str, dict[str, Any]],
    model: str | None = None,
) -> tuple[dict[str, Any], int]:
    """Same as call_jev, but also returns latency in milliseconds."""
    start = time.perf_counter()
    result = await call_jev(state=state, questions=questions, model=model)
    latency_ms = int((time.perf_counter() - start) * 1000)
    return result, latency_ms
