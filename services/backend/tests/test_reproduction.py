import pytest
from pydantic import ValidationError

from reprosift.reproduction import ReproductionCandidate


def candidate() -> ReproductionCandidate:
    return ReproductionCandidate.model_validate(
        {
            "scenarioId": "sample-coupon",
            "fixtureVersion": 1,
            "actions": [
                {"action": "navigate", "path": "/cart", "timeoutMs": 1000},
                {
                    "action": "fill",
                    "target": {"strategy": "test_id", "testId": "coupon-code"},
                    "value": "SAVE10",
                    "timeoutMs": 1000,
                },
            ],
            "preconditions": [],
            "assertions": [
                {
                    "kind": "money_equals",
                    "target": {"strategy": "test_id", "testId": "cart-total"},
                    "expected": "$90.00",
                    "requirementRef": {
                        "document_id": "doc-1",
                        "document_version": 1,
                        "chunk_id": "chunk-1",
                    },
                    "timeoutMs": 1000,
                }
            ],
            "sourceRequirementRefs": [
                {"document_id": "doc-1", "document_version": 1, "chunk_id": "chunk-1"}
            ],
        }
    )


def test_candidate_is_validated_immutable_and_content_addressed() -> None:
    value = candidate()
    assert len(value.content_hash) == 64
    with pytest.raises(ValidationError):
        value.scenario_id = "other"  # type: ignore[misc]
    with pytest.raises(ValidationError):
        ReproductionCandidate.model_validate(
            {**value.model_dump(by_alias=True), "actions": []}
        )
