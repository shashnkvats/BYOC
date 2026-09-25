from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from supabase import AsyncClient

from ..deps import CurrentUser, get_current_user, get_user_db
from ..schemas import PublishResponse
from .classifiers import _fetch_full, _row_to_out
from ..security import generate_api_key, hash_api_key

router = APIRouter(prefix="/classifiers", tags=["publish"])


@router.post("/{classifier_id}/publish", response_model=PublishResponse)
async def publish_classifier(
    classifier_id: str,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncClient = Depends(get_user_db),
) -> PublishResponse:
    classifier, q_rows, settings_row, _ = await _fetch_full(db, classifier_id)
    if not classifier:
        raise HTTPException(status_code=404, detail="Classifier not found")
    if not q_rows:
        raise HTTPException(
            status_code=400,
            detail="Add at least one question before publishing this classifier.",
        )

    # Revoke any previously issued keys - a raw key can never be shown again
    # once created, so re-publishing rotates to a fresh one.
    await db.table("api_keys").update(
        {"revoked_at": datetime.now(timezone.utc).isoformat()}
    ).eq("classifier_id", classifier_id).is_("revoked_at", None).execute()

    raw_key = generate_api_key()
    await db.table("api_keys").insert(
        {
            "classifier_id": classifier_id,
            "hashed_key": hash_api_key(raw_key),
            "label": "default",
        }
    ).execute()

    await db.table("classifiers").update({"status": "published"}).eq(
        "id", classifier_id
    ).execute()

    classifier, q_rows, settings_row, has_key = await _fetch_full(db, classifier_id)
    assert classifier is not None

    return PublishResponse(
        api_key=raw_key,
        endpoint_path=f"/v1/classify/{raw_key}",
        classifier=_row_to_out(classifier, q_rows, settings_row, has_key),
    )
