"""Bounded OpenAI Responses adapter with validated structured planning output."""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any, Protocol, cast

from openai import OpenAI
from pydantic import BaseModel, ConfigDict, Field, ValidationError

from reprosift.config import Settings


class InvestigationPlan(BaseModel):
    """Model proposal only; browser and verification layers remain authoritative."""

    model_config = ConfigDict(extra="forbid", frozen=True)

    summary: str = Field(min_length=1, max_length=1_000)
    requirement_ids: tuple[str, ...] = Field(min_length=1, max_length=5)
    next_step: str = Field(min_length=1, max_length=500)


@dataclass(frozen=True)
class ModelUsage:
    input_tokens: int
    output_tokens: int

    @property
    def total_tokens(self) -> int:
        return self.input_tokens + self.output_tokens


@dataclass(frozen=True)
class ModelResult:
    plan: InvestigationPlan
    usage: ModelUsage
    model: str


class ResponsesClient(Protocol):
    def create(self, **kwargs: object) -> object: ...


class OpenAIResponsesClient:
    """Narrow adapter around the SDK's overloaded Responses resource."""

    def __init__(self, api_key: str) -> None:
        self._client = OpenAI(api_key=api_key)

    def create(self, **kwargs: object) -> object:
        return cast(object, self._client.responses.create(**cast(Any, kwargs)))


class OpenAIProviderError(RuntimeError):
    """Safe provider failure that never includes an API key or raw response."""


class OpenAIProvider:
    """Maps one bounded planning request to an OpenAI Responses call."""

    def __init__(
        self,
        *,
        client: ResponsesClient,
        model: str,
        max_output_tokens: int,
        max_total_tokens_per_run: int,
    ) -> None:
        self._client = client
        self._model = model
        self._max_output_tokens = max_output_tokens
        self._max_total_tokens_per_run = max_total_tokens_per_run

    @classmethod
    def from_settings(cls, settings: Settings) -> OpenAIProvider:
        if not settings.openai_api_key:
            raise OpenAIProviderError("OPENAI_API_KEY is required for model requests.")
        return cls(
            client=OpenAIResponsesClient(settings.openai_api_key),
            model=settings.openai_model,
            max_output_tokens=settings.openai_max_output_tokens,
            max_total_tokens_per_run=settings.openai_max_total_tokens_per_run,
        )

    def propose_plan(self, *, report: str, requirement_context: str) -> ModelResult:
        try:
            response = self._client.create(
                model=self._model,
                input=(
                    "Use only the supplied requirement context. Propose one bounded "
                    "next "
                    "investigation step.\n\n"
                    f"Bug report:\n{report}\n\nRequirement context:\n"
                    f"{requirement_context}"
                ),
                max_output_tokens=self._max_output_tokens,
                text={
                    "format": {
                        "type": "json_schema",
                        "name": "investigation_plan",
                        "strict": True,
                        "schema": InvestigationPlan.model_json_schema(),
                    }
                },
            )
            output_text = getattr(response, "output_text", None)
            usage = getattr(response, "usage", None)
            if not isinstance(output_text, str) or usage is None:
                raise OpenAIProviderError(
                    "OpenAI returned an incomplete structured response."
                )
            result = ModelResult(
                plan=InvestigationPlan.model_validate(json.loads(output_text)),
                usage=ModelUsage(
                    input_tokens=_usage_count(usage, "input_tokens"),
                    output_tokens=_usage_count(usage, "output_tokens"),
                ),
                model=self._model,
            )
        except OpenAIProviderError:
            raise
        except (ValidationError, ValueError, TypeError) as error:
            raise OpenAIProviderError(
                "OpenAI returned an invalid structured response."
            ) from error
        except Exception as error:
            raise OpenAIProviderError(
                "OpenAI model request could not be completed."
            ) from error
        if result.usage.total_tokens > self._max_total_tokens_per_run:
            raise OpenAIProviderError("OpenAI response exceeded the run token budget.")
        return result


def _usage_count(usage: object, field_name: str) -> int:
    value = getattr(usage, field_name, None)
    if not isinstance(value, int) or value < 0:
        raise OpenAIProviderError("OpenAI returned invalid usage metadata.")
    return value
