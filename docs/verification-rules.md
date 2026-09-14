# Verification decision table

Status: normative behavior specification. Executable schemas and classifier tests will implement this policy.

Lifecycle status and test outcome are separate. A completed investigation may conclude inconclusive. A verification infrastructure failure is not a product defect.

| Observation                                                                                             | Per-replay outcome                                   | Required handling                                                                 |
| ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| Preconditions reached; supported expected behavior; intended assertion detects the reported discrepancy | matching_defect                                      | Preserve expected/actual values, requirement reference and failure signature      |
| Preconditions reached; all relevant assertions pass                                                     | expected_behavior                                    | Say “not reproduced under tested conditions”                                      |
| Missing/ambiguous locator, navigation failure, reset failure, browser crash                             | execution_failure                                    | Include phase and typed error; do not count as matching defect                    |
| Timeout before reaching target state                                                                    | execution_failure                                    | Preserve partial evidence and timeout phase                                       |
| Relevant assertion times out with stable observed wrong value after target state was established        | matching_defect only when discrepancy matches report | Assertion timeout alone is insufficient                                           |
| Missing or conflicting requirement; invalid expectation; insufficient observations                      | inconclusive                                         | Explain missing evidence; never silently repair the expectation                   |
| Cancelled or budget-exhausted run                                                                       | inconclusive for investigation conclusion            | Retain lifecycle cancelled or interruption reason; do not fabricate replay result |

## Aggregation

- Report every attempt; never hide earlier failures behind a retry.
- All valid runs matching: “matching defect observed in N/N valid replays,” with execution-failure count separately.
- All valid runs passing: expected behavior observed under tested conditions.
- Mixed matching/passing: inconsistent observations; do not assume test flakiness or change waits automatically.
- Only execution failures or inadequate evidence: inconclusive.
- Any execution failure means the intended replay sample was incomplete, even if the other runs match. Show valid/attempted denominators.
- Three replays are an initial consistency check, not proof of determinism or a statistical guarantee.

## Corrected-version comparison

Use the identical immutable candidate, seed and relevant environment settings. Record comparison as supported (matching bug + corrected pass), not_supported (valid observations fail to distinguish), or unavailable (missing variant / incomplete execution). This does not prove the patch is otherwise correct.

## Candidate integrity

Replay is recorded actions plus deterministic assertions, with no LLM decisions or locator self-healing. A revision creates a new candidate version and explanation. Assertions remain grounded in authored requirements; weakening them to achieve success is prohibited.

Prefer Playwright auto-waiting and bounded web-first assertions. Fresh browser contexts must be paired with reset backend state. Network events support a finding but do not alone prove causality.
