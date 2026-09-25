"""FastAPI dependencies: auth verification and per-request Supabase clients.

Design note: this backend never uses a Supabase service-role key. Instead:
  - Authenticated dashboard endpoints verify the caller's Supabase JWT
    (issued by the Next.js frontend's Supabase Auth session) and build a
    per-request Supabase client whose Authorization header carries that
    JWT, so Postgres Row Level Security enforces `owner_id = auth.uid()`
    the same way it would for a direct browser client.
  - The public /v1/classify/{api_key} runtime endpoint instead calls two
    `security definer` RPC functions (load_classifier_by_key,
    record_classification_log) with just the anon key - see
    supabase/migrations/0001_init.sql.
"""

from __future__ import annotations

from dataclasses import dataclass

from fastapi import Depends, Header, HTTPException, status
from supabase import AsyncClient
from supabase.lib.client_options import AsyncClientOptions

from .config import Settings, get_settings

_verifier_client: AsyncClient | None = None


async def _get_verifier_client(settings: Settings) -> AsyncClient:
    """A single shared client used only to verify bearer tokens via
    `auth.get_user(jwt)`, which takes the jwt explicitly per-call and does
    not mutate shared state - safe to reuse across concurrent requests.
    """
    global _verifier_client
    if _verifier_client is None:
        _verifier_client = AsyncClient(settings.supabase_url, settings.supabase_publishable_key)
    return _verifier_client


@dataclass
class CurrentUser:
    id: str
    email: str | None


async def get_bearer_token(
    authorization: str | None = Header(default=None),
) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token. Send the Supabase session access_token as "
            "'Authorization: Bearer <token>'.",
        )
    return authorization.split(" ", 1)[1].strip()


async def get_current_user(
    token: str = Depends(get_bearer_token),
    settings: Settings = Depends(get_settings),
) -> CurrentUser:
    client = await _get_verifier_client(settings)
    try:
        response = await client.auth.get_user(jwt=token)
    except Exception as exc:  # noqa: BLE001 - surface as 401, not 500
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session"
        ) from exc

    if response is None or response.user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session"
        )

    return CurrentUser(id=response.user.id, email=response.user.email)


async def get_user_db(
    token: str = Depends(get_bearer_token),
    settings: Settings = Depends(get_settings),
) -> AsyncClient:
    """Per-request Supabase client scoped to the caller's JWT, so RLS
    enforces row ownership. Cheap to construct (no network call)."""
    return AsyncClient(
        settings.supabase_url,
        settings.supabase_publishable_key,
        options=AsyncClientOptions(headers={"Authorization": f"Bearer {token}"}),
    )


async def get_anon_db(settings: Settings = Depends(get_settings)) -> AsyncClient:
    """Anon-key client, used only for the public classify endpoint's RPC
    calls (load_classifier_by_key / record_classification_log)."""
    return AsyncClient(settings.supabase_url, settings.supabase_publishable_key)
