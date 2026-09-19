import { type BrowserLocator, type BrowserSessionManager } from './session.js';
import { type ReplayCandidate, type TestAction } from './test-generator.js';

export type ReplayAssertionObservation = Readonly<{
  expected: string;
  actual: string;
  passed: boolean;
}>;

export type ReplayObservation = Readonly<{
  candidateHash: string;
  assertions: readonly ReplayAssertionObservation[];
}>;

export async function replayCandidate(
  browser: BrowserSessionManager,
  candidate: ReplayCandidate,
): Promise<ReplayObservation> {
  const sessionId = await browser.createSession();
  try {
    const firstNavigation = candidate.actions.find(
      (action): action is Extract<TestAction, { action: 'navigate' }> =>
        action.action === 'navigate',
    );
    if (!firstNavigation) throw new Error('A replay candidate must begin with navigation.');
    await browser.resetSession(sessionId, firstNavigation.path);
    for (const action of candidate.actions.slice(1)) await applyAction(browser, sessionId, action);
    const assertions = await Promise.all(
      candidate.assertions.map(async (assertion) => {
        const actual = await browser.readTargetText(sessionId, assertion.target);
        return { expected: assertion.expected, actual, passed: actual === assertion.expected };
      }),
    );
    return { candidateHash: candidate.contentHash, assertions };
  } finally {
    await browser.closeSession(sessionId);
  }
}

async function applyAction(browser: BrowserSessionManager, sessionId: string, action: TestAction) {
  switch (action.action) {
    case 'click':
      return browser.click(sessionId, action.target as BrowserLocator);
    case 'fill':
      return browser.fill(sessionId, action.target as BrowserLocator, action.value);
    case 'navigate':
      return browser.navigate(sessionId, action.path);
  }
}
