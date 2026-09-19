"""Application composition; no external resources are opened at import time."""

from fastapi import FastAPI

from reprosift.config import Settings, load_settings
from reprosift.health import router as health_router
from reprosift.investigation_route import (
    InvestigationReader,
    create_investigation_router,
)
from reprosift.mcp import BrowserScreenshotClient, McpStatusClient
from reprosift.mcp.browser_route import (
    BrowserScreenshotReader,
    create_browser_screenshot_router,
)
from reprosift.mcp.status_route import McpStatusReader, create_mcp_status_router
from reprosift.persistence import Database, InvestigationRepository
from reprosift.persistence.models import Base


def create_app(
    settings: Settings | None = None,
    mcp_status_reader: McpStatusReader | None = None,
    browser_screenshot_reader: BrowserScreenshotReader | None = None,
    investigation_reader: InvestigationReader | None = None,
) -> FastAPI:
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
    status_reader = (
        mcp_status_reader
        if mcp_status_reader is not None
        else McpStatusClient.from_settings(configuration)
    )
    app.include_router(create_mcp_status_router(status_reader))
    screenshot_reader = (
        browser_screenshot_reader
        if browser_screenshot_reader is not None
        else BrowserScreenshotClient.from_settings(configuration)
    )
    app.include_router(create_browser_screenshot_router(screenshot_reader))
    if investigation_reader is None:
        database = Database(configuration.database_url)
        Base.metadata.create_all(database.engine)
        investigation_reader = InvestigationRepository(database)
    app.include_router(create_investigation_router(investigation_reader))
    return app
