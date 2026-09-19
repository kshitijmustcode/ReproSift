"""Pure verification policy for raw replay observations."""

from dataclasses import dataclass
from enum import StrEnum


class ReplayOutcome(StrEnum):
    MATCHING_DEFECT = "matching_defect"
    EXPECTED_BEHAVIOR = "expected_behavior"
    EXECUTION_FAILURE = "execution_failure"
    INCONCLUSIVE = "inconclusive"


@dataclass(frozen=True)
class AssertionObservation:
    expected: str
    actual: str
    passed: bool


@dataclass(frozen=True)
class ReplayInput:
    preconditions_reached: bool
    supported_requirement: bool
    assertions: tuple[AssertionObservation, ...]
    execution_error: str | None = None
    cancelled: bool = False


def classify_replay(value: ReplayInput) -> ReplayOutcome:
    if value.cancelled or not value.supported_requirement:
        return ReplayOutcome.INCONCLUSIVE
    if value.execution_error is not None or not value.preconditions_reached:
        return ReplayOutcome.EXECUTION_FAILURE
    if not value.assertions:
        return ReplayOutcome.INCONCLUSIVE
    if all(assertion.passed for assertion in value.assertions):
        return ReplayOutcome.EXPECTED_BEHAVIOR
    return ReplayOutcome.MATCHING_DEFECT
