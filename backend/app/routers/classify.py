"""The public runtime endpoint. This is what an org's chatbot/agent calls.

No Supabase Auth/bearer token here - the classifier's own API key (in the
path) is the credential. We resolve it via the `load_classifier_by_key`
security-definer RPC (see supabase/migrations/0001_init.sql) using only the
anon key, so no service-role secret is needed anywhere in this backend.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from supabase import AsyncClient

from ..deps import get_anon_db
from ..jev_client import JevAPIError, JevConfigError, call_jev_timed, check_token_budget
from ..schemas import ClassifyRequest, ClassifyResponse
from ..security import compute_flags, hash_api_key

router = APIRouter(prefix="/v1", tags=["classify"])

STATE_EXCERPT_MAX_CHARS = 500


@router.post("/classify/{api_key}", response_model=ClassifyResponse)
async def classify(
    api_key: str,
    payload: ClassifyRequest,
    db: AsyncClient = Depends(get_anon_db),
) -> ClassifyResponse:
    hashed = hash_api_key(api_key)
    rpc_resp = await db.rpc("load_classifier_by_key", {"p_hashed_key": hashed}).execute()
    config = rpc_resp.data
    if not config:
        raise HTTPException(
            status_code=404,
            detail="Unknown, revoked, or unpublished API key.",
        )

    questions = config.get("questions") or []
    jev_questions = {
        q["key"]: {
            "type": q["type"],
            "instructions": q["instructions"],
            "criteria": q["criteria"],
        }
        for q in questions
    }

    warnings = check_token_budget(payload.state, jev_questions)

    try:
        result, latency_ms = await call_jev_timed(
            state=payload.state,
            questions=jev_questions,
            model=config.get("jev_model_version"),
        )
    except JevConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except JevAPIError as exc:
        raise HTTPException(status_code=502, detail=f"Jev API error: {exc.detail}") from exc

    answers = result.get("answers", {})
    flags, needs_review = compute_flags(questions, answers)

    await db.rpc(
        "record_classification_log",
        {
            "p_classifier_id": config["classifier_id"],
            "p_api_key_id": config["api_key_id"],
            "p_state_excerpt": payload.state[:STATE_EXCERPT_MAX_CHARS],
            "p_answers": answers,
            "p_needs_review": needs_review,
            "p_latency_ms": latency_ms,
            "p_jev_model_version_used": result.get("model"),
        },
    ).execute()

    return ClassifyResponse(
        model=result.get("model", config.get("jev_model_version", "")),
        answers=answers,
        meta={
            "classifier_id": config["classifier_id"],
            "needs_review": needs_review,
            "below_threshold_action": config.get("below_threshold_action", "return_as_is"),
            "flags": flags,
            "latency_ms": latency_ms,
            "warnings": warnings,
        },
    )
