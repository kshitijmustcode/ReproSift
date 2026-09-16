import os
import subprocess
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from reprosift.app import create_app
from reprosift.config import load_settings


@pytest.fixture(autouse=True)
def clean_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    for key in list(os.environ):
        if key.lower() in {
            "app_env",
            "api_host",
            "api_port",
            "log_level",
            "mcp_node_command",
            "mcp_server_entrypoint",
            "mcp_connect_timeout_ms",
            "mcp_call_timeout_ms",
        }:
            monkeypatch.delenv(key)


def test_health_and_openapi_contract() -> None:
    with TestClient(create_app()) as client:
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok", "service": "reprosift-api"}
        assert "/health" in client.get("/openapi.json").json()["paths"]
        assert client.get("/investigations").status_code == 404


@pytest.mark.parametrize(
    ("key", "value"),
    [
        ("API_PORT", "0"),
        ("API_PORT", "65536"),
        ("API_PORT", "abc"),
        ("API_PORT", ""),
        ("API_HOST", "https://example.com"),
        ("APP_ENV", "unknown"),
        ("LOG_LEVEL", "verbose"),
    ],
)
def test_invalid_environment_prevents_app_creation(
    monkeypatch: pytest.MonkeyPatch, key: str, value: str
) -> None:
    monkeypatch.setenv(key, value)
    with pytest.raises(ValidationError):
        create_app()


def test_explicit_dotenv_and_environment_precedence(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    env_file = tmp_path / "settings.env"
    env_file.write_text("API_PORT=8100\nAPP_ENV=test\nOPENAI_API_KEY=\n")
    assert load_settings(env_file).api_port == 8100
    monkeypatch.setenv("API_PORT", "8200")
    settings = load_settings(env_file)
    assert settings.api_port == 8200
    assert settings.app_env == "test"


def test_production_disables_documentation(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("APP_ENV", "production")
    with TestClient(create_app()) as client:
        assert client.get("/health").status_code == 200
        assert client.get("/docs").status_code == 404
        assert client.get("/openapi.json").status_code == 404


def test_cli_fails_without_exposing_invalid_value(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("API_PORT", "private-invalid-value")
    result = subprocess.run(
        [sys.executable, "-c", "from reprosift.cli import main; main()"],
        capture_output=True,
        text=True,
        timeout=10,
        check=False,
    )
    assert result.returncode == 2
    assert "api_port" in result.stderr
    assert "private-invalid-value" not in result.stderr
