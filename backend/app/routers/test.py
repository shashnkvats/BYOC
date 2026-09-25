from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from supabase import AsyncClient

from ..deps import CurrentUser, get_current_user, get_user_db
from ..jev_client import JevAPIError, JevConfigError, call_jev_timed, check_token_budget
from ..schemas import QuestionAnswerFlag, QuestionIn, TestRequest, TestResponse
from ..security import compute_flags

router = APIRouter(prefix="/classifiers", tags=["playground"])


async def _load_saved_questions(db: AsyncClient, classifier_id: str) -> list[dict[str, Any]]:
    resp = (
        await db.table("classifier_questions")
        .select("*")
        .eq("classifier_id", classifier_id)
        .order("position")
        .execute()
    )
    return resp.data or []


@router.post("/{classifier_id}/test", response_model=TestResponse)
async def test_classifier(
    classifier_id: str,
    payload: TestRequest,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncClient = Depends(get_user_db),
) -> TestResponse:
    # Confirm the classifier exists and belongs to the caller (RLS-scoped).
    c_resp = (
        await db.table("classifiers")
        .select("id, jev_model_version")
        .eq("id", classifier_id)
        .maybe_single()
        .execute()
    )
    if not c_resp or not c_resp.data:
        raise HTTPException(status_code=404, detail="Classifier not found")

    if payload.questions is not None:
        question_dicts = [q.model_dump() for q in payload.questions]
    else:
        question_dicts = await _load_saved_questions(db, classifier_id)

    if not question_dicts:
        raise HTTPException(
            status_code=400,
            detail="This classifier has no questions yet. Add at least one Choice, "
            "Score, or Noul question before testing.",
        )

    jev_questions = {
        q["key"]: {"type": q["type"], "instructions": q["instructions"], "criteria": q["criteria"]}
        for q in question_dicts
    }

    warnings = check_token_budget(payload.state, jev_questions)

    model = payload.model or c_resp.data.get("jev_model_version")

    try:
        result, latency_ms = await call_jev_timed(
            state=payload.state, questions=jev_questions, model=model
        )
    except JevConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except JevAPIError as exc:
        raise HTTPException(status_code=502, detail=f"Jev API error: {exc.detail}") from exc

    answers = result.get("answers", {})
    flags, needs_review = compute_flags(question_dicts, answers)

    return TestResponse(
        model=result.get("model", model or ""),
        answers=answers,
        flags=[QuestionAnswerFlag(**f) for f in flags],
        needs_review=needs_review,
        usage={**(result.get("usage") or {}), "latency_ms": latency_ms},
        warnings=warnings,
    )
