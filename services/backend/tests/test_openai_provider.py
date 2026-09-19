import json
from dataclasses import dataclass

import pytest

from reprosift.config import Settings
from reprosift.openai_provider import OpenAIProvider, OpenAIProviderError


@dataclass
class FakeUsage:
    input_tokens: int
    output_tokens: int


@dataclass
class FakeResponse:
    output_text: str
    usage: FakeUsage


class FakeResponsesClient:
    def __init__(self, response: FakeResponse) -> None:
        self._response = response

    def create(self, **_: object) -> FakeResponse:
        return self._response


def test_provider_validates_structured_plan_and_usage() -> None:
    provider = OpenAIProvider(
        client=FakeResponsesClient(
            FakeResponse(
                output_text=json.dumps(
                    {
                        "summary": "Coupon total must be checked after removal.",
                        "requirement_ids": ["REQ-CART-001"],
                        "next_step": "Inspect the seeded cart after removing Item B.",
                    }
                ),
                usage=FakeUsage(input_tokens=20, output_tokens=10),
            )
        ),
        model="test-model",
        max_output_tokens=100,
        max_total_tokens_per_run=100,
    )

    result = provider.propose_plan(
        report="The discount is stale.", requirement_context="REQ-CART-001"
    )

    assert result.plan.requirement_ids == ("REQ-CART-001",)
    assert result.usage.total_tokens == 30


def test_provider_rejects_missing_key_and_budget_overrun() -> None:
    with pytest.raises(OpenAIProviderError, match="OPENAI_API_KEY"):
        OpenAIProvider.from_settings(Settings())
    provider = OpenAIProvider(
        client=FakeResponsesClient(
            FakeResponse(
                output_text='{"summary":"x","requirement_ids":["REQ-CART-001"],"next_step":"y"}',
                usage=FakeUsage(input_tokens=80, output_tokens=30),
            )
        ),
        model="test-model",
        max_output_tokens=100,
        max_total_tokens_per_run=100,
    )
    with pytest.raises(OpenAIProviderError, match="token budget"):
        provider.propose_plan(report="report", requirement_context="requirement")
