import asyncio
import sys
from pathlib import Path

import pytest

from reprosift.config import Settings
from reprosift.mcp import McpStatusClient, McpStatusClientError


def test_python_client_calls_compiled_typescript_mcp_server() -> None:
    status = asyncio.run(McpStatusClient.from_settings(Settings()).get_status())

    assert status.schema_version == 1
    assert status.service == "reprosift-mcp"
    assert status.status == "ok"
    assert status.transport == "stdio"
    assert status.capabilities.browser_execution is False


def test_missing_compiled_server_is_reported_without_spawning_a_process(
    tmp_path: Path,
) -> None:
    client = McpStatusClient(
        node_command="node",
        server_entrypoint=tmp_path / "missing-cli.js",
        connect_timeout_ms=100,
        call_timeout_ms=100,
    )

    with pytest.raises(McpStatusClientError, match="entry point") as error:
        asyncio.run(client.get_status())

    assert error.value.phase == "connect"


def test_unavailable_node_command_is_reported_as_connection_failure() -> None:
    client = McpStatusClient(
        node_command="reprosift-node-command-does-not-exist",
        server_entrypoint=Settings().mcp_server_entrypoint,
        connect_timeout_ms=100,
        call_timeout_ms=100,
    )

    with pytest.raises(McpStatusClientError, match="Could not start") as error:
        asyncio.run(client.get_status())

    assert error.value.phase == "connect"


def test_connect_timeout_closes_an_unresponsive_child_process(tmp_path: Path) -> None:
    unresponsive_server = tmp_path / "unresponsive_server.py"
    unresponsive_server.write_text("import time\ntime.sleep(30)\n", encoding="utf-8")
    client = McpStatusClient(
        node_command=sys.executable,
        server_entrypoint=unresponsive_server,
        connect_timeout_ms=100,
        call_timeout_ms=100,
    )

    with pytest.raises(McpStatusClientError, match="Timed out") as error:
        asyncio.run(client.get_status())

    assert error.value.phase == "connect"


def test_invalid_wire_response_is_not_accepted() -> None:
    with pytest.raises(McpStatusClientError, match="did not match") as error:
        McpStatusClient._validate_status(
            {
                "schemaVersion": 2,
                "service": "reprosift-mcp",
                "version": "0.0.0",
                "status": "ok",
                "transport": "stdio",
                "capabilities": {"browserExecution": False},
            }
        )

    assert error.value.phase == "validate"
