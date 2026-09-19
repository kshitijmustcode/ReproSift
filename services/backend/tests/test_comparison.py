import pytest

from reprosift.comparison import ComparisonOutcome, compare_corrected_behavior
from reprosift.verification import ReplayOutcome


@pytest.mark.parametrize(
    ("buggy", "corrected", "expected"),
    [
        (
            ReplayOutcome.MATCHING_DEFECT,
            ReplayOutcome.EXPECTED_BEHAVIOR,
            ComparisonOutcome.SUPPORTED,
        ),
        (
            ReplayOutcome.EXPECTED_BEHAVIOR,
            ReplayOutcome.EXPECTED_BEHAVIOR,
            ComparisonOutcome.NOT_SUPPORTED,
        ),
        (
            ReplayOutcome.MATCHING_DEFECT,
            ReplayOutcome.EXECUTION_FAILURE,
            ComparisonOutcome.UNAVAILABLE,
        ),
        (None, ReplayOutcome.EXPECTED_BEHAVIOR, ComparisonOutcome.UNAVAILABLE),
    ],
)
def test_compares_identical_candidate_outcomes(
    buggy: ReplayOutcome | None,
    corrected: ReplayOutcome | None,
    expected: ComparisonOutcome,
) -> None:
    result = compare_corrected_behavior(
        candidate_hash="candidate-1", buggy_outcome=buggy, corrected_outcome=corrected
    )
    assert result.outcome is expected
    assert result.candidate_hash == "candidate-1"
