import { BrowserLifecycleError, BrowserSessionManager } from '@reprosift/browser-runner';
import { z } from 'zod';

const sessionIdSchema = z.uuid();
const locatorSchema = z.discriminatedUnion('strategy', [
  z.strictObject({
    strategy: z.literal('role'),
    role: z.enum(['button', 'combobox', 'link', 'textbox']),
    name: z.string().min(1).max(256),
  }),
  z.strictObject({ strategy: z.literal('label'), label: z.string().min(1).max(256) }),
  z.strictObject({ strategy: z.literal('test_id'), testId: z.string().min(1).max(256) }),
]);
const actionOutputSchema = z.strictObject({
  sessionId: sessionIdSchema,
  action: z.enum(['click', 'fill', 'select']),
  url: z.string().url(),
  title: z.string(),
});

export const inspectPageInputShape = { sessionId: sessionIdSchema };
export const inspectPageOutputSchema = z.strictObject({
  sessionId: sessionIdSchema,
  url: z.string().url(),
  title: z.string(),
  visibleText: z.string().max(12_000),
});
export const clickInputShape = { sessionId: sessionIdSchema, target: locatorSchema };
export const fillInputShape = {
  sessionId: sessionIdSchema,
  target: locatorSchema,
  value: z.string().max(2_000),
};
export const selectInputShape = {
  sessionId: sessionIdSchema,
  target: locatorSchema,
  value: z.string().min(1).max(2_000),
};
export const browserActionOutputSchema = actionOutputSchema;
export const collectEvidenceInputShape = { sessionId: sessionIdSchema };
export const collectEvidenceOutputSchema = z.strictObject({
  artifactId: z.uuid(),
  sessionId: sessionIdSchema,
  screenshot: z.strictObject({
    sessionId: sessionIdSchema,
    contentType: z.literal('image/png'),
    base64: z.string().min(1),
    capturedAt: z.iso.datetime(),
  }),
  actions: z.array(z.string()),
  consoleMessages: z.array(z.string()),
  networkRequests: z.array(z.string()),
});

export const createBrowserSessionInputShape = {};
export const createBrowserSessionInputSchema = z.strictObject(createBrowserSessionInputShape);
export const createBrowserSessionOutputSchema = z.strictObject({ sessionId: sessionIdSchema });

export const navigateBrowserSessionInputShape = {
  sessionId: sessionIdSchema,
  path: z.string().min(1).max(512),
};
export const navigateBrowserSessionInputSchema = z.strictObject(navigateBrowserSessionInputShape);
export const navigateBrowserSessionOutputSchema = z.strictObject({
  sessionId: sessionIdSchema,
  url: z.string().url(),
  title: z.string(),
});

export const captureScreenshotInputShape = { sessionId: sessionIdSchema };
export const captureScreenshotInputSchema = z.strictObject(captureScreenshotInputShape);
export const captureScreenshotOutputSchema = z.strictObject({
  sessionId: sessionIdSchema,
  contentType: z.literal('image/png'),
  base64: z.string().min(1),
  capturedAt: z.iso.datetime(),
});

export const closeBrowserSessionInputShape = { sessionId: sessionIdSchema };
export const closeBrowserSessionInputSchema = z.strictObject(closeBrowserSessionInputShape);
export const closeBrowserSessionOutputSchema = z.strictObject({ closed: z.literal(true) });

export type BrowserToolResult =
  | {
      content: [{ type: 'text'; text: string }];
      structuredContent: object;
    }
  | {
      content: [{ type: 'text'; text: string }];
      isError: true;
    };

export function browserToolFailure(error: unknown): BrowserToolResult {
  const message =
    error instanceof BrowserLifecycleError
      ? error.message
      : 'The browser lifecycle tool could not complete.';
  return { content: [{ type: 'text', text: message }], isError: true };
}

export function browserToolSuccess<T extends object>(output: T): BrowserToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify(output) }],
    structuredContent: output,
  };
}

export function createBrowserSessionManager(): BrowserSessionManager {
  const allowedBaseUrl = process.env.DEMO_STORE_BASE_URL?.trim() || 'http://127.0.0.1:3001';
  return new BrowserSessionManager({
    allowedBaseUrl,
    navigationTimeoutMs: 10_000,
    screenshotTimeoutMs: 10_000,
  });
}
