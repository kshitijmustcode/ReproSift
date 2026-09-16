"""A bounded stdio client for the TypeScript MCP status tool."""

import asyncio
from pathlib import Path
from typing import Any, Literal

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from pydantic import BaseModel, ConfigDict, Field, ValidationError

from reprosift.config import Settings


class McpCapabilities(BaseModel):
    """Capabilities deliberately exposed by the initial MCP process."""

    model_config = ConfigDict(extra="forbid", frozen=True, populate_by_name=True)

    browser_execution: Literal[False] = Field(alias="browserExecution")


class McpStatus(BaseModel):
    """Version 1 response returned by the TypeScript ``get_status`` MCP tool."""

    model_config = ConfigDict(extra="forbid", frozen=True, populate_by_name=True)

    schema_version: Literal[1] = Field(alias="schemaVersion")
    service: Literal["reprosift-mcp"]
    version: str
    status: Literal["ok"]
    transport: Literal["stdio"]
    capabilities: McpCapabilities


class McpStatusClientError(RuntimeError):
    """Safe, phase-specific error raised when the status probe cannot complete."""

    def __init__(
        self, phase: Literal["connect", "call", "validate"], message: str
    ) -> None:
        super().__init__(message)
        self.phase = phase


class McpStatusClient:
    """Launch and own one MCP stdio session per status request.

    The nested context managers own both the SDK session and its Node child process.
    They close deterministically when the request returns, fails, or times out.
    Persistent browser sessions are intentionally deferred until browser tools exist.
    """

    def __init__(
        self,
        *,
        node_command: str,
        server_entrypoint: Path,
        connect_timeout_ms: int,
        call_timeout_ms: int,
    ) -> None:
        self._node_command = node_command
        self._server_entrypoint = server_entrypoint
        self._connect_timeout_seconds = connect_timeout_ms / 1_000
        self._call_timeout_seconds = call_timeout_ms / 1_000

    @classmethod
    def from_settings(cls, settings: Settings) -> "McpStatusClient":
        return cls(
            node_command=settings.mcp_node_command,
            server_entrypoint=settings.mcp_server_entrypoint,
            connect_timeout_ms=settings.mcp_connect_timeout_ms,
            call_timeout_ms=settings.mcp_call_timeout_ms,
        )

    async def get_status(self) -> McpStatus:
        """Call ``get_status`` through a fresh, bounded stdio session."""
        self._require_server_entrypoint()
        parameters = StdioServerParameters(
            command=self._node_command,
            args=[str(self._server_entrypoint)],
        )

        try:
            async with asyncio.timeout(self._connect_timeout_seconds):
                async with stdio_client(parameters) as (read_stream, write_stream):
                    async with ClientSession(read_stream, write_stream) as session:
                        await session.initialize()
                        return await self._call_status(session)
        except TimeoutError as error:
            raise McpStatusClientError(
                "connect", "Timed out while starting the MCP status session."
            ) from error
        except (OSError, RuntimeError, ValueError) as error:
            raise McpStatusClientError(
                "connect", "Could not start the MCP status session."
            ) from error
        except BaseExceptionGroup as error:
            raise self._normalize_session_error(error) from error

    async def _call_status(self, session: ClientSession) -> McpStatus:
        try:
            async with asyncio.timeout(self._call_timeout_seconds):
                result = await session.call_tool("get_status", arguments={})
        except TimeoutError as error:
            raise McpStatusClientError(
                "call", "Timed out while calling the MCP status tool."
            ) from error
        except (RuntimeError, ValueError) as error:
            raise McpStatusClientError(
                "call", "The MCP status tool could not be called."
            ) from error

        if result.is_error:
            raise McpStatusClientError("call", "The MCP status tool returned an error.")
        return self._validate_status(result.structured_content)

    @staticmethod
    def _validate_status(content: Any) -> McpStatus:
        try:
            return McpStatus.model_validate(content)
        except ValidationError as error:
            raise McpStatusClientError(
                "validate", "The MCP status response did not match schema version 1."
            ) from error

    def _require_server_entrypoint(self) -> None:
        if not self._server_entrypoint.is_file():
            raise McpStatusClientError(
                "connect", "The compiled MCP server entry point was not found."
            )

    @staticmethod
    def _normalize_session_error(
        error: BaseExceptionGroup[BaseException],
    ) -> McpStatusClientError:
        for nested_error in error.exceptions:
            if isinstance(nested_error, McpStatusClientError):
                return nested_error
            if isinstance(nested_error, BaseExceptionGroup):
                return McpStatusClient._normalize_session_error(nested_error)
            if isinstance(nested_error, TimeoutError):
                return McpStatusClientError(
                    "connect", "Timed out while starting the MCP status session."
                )
        return McpStatusClientError(
            "connect", "Could not start the MCP status session."
        )
