"""API key generation/hashing and Jev confidence -> needs_review logic.

Jev's own docs note that Noul answers carry no `confidence` field - only the
raw probability - so we derive an "effective confidence" the same way
TypeSafe's own pydantic-ai integration recommends: `abs(p - 0.5) * 2`, a
margin from the coin flip. Choice/Score answers already carry a `confidence`
field from Jev, which we use directly.
"""

from __future__ import annotations

import hashlib
import secrets
from typing import Any

API_KEY_PREFIX = "byoc_live_"


def generate_api_key() -> str:
    """Generate a new raw API key. Shown to the user exactly once."""
    return f"{API_KEY_PREFIX}{secrets.token_urlsafe(32)}"


def hash_api_key(raw_key: str) -> str:
    """Deterministic hash stored at rest; raw key is never persisted."""
    return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()


def effective_confidence(question_type: str, answer: dict[str, Any]) -> float | None:
    if question_type == "noul":
        p = answer.get("noul")
        if p is None:
            return None
        return abs(float(p) - 0.5) * 2
    # choice / score answers carry a real confidence field from Jev
    conf = answer.get("confidence")
    return float(conf) if conf is not None else None


def compute_flags(
    questions: list[dict[str, Any]], answers: dict[str, Any]
) -> tuple[list[dict[str, Any]], bool]:
    """Return (per-question flags, overall needs_review) given stored
    question configs (with confidence_threshold) and Jev's raw answers.
    """
    flags: list[dict[str, Any]] = []
    overall_needs_review = False

    by_key = {q["key"]: q for q in questions}
    for key, answer in answers.items():
        q = by_key.get(key)
        threshold = float(q.get("confidence_threshold", 0.6)) if q else 0.6
        q_type = q.get("type") if q else answer.get("type", "noul")
        conf = effective_confidence(q_type, answer)
        needs_review = conf is not None and conf < threshold
        if needs_review:
            overall_needs_review = True
        flags.append(
            {
                "key": key,
                "needs_review": needs_review,
                "effective_confidence": conf,
            }
        )

    return flags, overall_needs_review
