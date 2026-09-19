import pytest

from reprosift.verification import (
    AssertionObservation,
    ReplayInput,
    ReplayOutcome,
    classify_replay,
)


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        (
            ReplayInput(True, True, (AssertionObservation("$90", "$85", False),)),
            ReplayOutcome.MATCHING_DEFECT,
        ),
        (
            ReplayInput(True, True, (AssertionObservation("$90", "$90", True),)),
            ReplayOutcome.EXPECTED_BEHAVIOR,
        ),
        (
            ReplayInput(False, True, (), execution_error="reset"),
            ReplayOutcome.EXECUTION_FAILURE,
        ),
        (
            ReplayInput(True, False, (AssertionObservation("$90", "$85", False),)),
            ReplayOutcome.INCONCLUSIVE,
        ),
        (ReplayInput(True, True, (), cancelled=True), ReplayOutcome.INCONCLUSIVE),
    ],
)
def test_classifies_documented_replay_outcomes(
    value: ReplayInput, expected: ReplayOutcome
) -> None:
    assert classify_replay(value) is expected
