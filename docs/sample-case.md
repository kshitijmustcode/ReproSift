# First vertical slice: stale coupon after removal

Status: authored development fixture; no application implementation yet.

## Requirement REQ-CART-001, version 1

A 10% coupon applies to the current merchandise subtotal after any cart change. All arithmetic uses integer USD cents. Discount = round(subtotalCents * 10 / 100), with half-cent values rounded up. Total = subtotal minus discount. This fixture has no tax or shipping.

## Bug report

“After applying SAVE10 and removing Item B, the discount does not update and the total is too low.”

## Reset state

- Isolated fixture/cart ID per attempt; no external account.
- Item A: quantity 1, unit price 10000 cents.
- Item B: quantity 1, unit price 5000 cents.
- No coupon initially; subtotal and total 15000 cents.
- Browser storage and backend state reset; locale en-US, currency USD.
- Variant selected by the trusted harness, never by the agent.

## Reproduction

1. Open cart and verify both items are present.
2. Enter SAVE10 and apply it.
3. Verify subtotal 15000, discount 1500, total 13500 cents.
4. Remove Item B; verify Item B is absent and Item A remains.
5. Wait for the cart update to settle using an observable state condition.
6. Assert subtotal 10000, discount 1000, total 9000 cents.

Buggy variant retains discount 1500 and shows total 8500. Corrected variant recalculates discount to 1000 and shows total 9000.

The test asserts the correct total of $90.00, never the buggy total of $85.00 as its success condition. Preconditions distinguish a failed interaction from a matching defect. A failed relevant web-first assertion after its bounded wait is evidence only when the intended state and actual values were captured.

## Evidence and controls

Capture requirement ID/version, immutable candidate ID, seed version, browser/build version, completed steps, expected/actual values, relevant screenshot and trace. Redact network data. Re-run the same candidate in fresh state on both variants; do not reveal variant labels/answer data to the investigator.

No-bug controls: apply coupon without changing cart (13500 total); remove B without coupon (10000 total); run the full report against corrected behavior (9000 total).

## Acceptance

The UI can submit this report, stream evidence, export a runnable test plus fixture prerequisites, and show matching assertion failure on buggy behavior and pass on corrected behavior. A selector error, reset error, unrelated timeout, or wrong expected value cannot satisfy acceptance. Start with this case before generalizing.
