# Evaluation fixtures and benchmark plan

Status: authored fixture specifications. Executable fixtures and benchmark results do not exist yet.

All monetary values below are integer USD cents; no taxes unless specified. Each fixture has independent reset data and exactly one intentional defect. Shipping is disabled except in E04. The harness controls variants and labels.

| ID  | Requirement and seeded action                                                                                           | Buggy observation                             | Corrected observation / no-bug control                                          |
| --- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------- |
| E01 | REQ-CART-001: A=10000, B=5000; apply 10% coupon, remove B                                                               | Discount 1500, total 8500                     | Discount 1000, total 9000; no removal total 13500                               |
| E02 | REQ-CART-002: A=10000, B=5000; no coupon, remove B; total must equal current subtotal                                   | B disappears but total remains 15000          | Total 10000; no removal total 15000                                             |
| E03 | REQ-CART-003: badge equals sum of quantities; A starts quantity 1, change to 3                                          | Badge remains 1                               | Badge 3; initial unchanged quantity shows 1                                     |
| E04 | REQ-SHIP-001: free shipping at merchandise subtotal >=10000; otherwise fee 500; start 9900 then change to exactly 10000 | Boundary incorrectly charges 500; total 10500 | Boundary total 10000; control 9900 has total 10400                              |
| E05 | REQ-CHECKOUT-001: shipping address line 1 required; all other fields valid; submit empty address                        | Order created without address                 | Inline validation, no order created; complete address permits exactly one order |

E01 is the sample case. Its defect may also appear after quantity changes, but removal is the first canonical reproduction. Negative cases must be executable workflows, not merely “no bug” text.

## Dataset separation

Development set: canonical reports, documented acceptance criteria and manual controls. Held-out set: separately authored paraphrases and no-bug reports, frozen after the workflow works. Begin with two held-out paraphrases and one no-bug report per scenario (15 reports), then repeat fixed candidates up to three times for replay measurement.

Do not call this a large or representative benchmark. Report raw counts and dataset version. Repeated runs of one report are not independent new scenarios.

The application retrieves only approved requirement documents. The harness keeps labels, known reproduction answers, variant mapping and corrected source outside agent tool access and production mounts. A separate folder alone is insufficient. Review allowed file mounts, search corpus and tool responses. Never upload held-out answer labels to the model.

## Metrics

- Matching reproduction rate: bug-present reports yielding a valid matching candidate / all bug-present reports, including failed attempts in the denominator.
- False-positive rate: no-bug reports classified as matching / all no-bug reports.
- Assertion validity: independently reviewed supported candidates / reviewed candidates; inspect failures too.
- Replay consistency: per-candidate valid outcome counts and all attempted counts; preserve infrastructure failures.
- Corrected comparison: candidates failing as intended on buggy and passing on corrected / candidates compared; record incomplete comparisons separately.
- Execution failure counts by phase; latency and tokens/cost by run, including unsuccessful runs.

## Procedure and evidence

Freeze model ID, prompt version, limits, fixture build, candidate hash and dependency versions for a run. Keep original reports/results. Compare to a fixed scripted workflow where practical, labeling the baseline's extra knowledge (it knows the manual sequence). Use known-good manually authored tests to check fixture correctness separately from agent ability.

Run initial benchmark, fix problems found on development cases, then evaluate held-out once. If held-out examples influence tuning, mark them as development thereafter and create a new held-out set. Do not invent metrics before execution.

## Harness implementation

The evaluation harness and outcome policy are Python. It invokes the TypeScript Playwright runner through explicit contracts, rather than implementing a second browser driver. Shared JSON contract tests belong in both runtime test suites.
