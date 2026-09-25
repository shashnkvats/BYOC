# BYOC backend

FastAPI service powering [BYOC](../README.md) — classifier CRUD, the Jev client, the playground/test endpoint, publish/API-key issuance, the public `/v1/classify/{api_key}` runtime endpoint, call logs, and the optional AI auto-draft assist.

See the [root README](../README.md) for the full picture (architecture, security model, setup instructions). Quick start from this directory:

```bash
cp .env.example .env
# fill in SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, TYPESAFE_API_KEY
uv sync
uv run uvicorn app.main:app --reload --port 8001
```

Interactive API docs are then available at `http://127.0.0.1:8001/docs`.

## Layout

- `app/main.py` — app assembly, CORS, router registration
- `app/config.py` — env-driven settings (`pydantic-settings`)
- `app/deps.py` — Supabase JWT verification + per-request RLS-scoped Postgres clients (no service-role key, ever)
- `app/schemas.py` — Pydantic request/response models, including the Choice/Score/Noul question shape
- `app/jev_client.py` — httpx wrapper over `api.typesafe.ai/v1/systemone` + token-budget checks
- `app/security.py` — API key generation/hashing, confidence + `needs_review` flag computation
- `app/templates.py` — starter question sets for each classifier template
- `app/routers/` — one module per resource: `classifiers`, `test`, `publish`, `classify`, `logs`, `draft_ai`
