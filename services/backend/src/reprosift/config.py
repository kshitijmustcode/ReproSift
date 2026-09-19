"""Configuration consumed by the API process at startup."""

from ipaddress import IPv4Address, IPv6Address
from pathlib import Path
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

REPOSITORY_ROOT = Path(__file__).resolve().parents[4]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        extra="ignore", frozen=True, hide_input_in_errors=True
    )

    app_env: Literal["development", "test", "production"] = "development"
    api_host: IPv4Address | IPv6Address = IPv4Address("127.0.0.1")
    api_port: int = Field(default=8000, ge=1, le=65535)
    log_level: Literal["debug", "info", "warning", "error", "critical"] = "info"
    database_url: str = "sqlite:///./reprosift.db"
    mcp_node_command: str = "node"
    mcp_server_entrypoint: Path = REPOSITORY_ROOT / "packages/mcp-server/dist/cli.js"
    mcp_connect_timeout_ms: int = Field(default=5_000, ge=100, le=30_000)
    mcp_call_timeout_ms: int = Field(default=5_000, ge=100, le=30_000)

    @field_validator("mcp_server_entrypoint")
    @classmethod
    def resolve_mcp_server_entrypoint(cls, value: Path) -> Path:
        if value.is_absolute():
            return value
        return REPOSITORY_ROOT / value


def load_settings(env_file: Path | None = None) -> Settings:
    # Explicit file selection avoids different configuration depending on cwd.
    # The shared root template contains future service keys, so extras are ignored.
    return Settings(_env_file=env_file, _env_file_encoding="utf-8")
