from __future__ import annotations

from fastapi import APIRouter, Depends
from supabase import AsyncClient

from ..deps import CurrentUser, get_current_user, get_user_db
from ..schemas import LogOut

router = APIRouter(prefix="/classifiers", tags=["logs"])


@router.get("/{classifier_id}/logs", response_model=list[LogOut])
async def list_logs(
    classifier_id: str,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncClient = Depends(get_user_db),
    limit: int = 50,
) -> list[LogOut]:
    resp = (
        await db.table("classification_logs")
        .select("*")
        .eq("classifier_id", classifier_id)
        .order("created_at", desc=True)
        .limit(min(limit, 200))
        .execute()
    )
    return [
        LogOut(
            id=row["id"],
            created_at=row["created_at"],
            state_excerpt=row.get("state_excerpt"),
            answers=row.get("answers"),
            needs_review=row.get("needs_review", False),
            latency_ms=row.get("latency_ms"),
            jev_model_version_used=row.get("jev_model_version_used"),
        )
        for row in (resp.data or [])
    ]
