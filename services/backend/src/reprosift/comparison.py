"""Corrected-version comparison policy for one immutable replay candidate."""

from dataclasses import dataclass
from enum import StrEnum

from reprosift.verification import ReplayOutcome


class ComparisonOutcome(StrEnum):
    SUPPORTED = "supported"
    NOT_SUPPORTED = "not_supported"
    UNAVAILABLE = "unavailable"


@dataclass(frozen=True)
class CorrectedComparison:
    candidate_hash: str
    buggy_outcome: ReplayOutcome | None
    corrected_outcome: ReplayOutcome | None
    outcome: ComparisonOutcome


def compare_corrected_behavior(
    *,
    candidate_hash: str,
    buggy_outcome: ReplayOutcome | None,
    corrected_outcome: ReplayOutcome | None,
) -> CorrectedComparison:
    if buggy_outcome is None or corrected_outcome is None:
        outcome = ComparisonOutcome.UNAVAILABLE
    elif (
        buggy_outcome is ReplayOutcome.MATCHING_DEFECT
        and corrected_outcome is ReplayOutcome.EXPECTED_BEHAVIOR
    ):
        outcome = ComparisonOutcome.SUPPORTED
    elif buggy_outcome in {
        ReplayOutcome.EXECUTION_FAILURE,
        ReplayOutcome.INCONCLUSIVE,
    } or corrected_outcome in {
        ReplayOutcome.EXECUTION_FAILURE,
        ReplayOutcome.INCONCLUSIVE,
    }:
        outcome = ComparisonOutcome.UNAVAILABLE
    else:
        outcome = ComparisonOutcome.NOT_SUPPORTED
    return CorrectedComparison(
        candidate_hash, buggy_outcome, corrected_outcome, outcome
    )
