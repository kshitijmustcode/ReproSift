"""Immutable, validated candidate representation used by replay and test generation."""

from __future__ import annotations

import hashlib
import json
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, Tag, field_validator


class RequirementReference(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    document_id: str
    document_version: int = Field(ge=1)
    chunk_id: str


class RoleLocator(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    strategy: Literal["role"]
    role: Literal["button", "combobox", "link", "textbox"]
    name: str = Field(min_length=1, max_length=256)


class TestIdLocator(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    strategy: Literal["test_id"]
    test_id: str = Field(alias="testId", min_length=1, max_length=256)


Locator = Annotated[RoleLocator, Tag("role")] | Annotated[TestIdLocator, Tag("test_id")]


class NavigateAction(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    action: Literal["navigate"]
    path: str = Field(min_length=1)
    timeout_ms: int = Field(alias="timeoutMs", ge=100, le=30_000)

    @field_validator("path")
    @classmethod
    def require_relative_path(cls, value: str) -> str:
        if not value.startswith("/") or value.startswith("//"):
            raise ValueError("Navigation path must be an allowed relative path.")
        return value


class ClickAction(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    action: Literal["click"]
    target: Locator
    timeout_ms: int = Field(alias="timeoutMs", ge=100, le=30_000)


class FillAction(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    action: Literal["fill"]
    target: Locator
    value: str = Field(max_length=2_000)
    timeout_ms: int = Field(alias="timeoutMs", ge=100, le=30_000)


Action = NavigateAction | ClickAction | FillAction


class Assertion(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    kind: Literal["money_equals", "visible"]
    target: Locator
    expected: str | bool
    requirement_ref: RequirementReference = Field(alias="requirementRef")
    timeout_ms: int = Field(alias="timeoutMs", ge=100, le=30_000)


class ReproductionCandidate(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True, populate_by_name=True)

    schema_version: Literal[1] = Field(default=1, alias="schemaVersion")
    scenario_id: str = Field(alias="scenarioId", min_length=1)
    fixture_version: int = Field(alias="fixtureVersion", ge=1)
    actions: tuple[Action, ...] = Field(min_length=1, max_length=12)
    preconditions: tuple[Assertion, ...]
    assertions: tuple[Assertion, ...] = Field(min_length=1)
    source_requirement_refs: tuple[RequirementReference, ...] = Field(
        alias="sourceRequirementRefs", min_length=1
    )

    @property
    def content_hash(self) -> str:
        canonical = json.dumps(
            self.model_dump(by_alias=True), sort_keys=True, separators=(",", ":")
        )
        return hashlib.sha256(canonical.encode("utf-8")).hexdigest()
