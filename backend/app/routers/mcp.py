"""Authenticated MCP discovery. Lists tool definitions; never executes tools."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from ..deps import CurrentUser, get_current_user
from ..mcp_discover import McpDiscoverError, discover_mcp_tools
from ..schemas import McpDiscoverRequest, McpDiscoverResponse

router = APIRouter(prefix="/mcp", tags=["mcp"])


@router.post("/discover", response_model=McpDiscoverResponse)
async def discover_mcp_server_tools(
    payload: McpDiscoverRequest,
    _user: CurrentUser = Depends(get_current_user),
) -> McpDiscoverResponse:
    credential = payload.credential.get_secret_value() if payload.credential else None
    if payload.auth_type != "none" and not (credential or "").strip():
        raise HTTPException(
            status_code=400,
            detail="A token or API key is required for this authentication method.",
        )
    if payload.auth_type == "none":
        credential = None

    try:
        result = await discover_mcp_tools(
            url=payload.url,
            auth_type=payload.auth_type,
            credential=credential,
        )
    except McpDiscoverError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from None

    return McpDiscoverResponse.model_validate(result)
