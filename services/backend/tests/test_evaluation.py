import json
from pathlib import Path

import pytest

from reprosift.evaluation import (
    EvaluationHarness,
    RecordedReplayExecutor,
    _sample_from_runner_response,
    load_dataset,
)
from reprosift.verification import ReplayOutcome


def test_recorded_harness_preserves_matching_and_execution_failure_results() -> None:
    repository_root = Path(__file__).parents[3]
    dataset = load_dataset(repository_root / "evals/development/cases.json")

    report = EvaluationHarness(RecordedReplayExecutor()).run(dataset, repeats=3)

    assert len(report.results) == 30
    assert report.outcome_counts[ReplayOutcome.MATCHING_DEFECT.value] == 14
    assert report.outcome_counts[ReplayOutcome.EXPECTED_BEHAVIOR.value] == 15
    assert report.outcome_counts[ReplayOutcome.EXECUTION_FAILURE.value] == 1
    assert report.expected_outcome_mismatches == 1
    assert report.results[0].matches_expected is True
    assert report.total_cost_usd == 0.0
    assert {result.scenario_id for result in report.results} == {
        "sample-coupon",
        "removal-total",
        "cart-badge",
        "shipping-threshold",
        "required-address",
    }


@pytest.mark.parametrize(
    "response",
    [
        json.dumps(
            {
                "preconditionsReached": True,
                "supportedRequirement": True,
                "assertions": [None],
            }
        ),
        json.dumps(
            {
                "preconditionsReached": "true",
                "supportedRequirement": True,
                "assertions": [],
            }
        ),
        json.dumps(
            {
                "preconditionsReached": True,
                "supportedRequirement": True,
                "assertions": [{"expected": 1, "actual": "1", "passed": True}],
            }
        ),
    ],
)
def test_runner_response_rejects_malformed_assertion_contract(response: str) -> None:
    with pytest.raises(ValueError):
        _sample_from_runner_response(response, duration_ms=1)
