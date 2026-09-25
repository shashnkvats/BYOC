from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from supabase import AsyncClient

from ..deps import CurrentUser, get_current_user, get_user_db
from ..schemas import (
    ClassifierCreate,
    ClassifierOut,
    ClassifierSummary,
    ClassifierUpdate,
    QuestionOut,
)
from ..templates import get_template_questions
from ..utils import slugify

router = APIRouter(prefix="/classifiers", tags=["classifiers"])


def _row_to_out(
    classifier: dict[str, Any],
    questions: list[dict[str, Any]],
    settings_row: dict[str, Any] | None,
    has_api_key: bool,
) -> ClassifierOut:
    return ClassifierOut(
        id=classifier["id"],
        owner_id=classifier["owner_id"],
        name=classifier["name"],
        slug=classifier["slug"],
        description=classifier.get("description"),
        template_type=classifier["template_type"],
        jev_model_version=classifier["jev_model_version"],
        status=classifier["status"],
        below_threshold_action=(settings_row or {}).get(
            "below_threshold_action", "return_as_is"
        ),
        questions=[
            QuestionOut(
                id=q["id"],
                key=q["key"],
                type=q["type"],
                instructions=q["instructions"],
                criteria=q["criteria"],
                confidence_threshold=q["confidence_threshold"],
                position=q["position"],
            )
            for q in sorted(questions, key=lambda q: q["position"])
        ],
        created_at=classifier["created_at"],
        updated_at=classifier["updated_at"],
        has_api_key=has_api_key,
    )


async def _fetch_full(
    db: AsyncClient, classifier_id: str
) -> tuple[dict | None, list[dict], dict | None, bool]:
    c_resp = (
        await db.table("classifiers")
        .select("*")
        .eq("id", classifier_id)
        .maybe_single()
        .execute()
    )
    classifier = c_resp.data if c_resp else None
    if not classifier:
        return None, [], None, False

    q_resp = (
        await db.table("classifier_questions")
        .select("*")
        .eq("classifier_id", classifier_id)
        .execute()
    )
    s_resp = (
        await db.table("classifier_settings")
        .select("*")
        .eq("classifier_id", classifier_id)
        .maybe_single()
        .execute()
    )
    k_resp = (
        await db.table("api_keys")
        .select("id")
        .eq("classifier_id", classifier_id)
        .is_("revoked_at", None)
        .execute()
    )
    return (
        classifier,
        q_resp.data or [],
        (s_resp.data if s_resp else None),
        bool(k_resp.data),
    )


@router.post("", response_model=ClassifierOut, status_code=status.HTTP_201_CREATED)
async def create_classifier(
    payload: ClassifierCreate,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncClient = Depends(get_user_db),
) -> ClassifierOut:
    questions = payload.questions or get_template_questions(payload.template_type)

    insert_resp = await (
        db.table("classifiers")
        .insert(
            {
                "owner_id": user.id,
                "name": payload.name,
                "slug": slugify(payload.name),
                "description": payload.description,
                "template_type": payload.template_type,
            }
        )
        .execute()
    )
    if not insert_resp.data:
        raise HTTPException(status_code=500, detail="Failed to create classifier")
    classifier_id = insert_resp.data[0]["id"]

    await db.table("classifier_settings").insert(
        {
            "classifier_id": classifier_id,
            "below_threshold_action": payload.below_threshold_action,
        }
    ).execute()

    if questions:
        rows = [
            {
                "classifier_id": classifier_id,
                "key": q.key,
                "type": q.type,
                "instructions": q.instructions,
                "criteria": q.criteria,
                "confidence_threshold": q.confidence_threshold,
                "position": i,
            }
            for i, q in enumerate(questions)
        ]
        await db.table("classifier_questions").insert(rows).execute()

    classifier, q_rows, settings_row, has_key = await _fetch_full(db, classifier_id)
    assert classifier is not None
    return _row_to_out(classifier, q_rows, settings_row, has_key)


@router.get("", response_model=list[ClassifierSummary])
async def list_classifiers(
    user: CurrentUser = Depends(get_current_user),
    db: AsyncClient = Depends(get_user_db),
) -> list[ClassifierSummary]:
    resp = await db.table("classifiers").select("*").order("updated_at", desc=True).execute()
    return [
        ClassifierSummary(
            id=c["id"],
            name=c["name"],
            slug=c["slug"],
            template_type=c["template_type"],
            status=c["status"],
            updated_at=c["updated_at"],
        )
        for c in (resp.data or [])
    ]


@router.get("/{classifier_id}", response_model=ClassifierOut)
async def get_classifier(
    classifier_id: str,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncClient = Depends(get_user_db),
) -> ClassifierOut:
    classifier, q_rows, settings_row, has_key = await _fetch_full(db, classifier_id)
    if not classifier:
        raise HTTPException(status_code=404, detail="Classifier not found")
    return _row_to_out(classifier, q_rows, settings_row, has_key)


@router.patch("/{classifier_id}", response_model=ClassifierOut)
async def update_classifier(
    classifier_id: str,
    payload: ClassifierUpdate,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncClient = Depends(get_user_db),
) -> ClassifierOut:
    update_fields: dict[str, Any] = {}
    if payload.name is not None:
        update_fields["name"] = payload.name
    if payload.description is not None:
        update_fields["description"] = payload.description
    if payload.jev_model_version is not None:
        update_fields["jev_model_version"] = payload.jev_model_version

    if update_fields:
        resp = (
            await db.table("classifiers")
            .update(update_fields)
            .eq("id", classifier_id)
            .execute()
        )
        if not resp.data:
            raise HTTPException(status_code=404, detail="Classifier not found")

    if payload.below_threshold_action is not None:
        await db.table("classifier_settings").update(
            {"below_threshold_action": payload.below_threshold_action}
        ).eq("classifier_id", classifier_id).execute()

    if payload.questions is not None:
        await db.table("classifier_questions").delete().eq(
            "classifier_id", classifier_id
        ).execute()
        if payload.questions:
            rows = [
                {
                    "classifier_id": classifier_id,
                    "key": q.key,
                    "type": q.type,
                    "instructions": q.instructions,
                    "criteria": q.criteria,
                    "confidence_threshold": q.confidence_threshold,
                    "position": i,
                }
                for i, q in enumerate(payload.questions)
            ]
            await db.table("classifier_questions").insert(rows).execute()

    classifier, q_rows, settings_row, has_key = await _fetch_full(db, classifier_id)
    if not classifier:
        raise HTTPException(status_code=404, detail="Classifier not found")
    return _row_to_out(classifier, q_rows, settings_row, has_key)


@router.delete("/{classifier_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_classifier(
    classifier_id: str,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncClient = Depends(get_user_db),
) -> None:
    await db.table("classifiers").delete().eq("id", classifier_id).execute()
