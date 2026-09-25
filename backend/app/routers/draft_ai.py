"""Optional "auto-draft from a paragraph" builder assist.

This is the ONLY place in the app that calls a text-generating LLM - Jev
itself cannot do this (it never generates free text). It's entirely
optional: if AI_GATEWAY_API_KEY isn't set, this endpoint returns a clear
501 and the guided form (writing `instructions`/`criteria` directly) still
works on its own.
"""

from __future__ import annotations

import json

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import ValidationError

from ..config import Settings, get_settings
from ..deps import CurrentUser, get_current_user
from ..schemas import DraftAIRequest, DraftAIResponse, QuestionIn

router = APIRouter(prefix="/ai", tags=["ai-assist"])

SYSTEM_PROMPT = """You help configure a "Jev" classifier. Jev is a fast, non-generative \
decision model with exactly three question types:
- noul: yes/no, criteria is {"true": "...", "false": "..."}
- choice: pick one option, criteria is {"option_key": "description", ...} (2+ options)
- score: ordered scale, criteria is ["Level 0 label", "Level 1 label", ...] (2+ levels)

Given a user's plain-English description of what they want to classify, output ONLY a \
JSON array (no prose, no markdown fences) of question objects, each with exactly these \
fields: "key" (snake_case identifier), "type" (one of noul/choice/score), "instructions" \
(the plain-English question Jev should answer), "criteria" (matching the shape for that \
type), and "confidence_threshold" (a float between 0 and 1, default 0.6, higher for \
higher-stakes decisions). Prefer 1-3 focused questions over one compound question - Jev \
answers a single, narrow judgment far better than a question that weighs several things \
at once."""


@router.post("/draft", response_model=DraftAIResponse)
async def draft_from_description(
    payload: DraftAIRequest,
    _user: CurrentUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> DraftAIResponse:
    if not settings.ai_gateway_api_key:
        raise HTTPException(
            status_code=501,
            detail=(
                "AI auto-draft isn't configured on this backend. Set AI_GATEWAY_API_KEY "
                "in backend/.env to enable it, or just fill in the question form manually "
                "- Jev's instructions/criteria fields are plain English, no AI required."
            ),
        )

    user_prompt = (
        f"Template type: {payload.template_type}\n\n"
        f"What the user wants to classify:\n{payload.description}"
    )

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"{settings.ai_gateway_base_url.rstrip('/')}/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.ai_gateway_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.ai_gateway_model,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": 0.2,
            },
        )

    if resp.status_code >= 400:
        raise HTTPException(
            status_code=502, detail=f"AI gateway error {resp.status_code}: {resp.text}"
        )

    body = resp.json()
    try:
        content = body["choices"][0]["message"]["content"]
    except (KeyError, IndexError) as exc:
        raise HTTPException(
            status_code=502, detail="AI gateway returned an unexpected response shape"
        ) from exc

    content = content.strip()
    if content.startswith("```"):
        content = content.strip("`")
        if content.startswith("json"):
            content = content[4:]

    try:
        raw_questions = json.loads(content)
        questions = [QuestionIn(**q) for q in raw_questions]
    except (json.JSONDecodeError, ValidationError, TypeError) as exc:
        raise HTTPException(
            status_code=502,
            detail=(
                "The AI assist returned something that didn't match the question "
                f"schema ({exc}). Try rephrasing your description, or fill in the form "
                "manually."
            ),
        ) from exc

    return DraftAIResponse(
        questions=questions,
        note="AI-drafted - review and edit before saving, especially wording and criteria.",
    )
