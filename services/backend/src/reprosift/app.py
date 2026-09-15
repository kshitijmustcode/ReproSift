"""Application composition; no external resources are opened at import time."""

from fastapi import FastAPI

from reprosift.config import Settings, load_settings
from reprosift.health import router as health_router


def create_app(settings: Settings | None = None) -> FastAPI:
    configuration = settings if settings is not None else load_settings()
    app = FastAPI(
        title="ReproSift API",
        version="0.0.0",
        description="Investigation backend. Currently exposes process liveness only.",
        docs_url="/docs" if configuration.app_env != "production" else None,
        redoc_url=None,
        openapi_url="/openapi.json" if configuration.app_env != "production" else None,
    )
    app.include_router(health_router)
    return app
