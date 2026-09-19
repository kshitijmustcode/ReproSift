export type TestLocator =
  | Readonly<{ strategy: 'role'; role: 'button' | 'combobox' | 'link' | 'textbox'; name: string }>
  | Readonly<{ strategy: 'test_id'; testId: string }>;

export type TestAction =
  | Readonly<{ action: 'navigate'; path: string }>
  | Readonly<{ action: 'click'; target: TestLocator }>
  | Readonly<{ action: 'fill'; target: TestLocator; value: string }>;

export type MoneyAssertion = Readonly<{
  kind: 'money_equals';
  target: TestLocator;
  expected: string;
}>;

export type ReplayCandidate = Readonly<{
  scenarioId: string;
  contentHash: string;
  actions: readonly TestAction[];
  assertions: readonly MoneyAssertion[];
}>;

export function generatePlaywrightTest(candidate: ReplayCandidate): string {
  if (!candidate.actions.length || !candidate.assertions.length) {
    throw new Error('A replay candidate needs actions and at least one assertion.');
  }
  const lines = [
    "import { expect, test } from 'playwright/test';",
    '',
    `test(${literal(`${candidate.scenarioId} regression`)} , async ({ page }) => {`,
    `  // Candidate content hash: ${candidate.contentHash}`,
    ...candidate.actions.map((action) => `  ${actionLine(action)}`),
    ...candidate.assertions.map(
      (assertion) =>
        `  await expect(${locatorLine(assertion.target)}).toHaveText(${literal(assertion.expected)});`,
    ),
    '});',
    '',
  ];
  return lines.join('\n');
}

function actionLine(action: TestAction): string {
  switch (action.action) {
    case 'navigate':
      return `await page.goto(${literal(action.path)});`;
    case 'click':
      return `await ${locatorLine(action.target)}.click();`;
    case 'fill':
      return `await ${locatorLine(action.target)}.fill(${literal(action.value)});`;
  }
}

function locatorLine(locator: TestLocator): string {
  switch (locator.strategy) {
    case 'role':
      return `page.getByRole(${literal(locator.role)}, { exact: true, name: ${literal(locator.name)} })`;
    case 'test_id':
      return `page.getByTestId(${literal(locator.testId)})`;
  }
}

function literal(value: string): string {
  return JSON.stringify(value);
}
