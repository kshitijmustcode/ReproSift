"""HTTP boundary for the bounded sample browser screenshot."""

from typing import Literal, Protocol

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field

from reprosift.mcp.browser_client import BrowserScreenshot, BrowserScreenshotClientError


class BrowserScreenshotReader(Protocol):
    async def capture_cart(self) -> BrowserScreenshot: ...


class BrowserScreenshotResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    status: Literal["captured"] = "captured"
    screenshot: BrowserScreenshot


class BrowserScreenshotError(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    code: Literal["BROWSER_UNAVAILABLE"] = "BROWSER_UNAVAILABLE"
    safe_message: str = Field(alias="safeMessage")
    phase: Literal[
        "connect", "create_session", "navigate", "screenshot", "close", "validate"
    ]


class BrowserUnavailableResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: Literal["unavailable"] = "unavailable"
    error: BrowserScreenshotError


def create_browser_screenshot_router(reader: BrowserScreenshotReader) -> APIRouter:
    router = APIRouter(tags=["browser"])

    @router.get(
        "/browser/sample-cart/screenshot",
        response_model=BrowserScreenshotResponse,
        responses={503: {"model": BrowserUnavailableResponse}},
    )
    async def get_sample_cart_screenshot() -> BrowserScreenshotResponse | JSONResponse:
        try:
            return BrowserScreenshotResponse(screenshot=await reader.capture_cart())
        except BrowserScreenshotClientError as error:
            unavailable = BrowserUnavailableResponse(
                error=BrowserScreenshotError(safe_message=str(error), phase=error.phase)
            )
            return JSONResponse(
                status_code=503, content=unavailable.model_dump(by_alias=True)
            )

    return router
