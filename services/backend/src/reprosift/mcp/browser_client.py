"""Bounded screenshot workflow over the TypeScript browser MCP tools."""

import asyncio
from pathlib import Path
from typing import Any, Literal

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from pydantic import BaseModel, ConfigDict, Field, ValidationError

from reprosift.config import Settings


class BrowserScreenshot(BaseModel):
    """Screenshot payload returned by the browser MCP server."""

    model_config = ConfigDict(extra="forbid", frozen=True, populate_by_name=True)

    schema_version: Literal[1] = Field(default=1, alias="schemaVersion")
    content_type: Literal["image/png"] = Field(alias="contentType")
    base64: str = Field(min_length=1)
    captured_at: str = Field(alias="capturedAt")
    url: str
    title: str


class BrowserActionRun(BaseModel):
    """Observed state after the scripted Step 13 cart interaction."""

    model_config = ConfigDict(extra="forbid", frozen=True, populate_by_name=True)

    session_id: str = Field(alias="sessionId")
    url: str
    title: str
    visible_text: str = Field(alias="visibleText")


class BrowserWorkflowEvidence(BaseModel):
    """Ephemeral evidence returned by the Step 14 scripted workflow."""

    model_config = ConfigDict(extra="forbid", frozen=True, populate_by_name=True)

    artifact_id: str = Field(alias="artifactId")
    session_id: str = Field(alias="sessionId")
    actions: tuple[str, ...]
    console_messages: tuple[str, ...] = Field(alias="consoleMessages")
    network_requests: tuple[str, ...] = Field(alias="networkRequests")
    screenshot: "BrowserEvidenceScreenshot"


class BrowserEvidenceScreenshot(BaseModel):
    """Screenshot artifact retained only for the lifetime of one workflow."""

    model_config = ConfigDict(extra="forbid", frozen=True, populate_by_name=True)

    session_id: str = Field(alias="sessionId")
    content_type: Literal["image/png"] = Field(alias="contentType")
    base64: str = Field(min_length=1)
    captured_at: str = Field(alias="capturedAt")


class BrowserScreenshotClientError(RuntimeError):
    """Safe failure for one bounded browser screenshot attempt."""

    def __init__(
        self,
        phase: Literal[
            "connect",
            "create_session",
            "navigate",
            "screenshot",
            "close",
            "inspect",
            "fill",
            "click",
            "select",
            "validate",
        ],
        message: str,
    ) -> None:
        super().__init__(message)
        self.phase = phase


class BrowserScreenshotClient:
    """Own one MCP process and browser session for a single screenshot request."""

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
    def from_settings(cls, settings: Settings) -> "BrowserScreenshotClient":
        return cls(
            node_command=settings.mcp_node_command,
            server_entrypoint=settings.mcp_server_entrypoint,
            connect_timeout_ms=settings.mcp_connect_timeout_ms,
            call_timeout_ms=settings.mcp_call_timeout_ms,
        )

    async def capture_cart(self) -> BrowserScreenshot:
        """Capture the allowed cart route and always close its browser session."""
        self._require_server_entrypoint()
        parameters = StdioServerParameters(
            command=self._node_command,
            args=[str(self._server_entrypoint)],
        )
        try:
            async with stdio_client(parameters) as (read_stream, write_stream):
                async with ClientSession(read_stream, write_stream) as session:
                    async with asyncio.timeout(self._connect_timeout_seconds):
                        await session.initialize()
                    return await self._capture_cart_in_session(session)
        except BrowserScreenshotClientError:
            raise
        except TimeoutError as error:
            raise BrowserScreenshotClientError(
                "connect", "Timed out while starting the browser MCP session."
            ) from error

    async def apply_coupon_and_remove_item_b(self) -> BrowserWorkflowEvidence:
        """Run the documented interactions without classifying the observed behavior."""
        self._require_server_entrypoint()
        parameters = StdioServerParameters(
            command=self._node_command, args=[str(self._server_entrypoint)]
        )
        try:
            async with stdio_client(parameters) as (read_stream, write_stream):
                async with ClientSession(read_stream, write_stream) as session:
                    async with asyncio.timeout(self._connect_timeout_seconds):
                        await session.initialize()
                    session_id = await self._create_session(session)
                    try:
                        await self._call(
                            session,
                            "navigate_browser_session",
                            {"sessionId": session_id, "path": "/cart"},
                            "navigate",
                        )
                        await self._call(
                            session,
                            "inspect_browser_page",
                            {"sessionId": session_id},
                            "inspect",
                        )
                        await self._call(
                            session,
                            "fill_browser_target",
                            {
                                "sessionId": session_id,
                                "target": {
                                    "strategy": "test_id",
                                    "testId": "coupon-code",
                                },
                                "value": "SAVE10",
                            },
                            "fill",
                        )
                        await self._call(
                            session,
                            "click_browser_target",
                            {
                                "sessionId": session_id,
                                "target": {
                                    "strategy": "role",
                                    "role": "button",
                                    "name": "Apply",
                                },
                            },
                            "click",
                        )
                        await self._call(
                            session,
                            "click_browser_target",
                            {
                                "sessionId": session_id,
                                "target": {
                                    "strategy": "role",
                                    "role": "button",
                                    "name": "Remove Item B",
                                },
                            },
                            "click",
                        )
                        await self._call(
                            session,
                            "inspect_browser_page",
                            {"sessionId": session_id},
                            "inspect",
                        )
                        evidence = await self._call(
                            session,
                            "collect_browser_evidence",
                            {"sessionId": session_id},
                            "screenshot",
                        )
                        return self._validate_workflow_evidence(evidence)
                    finally:
                        await self._close_session(session, session_id)
        except BrowserScreenshotClientError:
            raise
        except TimeoutError as error:
            raise BrowserScreenshotClientError(
                "connect", "Timed out while starting the browser MCP session."
            ) from error
        except (OSError, RuntimeError, ValueError) as error:
            raise BrowserScreenshotClientError(
                "connect", "Could not start the browser MCP session."
            ) from error

    async def _capture_cart_in_session(
        self, session: ClientSession
    ) -> BrowserScreenshot:
        session_id = await self._create_session(session)
        try:
            navigation = await self._call(
                session,
                "navigate_browser_session",
                {"sessionId": session_id, "path": "/cart"},
                "navigate",
            )
            screenshot = await self._call(
                session, "capture_screenshot", {"sessionId": session_id}, "screenshot"
            )
            return self._validate_screenshot(screenshot, navigation)
        finally:
            await self._close_session(session, session_id)

    async def _create_session(self, session: ClientSession) -> str:
        result = await self._call(
            session, "create_browser_session", {}, "create_session"
        )
        session_id = result.get("sessionId") if isinstance(result, dict) else None
        if not isinstance(session_id, str):
            raise BrowserScreenshotClientError(
                "validate", "The browser session response was invalid."
            )
        return session_id

    async def _close_session(self, session: ClientSession, session_id: str) -> None:
        await self._call(
            session, "close_browser_session", {"sessionId": session_id}, "close"
        )

    async def _call(
        self,
        session: ClientSession,
        tool_name: str,
        arguments: dict[str, Any],
        phase: Literal[
            "create_session",
            "navigate",
            "screenshot",
            "close",
            "inspect",
            "fill",
            "click",
            "select",
        ],
    ) -> Any:
        try:
            async with asyncio.timeout(self._call_timeout_seconds):
                result = await session.call_tool(tool_name, arguments=arguments)
        except TimeoutError as error:
            raise BrowserScreenshotClientError(
                phase, f"Timed out during browser {phase}."
            ) from error
        except (RuntimeError, ValueError) as error:
            raise BrowserScreenshotClientError(
                phase, f"Browser {phase} could not be completed."
            ) from error
        if result.is_error:
            raise BrowserScreenshotClientError(
                phase, f"Browser {phase} returned an error."
            )
        return result.structured_content

    @staticmethod
    def _validate_action_run(content: Any) -> BrowserActionRun:
        try:
            return BrowserActionRun.model_validate(content)
        except ValidationError as error:
            raise BrowserScreenshotClientError(
                "validate", "The browser inspection response was invalid."
            ) from error

    @staticmethod
    def _validate_workflow_evidence(content: Any) -> BrowserWorkflowEvidence:
        try:
            return BrowserWorkflowEvidence.model_validate(content)
        except ValidationError as error:
            raise BrowserScreenshotClientError(
                "validate", "The browser evidence response was invalid."
            ) from error

    @staticmethod
    def _validate_screenshot(screenshot: Any, navigation: Any) -> BrowserScreenshot:
        if not isinstance(screenshot, dict) or not isinstance(navigation, dict):
            raise BrowserScreenshotClientError(
                "validate", "The browser screenshot response was invalid."
            )
        try:
            return BrowserScreenshot.model_validate(
                {
                    "contentType": screenshot.get("contentType"),
                    "base64": screenshot.get("base64"),
                    "capturedAt": screenshot.get("capturedAt"),
                    "url": navigation.get("url"),
                    "title": navigation.get("title"),
                }
            )
        except ValidationError as error:
            raise BrowserScreenshotClientError(
                "validate",
                "The browser screenshot response did not match schema version 1.",
            ) from error

    def _require_server_entrypoint(self) -> None:
        if not self._server_entrypoint.is_file():
            raise BrowserScreenshotClientError(
                "connect", "The compiled MCP server entry point was not found."
            )
