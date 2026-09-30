"""Repeatable evaluation of fixed replay candidates with isolated harness labels."""

from __future__ import annotations

import argparse
import json
import subprocess
import time
from collections import Counter
from collections.abc import Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

from pydantic import BaseModel, ConfigDict, Field

from reprosift.verification import (
    AssertionObservation,
    ReplayInput,
    ReplayOutcome,
    classify_replay,
)


class RecordedAssertion(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    expected: str
    actual: str
    passed: bool


class RecordedReplay(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    preconditions_reached: bool = Field(alias="preconditionsReached")
    supported_requirement: bool = Field(alias="supportedRequirement")
    assertions: tuple[RecordedAssertion, ...]
    execution_error: str | None = Field(default=None, alias="executionError")

    def to_replay_input(self) -> ReplayInput:
        return ReplayInput(
            preconditions_reached=self.preconditions_reached,
            supported_requirement=self.supported_requirement,
            assertions=tuple(
                AssertionObservation(
                    expected=assertion.expected,
                    actual=assertion.actual,
                    passed=assertion.passed,
                )
                for assertion in self.assertions
            ),
            execution_error=self.execution_error,
        )


class EvaluationCase(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    id: str
    scenario_id: str = Field(alias="scenarioId")
    report: str
    expected_outcome: ReplayOutcome = Field(alias="expectedOutcome")
    candidate_hash: str = Field(alias="candidateHash")
    replays: tuple[RecordedReplay, ...] = Field(min_length=1)


class EvaluationDataset(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    version: str
    cases: tuple[EvaluationCase, ...] = Field(min_length=1)


@dataclass(frozen=True)
class ReplaySample:
    replay_input: ReplayInput
    duration_ms: int
    input_tokens: int = 0
    output_tokens: int = 0
    cost_usd: float = 0.0


class ReplayExecutor(Protocol):
    def replay(self, case: EvaluationCase, replay_index: int) -> ReplaySample: ...


class RecordedReplayExecutor:
    """Deterministic harness-only executor used before a browser bridge is selected."""

    def replay(self, case: EvaluationCase, replay_index: int) -> ReplaySample:
        observation = case.replays[replay_index % len(case.replays)]
        return ReplaySample(replay_input=observation.to_replay_input(), duration_ms=0)


class BrowserRunnerReplayExecutor:
    """Adapter boundary for a JSON-in/JSON-out TypeScript runner process."""

    def __init__(self, command: Sequence[str], timeout_seconds: float = 30.0) -> None:
        self._command = tuple(command)
        self._timeout_seconds = timeout_seconds

    def replay(self, case: EvaluationCase, replay_index: int) -> ReplaySample:
        payload = json.dumps(
            {
                "caseId": case.id,
                "candidateHash": case.candidate_hash,
                "replayIndex": replay_index,
            }
        )
        started = time.monotonic()
        completed = subprocess.run(
            self._command,
            input=payload,
            capture_output=True,
            check=False,
            encoding="utf-8",
            timeout=self._timeout_seconds,
        )
        duration_ms = int((time.monotonic() - started) * 1_000)
        if completed.returncode != 0:
            return ReplaySample(
                replay_input=ReplayInput(
                    preconditions_reached=False,
                    supported_requirement=True,
                    assertions=(),
                    execution_error="Browser runner process failed.",
                ),
                duration_ms=duration_ms,
            )
        try:
            return _sample_from_runner_response(completed.stdout, duration_ms)
        except (json.JSONDecodeError, ValueError):
            return ReplaySample(
                replay_input=ReplayInput(
                    preconditions_reached=False,
                    supported_requirement=True,
                    assertions=(),
                    execution_error="Browser runner returned an invalid response.",
                ),
                duration_ms=duration_ms,
            )


class ReplayResult(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    case_id: str = Field(alias="caseId")
    scenario_id: str = Field(alias="scenarioId")
    candidate_hash: str = Field(alias="candidateHash")
    replay_index: int = Field(alias="replayIndex")
    outcome: ReplayOutcome
    expected_outcome: ReplayOutcome = Field(alias="expectedOutcome")
    matches_expected: bool = Field(alias="matchesExpected")
    duration_ms: int = Field(alias="durationMs")
    input_tokens: int = Field(alias="inputTokens")
    output_tokens: int = Field(alias="outputTokens")
    cost_usd: float = Field(alias="costUsd")


class EvaluationReport(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    dataset_version: str = Field(alias="datasetVersion")
    execution_mode: str = Field(alias="executionMode")
    results: tuple[ReplayResult, ...]
    outcome_counts: dict[str, int] = Field(alias="outcomeCounts")
    expected_outcome_mismatches: int = Field(alias="expectedOutcomeMismatches")
    total_duration_ms: int = Field(alias="totalDurationMs")
    total_cost_usd: float = Field(alias="totalCostUsd")


class EvaluationHarness:
    def __init__(self, executor: ReplayExecutor) -> None:
        self._executor = executor

    def run(self, dataset: EvaluationDataset, *, repeats: int) -> EvaluationReport:
        if repeats < 1 or repeats > 3:
            raise ValueError("Evaluation repeats must be between 1 and 3.")
        results: list[ReplayResult] = []
        for case in dataset.cases:
            for replay_index in range(repeats):
                sample = self._executor.replay(case, replay_index)
                outcome = classify_replay(sample.replay_input)
                results.append(
                    ReplayResult(
                        caseId=case.id,
                        scenarioId=case.scenario_id,
                        candidateHash=case.candidate_hash,
                        replayIndex=replay_index + 1,
                        outcome=outcome,
                        expectedOutcome=case.expected_outcome,
                        matchesExpected=outcome is case.expected_outcome,
                        durationMs=sample.duration_ms,
                        inputTokens=sample.input_tokens,
                        outputTokens=sample.output_tokens,
                        costUsd=sample.cost_usd,
                    )
                )
        counts = Counter(result.outcome.value for result in results)
        return EvaluationReport(
            datasetVersion=dataset.version,
            executionMode=type(self._executor).__name__,
            results=tuple(results),
            outcomeCounts=dict(sorted(counts.items())),
            expectedOutcomeMismatches=sum(
                not result.matches_expected for result in results
            ),
            totalDurationMs=sum(result.duration_ms for result in results),
            totalCostUsd=sum(result.cost_usd for result in results),
        )


def load_dataset(path: Path) -> EvaluationDataset:
    return EvaluationDataset.model_validate_json(path.read_text(encoding="utf-8"))


def _sample_from_runner_response(response: str, duration_ms: int) -> ReplaySample:
    payload = json.loads(response)
    if not isinstance(payload, dict):
        raise ValueError("Runner response must be an object.")
    assertions = payload.get("assertions")
    if not isinstance(assertions, list):
        raise ValueError("Runner response must include assertions.")
    preconditions_reached = payload.get("preconditionsReached")
    supported_requirement = payload.get("supportedRequirement")
    if not isinstance(preconditions_reached, bool) or not isinstance(
        supported_requirement, bool
    ):
        raise ValueError("Runner response must include boolean precondition fields.")
    parsed_assertions: list[AssertionObservation] = []
    for assertion in assertions:
        if not isinstance(assertion, dict):
            raise ValueError("Runner assertions must be objects.")
        expected = assertion.get("expected")
        actual = assertion.get("actual")
        passed = assertion.get("passed")
        if (
            not isinstance(expected, str)
            or not isinstance(actual, str)
            or not isinstance(passed, bool)
        ):
            raise ValueError("Runner assertion fields have invalid types.")
        parsed_assertions.append(
            AssertionObservation(expected=expected, actual=actual, passed=passed)
        )
    return ReplaySample(
        replay_input=ReplayInput(
            preconditions_reached=preconditions_reached,
            supported_requirement=supported_requirement,
            assertions=tuple(parsed_assertions),
            execution_error=(
                str(payload["executionError"])
                if payload.get("executionError") is not None
                else None
            ),
        ),
        duration_ms=duration_ms,
    )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run ReproSift's recorded evaluation baseline."
    )
    parser.add_argument("--dataset", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--repeats", type=int, default=3)
    args = parser.parse_args()
    dataset_path = _resolve_repository_path(args.dataset)
    output_path = _resolve_repository_path(args.output)
    report = EvaluationHarness(RecordedReplayExecutor()).run(
        load_dataset(dataset_path), repeats=args.repeats
    )
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        report.model_dump_json(by_alias=True, indent=2) + "\n", encoding="utf-8"
    )


def _resolve_repository_path(path: Path) -> Path:
    if path.is_absolute():
        return path
    return Path(__file__).parents[4] / path


if __name__ == "__main__":
    main()
