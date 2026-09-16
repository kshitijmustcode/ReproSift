"""HTTP status boundary for the locally owned MCP client."""

from typing import Literal, Protocol

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field

from reprosift.mcp import McpStatus, McpStatusClientError


class McpStatusReader(Protocol):
    """Consumer-facing capability required by the HTTP status route."""

    async def get_status(self) -> McpStatus: ...


class McpConnectionResponse(BaseModel):
    """Successful MCP probe returned to trusted dashboard clients."""

    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    status: Literal["connected"] = "connected"
    mcp: McpStatus


class McpConnectionError(BaseModel):
    """Safe details for an unavailable local MCP integration."""

    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    code: Literal["MCP_UNAVAILABLE"] = "MCP_UNAVAILABLE"
    safe_message: str = Field(alias="safeMessage")
    phase: Literal["connect", "call", "validate"]


class McpUnavailableResponse(BaseModel):
    """Expected failure response; service liveness remains independent."""

    model_config = ConfigDict(extra="forbid")

    status: Literal["unavailable"] = "unavailable"
    error: McpConnectionError


def create_mcp_status_router(status_reader: McpStatusReader) -> APIRouter:
    """Create a router bound to an explicitly supplied MCP capability."""
    router = APIRouter(tags=["mcp"])

    @router.get(
        "/mcp/status",
        response_model=McpConnectionResponse,
        responses={503: {"model": McpUnavailableResponse}},
    )
    async def get_mcp_status() -> McpConnectionResponse | JSONResponse:
        try:
            return McpConnectionResponse(mcp=await status_reader.get_status())
        except McpStatusClientError as error:
            unavailable = McpUnavailableResponse(
                error=McpConnectionError(safe_message=str(error), phase=error.phase)
            )
            return JSONResponse(
                status_code=503,
                content=unavailable.model_dump(by_alias=True),
            )

    return router
