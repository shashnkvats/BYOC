"""MCP Streamable HTTP tool discovery.

Connects to an MCP server and lists tool definitions only. Never calls
`tools/call` or otherwise executes a discovered tool. Credentials are used
as request headers and are not logged or returned.
"""

from __future__ import annotations

import ipaddress
import json
import logging
import socket
from typing import Any
from urllib.parse import urlparse, urlunparse

import httpx

logger = logging.getLogger(__name__)

PROTOCOL_CANDIDATES = ("2025-03-26", "2024-11-05")
CLIENT_INFO = {"name": "byoc", "version": "0.1.0"}
DISCOVER_TIMEOUT_S = 20.0
MAX_TOOLS_PAGES = 10
BLOCKED_HOSTS = frozenset(
    {
        "metadata.google.internal",
        "metadata",
        "169.254.169.254",
    }
)

GENERIC_CONNECT_ERROR = (
    "Couldn't connect to this MCP server. Check the URL and authentication "
    "details, then try again."
)
AUTH_ERROR = "Authentication failed. Check the token or API key, then try again."


class McpDiscoverError(Exception):
    def __init__(self, message: str, status_code: int = 502) -> None:
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def sanitize_mcp_url(raw: str) -> str:
    """Validate and normalize an MCP endpoint URL. Raises McpDiscoverError."""
    url = raw.strip()
    if not url:
        raise McpDiscoverError("Enter a server URL.", status_code=400)

    parsed = urlparse(url)
    if parsed.scheme not in ("https", "http"):
        raise McpDiscoverError("The server URL must start with https:// or http://.", status_code=400)
    if parsed.username or parsed.password:
        raise McpDiscoverError("Do not put credentials in the server URL.", status_code=400)
    hostname = (parsed.hostname or "").strip().lower().rstrip(".")
    if not hostname:
        raise McpDiscoverError("Enter a valid server URL.", status_code=400)
    if hostname in BLOCKED_HOSTS:
        raise McpDiscoverError("This URL is not allowed.", status_code=400)
    if parsed.scheme == "http" and hostname not in {"localhost", "127.0.0.1", "::1"}:
        raise McpDiscoverError("HTTP is only allowed for localhost. Use HTTPS.", status_code=400)

    try:
        infos = socket.getaddrinfo(hostname, None)
    except socket.gaierror:
        infos = []
    for info in infos:
        host_ip = info[4][0]
        try:
            ip = ipaddress.ip_address(host_ip)
        except ValueError:
            continue
        if ip.is_link_local or ip.is_multicast or ip.is_unspecified:
            raise McpDiscoverError("This URL is not allowed.", status_code=400)
        if str(ip) == "169.254.169.254":
            raise McpDiscoverError("This URL is not allowed.", status_code=400)

    # Drop fragments; keep path/query the server needs.
    return urlunparse(
        (parsed.scheme, parsed.netloc, parsed.path, parsed.params, parsed.query, "")
    )


def server_identity(url: str) -> str:
    parsed = urlparse(url)
    return parsed.hostname or url


def _auth_headers(auth_type: str, credential: str | None) -> dict[str, str]:
    if auth_type == "none" or not credential:
        return {}
    if auth_type == "bearer":
        return {"Authorization": f"Bearer {credential}"}
    if auth_type == "api_key":
        return {"X-Api-Key": credential}
    return {}


def _looks_like_auth_failure(status_code: int | None, message: str) -> bool:
    if status_code in {401, 403}:
        return True
    lowered = message.lower()
    needles = (
        "unauthorized",
        "unauthenticated",
        "forbidden",
        "invalid token",
        "invalid api key",
        "invalid apikey",
        "authentication failed",
        "access denied",
    )
    return any(n in lowered for n in needles)


def _raise_http_error(status_code: int) -> None:
    if _looks_like_auth_failure(status_code, ""):
        raise McpDiscoverError(AUTH_ERROR, status_code=400)
    if status_code == 404:
        raise McpDiscoverError(GENERIC_CONNECT_ERROR, status_code=502)
    raise McpDiscoverError(GENERIC_CONNECT_ERROR, status_code=502)


def _raise_rpc_error(error: dict[str, Any]) -> None:
    message = str(error.get("message") or "")
    if _looks_like_auth_failure(None, message):
        raise McpDiscoverError(AUTH_ERROR, status_code=400)
    raise McpDiscoverError(GENERIC_CONNECT_ERROR, status_code=502)


def _parse_sse_messages(text: str) -> list[dict[str, Any]]:
    messages: list[dict[str, Any]] = []
    data_lines: list[str] = []

    def flush() -> None:
        if not data_lines:
            return
        raw = "\n".join(data_lines).strip()
        data_lines.clear()
        if not raw or raw == "[DONE]":
            return
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            return
        if isinstance(parsed, dict):
            messages.append(parsed)
        elif isinstance(parsed, list):
            messages.extend(item for item in parsed if isinstance(item, dict))

    for line in text.splitlines():
        if line.startswith("data:"):
            data_lines.append(line[5:].lstrip())
        elif line.strip() == "":
            flush()
    flush()
    return messages


def _jsonrpc_result(payload: Any, expected_id: int | None) -> Any:
    candidates: list[dict[str, Any]] = []
    if isinstance(payload, dict):
        candidates = [payload]
    elif isinstance(payload, list):
        candidates = [item for item in payload if isinstance(item, dict)]

    matched = [
        item
        for item in candidates
        if expected_id is None or item.get("id") == expected_id
    ] or candidates

    for item in reversed(matched):
        if "error" in item and item["error"] is not None:
            if isinstance(item["error"], dict):
                _raise_rpc_error(item["error"])
            raise McpDiscoverError(GENERIC_CONNECT_ERROR, status_code=502)
        if "result" in item:
            return item["result"]

    raise McpDiscoverError(GENERIC_CONNECT_ERROR, status_code=502)


def _decode_response(response: httpx.Response, expected_id: int | None) -> Any:
    if response.status_code in {204, 202} and not response.content:
        return None
    if response.status_code >= 400:
        _raise_http_error(response.status_code)

    content_type = response.headers.get("content-type", "")
    if "text/event-stream" in content_type:
        messages = _parse_sse_messages(response.text)
        if not messages:
            return None
        return _jsonrpc_result(messages, expected_id)

    try:
        payload = response.json()
    except json.JSONDecodeError as exc:
        raise McpDiscoverError(GENERIC_CONNECT_ERROR, status_code=502) from exc
    return _jsonrpc_result(payload, expected_id)


class _McpSession:
    def __init__(self, client: httpx.AsyncClient, url: str) -> None:
        self.client = client
        self.url = url
        self.session_id: str | None = None
        self._next_id = 0
        self.protocol_version = PROTOCOL_CANDIDATES[0]

    def _id(self) -> int:
        self._next_id += 1
        return self._next_id

    def _headers(self) -> dict[str, str]:
        headers = {
            "Accept": "application/json, text/event-stream",
            "Content-Type": "application/json",
            "MCP-Protocol-Version": self.protocol_version,
        }
        if self.session_id:
            headers["Mcp-Session-Id"] = self.session_id
        return headers

    def _capture_session(self, response: httpx.Response) -> None:
        session = response.headers.get("mcp-session-id")
        if session:
            self.session_id = session

    async def request(self, method: str, params: dict[str, Any] | None, *, notify: bool = False) -> Any:
        req_id = None if notify else self._id()
        body: dict[str, Any] = {"jsonrpc": "2.0", "method": method}
        if req_id is not None:
            body["id"] = req_id
        if params is not None:
            body["params"] = params

        try:
            response = await self.client.post(self.url, json=body, headers=self._headers())
        except httpx.TimeoutException as exc:
            raise McpDiscoverError(GENERIC_CONNECT_ERROR, status_code=504) from exc
        except httpx.HTTPError as exc:
            logger.info("MCP discovery transport error for host=%s", server_identity(self.url))
            raise McpDiscoverError(GENERIC_CONNECT_ERROR, status_code=502) from exc

        self._capture_session(response)
        if notify:
            if response.status_code >= 400:
                _raise_http_error(response.status_code)
            return None
        return _decode_response(response, req_id)


def _normalize_tools(
    raw_tools: Any,
    *,
    server: str,
) -> list[dict[str, Any]]:
    if not isinstance(raw_tools, list):
        return []
    tools: list[dict[str, Any]] = []
    seen: set[str] = set()
    for item in raw_tools:
        if not isinstance(item, dict):
            continue
        name = str(item.get("name") or "").strip()
        if not name or name in seen:
            continue
        seen.add(name)
        description = str(item.get("description") or "").strip()
        schema = item.get("inputSchema")
        if schema is None:
            schema = item.get("input_schema")
        if schema is not None and not isinstance(schema, dict):
            schema = None
        tools.append(
            {
                "name": name,
                "description": description,
                "input_schema": schema,
                "server": server,
            }
        )
    return tools


async def discover_mcp_tools(
    *,
    url: str,
    auth_type: str,
    credential: str | None,
) -> dict[str, Any]:
    """List tools from an MCP server. Does not execute tools."""
    sanitized = sanitize_mcp_url(url)
    identity = server_identity(sanitized)
    headers = {
        "User-Agent": "byoc-mcp-discover/0.1",
        **_auth_headers(auth_type, credential),
    }

    timeout = httpx.Timeout(DISCOVER_TIMEOUT_S)
    async with httpx.AsyncClient(timeout=timeout, follow_redirects=False, headers=headers) as client:
        session = _McpSession(client, sanitized)
        last_error: McpDiscoverError | None = None

        for protocol in PROTOCOL_CANDIDATES:
            session.protocol_version = protocol
            session.session_id = None
            session._next_id = 0
            try:
                await session.request(
                    "initialize",
                    {
                        "protocolVersion": protocol,
                        "capabilities": {},
                        "clientInfo": CLIENT_INFO,
                    },
                )
                await session.request("notifications/initialized", None, notify=True)
                tools = await _list_all_tools(session)
                logger.info("MCP discovery succeeded host=%s tools=%s", identity, len(tools))
                return {"server": identity, "url": sanitized, "tools": tools}
            except McpDiscoverError as exc:
                last_error = exc
                if exc.message == AUTH_ERROR:
                    raise

        # Last resort: tools/list without a full initialize handshake.
        try:
            session.session_id = None
            session._next_id = 0
            tools = await _list_all_tools(session)
            logger.info("MCP discovery succeeded host=%s tools=%s", identity, len(tools))
            return {"server": identity, "url": sanitized, "tools": tools}
        except McpDiscoverError as exc:
            last_error = exc

        raise last_error or McpDiscoverError(GENERIC_CONNECT_ERROR, status_code=502)


async def _list_all_tools(session: _McpSession) -> list[dict[str, Any]]:
    collected: list[Any] = []
    cursor: str | None = None
    identity = server_identity(session.url)

    for _ in range(MAX_TOOLS_PAGES):
        params: dict[str, Any] = {}
        if cursor:
            params["cursor"] = cursor
        result = await session.request("tools/list", params)
        if not isinstance(result, dict):
            raise McpDiscoverError(GENERIC_CONNECT_ERROR, status_code=502)
        page = result.get("tools")
        if isinstance(page, list):
            collected.extend(page)
        next_cursor = result.get("nextCursor")
        if not next_cursor:
            break
        cursor = str(next_cursor)

    return _normalize_tools(collected, server=identity)
