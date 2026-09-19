import { describe, expect, it } from 'vitest';

import { generatePlaywrightTest } from '../src/test-generator.js';

describe('generatePlaywrightTest', () => {
  it('creates a controlled, replayable coupon assertion template', () => {
    const code = generatePlaywrightTest({
      scenarioId: 'sample-coupon',
      contentHash: 'abc123',
      actions: [
        { action: 'navigate', path: '/cart' },
        { action: 'fill', target: { strategy: 'test_id', testId: 'coupon-code' }, value: 'SAVE10' },
        { action: 'click', target: { strategy: 'role', role: 'button', name: 'Apply' } },
      ],
      assertions: [
        {
          kind: 'money_equals',
          target: { strategy: 'test_id', testId: 'cart-total' },
          expected: '$90.00',
        },
      ],
    });

    expect(code).toContain("import { expect, test } from 'playwright/test';");
    expect(code).toContain('page.getByTestId("coupon-code").fill("SAVE10")');
    expect(code).toContain('page.getByRole("button", { exact: true, name: "Apply" }).click()');
    expect(code).toContain('toHaveText("$90.00")');
  });
});
