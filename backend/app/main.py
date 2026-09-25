from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routers import classifiers, classify, draft_ai, logs, publish, test

settings = get_settings()

app = FastAPI(
    title="BYOC API",
    description=(
        "Build Your Own Classifier - a backend for defining, testing, and hosting "
        "Jev (TypeSafe AI) classifiers as callable API endpoints."
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(classifiers.router)
app.include_router(test.router)
app.include_router(publish.router)
app.include_router(logs.router)
app.include_router(draft_ai.router)
app.include_router(classify.router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
