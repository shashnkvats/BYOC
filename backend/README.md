# BYOC backend

FastAPI service for [BYOC](../README.md): classifier CRUD, the Jev client, playground, publish/API keys, public `POST /v1/classify/{api_key}`, call logs, and optional AI auto-draft.

**Production:** [https://byoc-api-478981500431.us-central1.run.app/docs](https://byoc-api-478981500431.us-central1.run.app/docs) — Cloud Run service `byoc-api` in GCP project `byoc-classifier` (`us-central1`). Image: [`Dockerfile`](./Dockerfile).

## Local

```bash
cp .env.example .env
# SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, TYPESAFE_API_KEY
uv sync
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

Interactive docs: [http://127.0.0.1:8001/docs](http://127.0.0.1:8001/docs).

`AI_GATEWAY_API_KEY` is optional. Without it, `/ai/draft` returns 501 and the guided question form still works.

## Layout

- `app/main.py` — app assembly, CORS, routers
- `app/config.py` — env-driven settings
- `app/deps.py` — Supabase JWT + per-request RLS-scoped Postgres (no service-role key)
- `app/schemas.py` — request/response models, including Choice / Score / Noul
- `app/jev_client.py` — httpx client for `api.typesafe.ai/v1/systemone`
- `app/security.py` — API key hashing, confidence, `needs_review`
- `app/templates.py` — starter questions per template
- `app/routers/` — classifiers, test, publish, classify, logs, draft_ai
