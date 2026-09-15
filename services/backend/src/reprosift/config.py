"""Configuration consumed by the API process at startup."""

from ipaddress import IPv4Address, IPv6Address
from pathlib import Path
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        extra="ignore", frozen=True, hide_input_in_errors=True
    )

    app_env: Literal["development", "test", "production"] = "development"
    api_host: IPv4Address | IPv6Address = IPv4Address("127.0.0.1")
    api_port: int = Field(default=8000, ge=1, le=65535)
    log_level: Literal["debug", "info", "warning", "error", "critical"] = "info"


def load_settings(env_file: Path | None = None) -> Settings:
    # Explicit file selection avoids different configuration depending on cwd.
    # The shared root template contains future service keys, so extras are ignored.
    return Settings(_env_file=env_file, _env_file_encoding="utf-8")
