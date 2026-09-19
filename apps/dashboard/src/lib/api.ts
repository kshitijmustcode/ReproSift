import { z } from 'zod';

const connectedMcpStatusSchema = z.strictObject({
  status: z.literal('connected'),
  mcp: z.strictObject({
    schemaVersion: z.literal(1),
    service: z.literal('reprosift-mcp'),
    version: z.string(),
    status: z.literal('ok'),
    transport: z.literal('stdio'),
    capabilities: z.strictObject({ browserExecution: z.literal(true) }),
  }),
});

const unavailableMcpStatusSchema = z.strictObject({
  status: z.literal('unavailable'),
  error: z.strictObject({
    code: z.literal('MCP_UNAVAILABLE'),
    safeMessage: z.string(),
    phase: z.enum(['connect', 'call', 'validate']),
  }),
});

const mcpStatusSchema = z.union([connectedMcpStatusSchema, unavailableMcpStatusSchema]);

export type McpConnectionStatus = z.infer<typeof mcpStatusSchema>;

const capturedBrowserScreenshotSchema = z.strictObject({
  status: z.literal('captured'),
  screenshot: z.strictObject({
    schemaVersion: z.literal(1),
    contentType: z.literal('image/png'),
    base64: z.string().min(1),
    capturedAt: z.string().datetime(),
    url: z.string().url(),
    title: z.string(),
  }),
});

const unavailableBrowserScreenshotSchema = z.strictObject({
  status: z.literal('unavailable'),
  error: z.strictObject({
    code: z.literal('BROWSER_UNAVAILABLE'),
    safeMessage: z.string(),
    phase: z.enum(['connect', 'create_session', 'navigate', 'screenshot', 'close', 'validate']),
  }),
});

const browserScreenshotSchema = z.union([
  capturedBrowserScreenshotSchema,
  unavailableBrowserScreenshotSchema,
]);

export type BrowserScreenshotStatus = z.infer<typeof browserScreenshotSchema>;

const investigationSchema = z.strictObject({
  id: z.string().min(1),
  report: z.string(),
  expectedBehavior: z.string(),
  scenarioId: z.string(),
  status: z.enum([
    'queued',
    'running',
    'replaying',
    'completed',
    'failed',
    'cancelled',
    'interrupted',
  ]),
  createdAt: z.string().datetime(),
});
const investigationEventSchema = z.strictObject({
  id: z.string(),
  sequence: z.number().int().positive(),
  type: z.string(),
  timestamp: z.string().datetime(),
});
export type InvestigationWorkspace = z.infer<typeof investigationSchema>;
export type InvestigationEvent = z.infer<typeof investigationEventSchema>;

const defaultApiUrl = 'http://127.0.0.1:8000';

function getApiUrl(): string {
  const configuredUrl = process.env.REPROSIFT_API_URL?.trim();
  return (configuredUrl || defaultApiUrl).replace(/\/$/, '');
}

export async function getMcpConnectionStatus(): Promise<McpConnectionStatus> {
  try {
    const response = await fetch(`${getApiUrl()}/mcp/status`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(6_000),
    });
    const payload: unknown = await response.json();
    const parsed = mcpStatusSchema.safeParse(payload);

    if (!parsed.success) {
      return unavailableStatus('The API returned an invalid MCP status response.', 'validate');
    }
    return parsed.data;
  } catch {
    return unavailableStatus('The dashboard could not reach the API.', 'connect');
  }
}

export async function getSampleCartScreenshot(): Promise<BrowserScreenshotStatus> {
  try {
    const response = await fetch(`${getApiUrl()}/browser/sample-cart/screenshot`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(20_000),
    });
    const payload: unknown = await response.json();
    const parsed = browserScreenshotSchema.safeParse(payload);
    if (!parsed.success) {
      return unavailableScreenshot(
        'The API returned an invalid browser screenshot response.',
        'validate',
      );
    }
    return parsed.data;
  } catch {
    return unavailableScreenshot(
      'The dashboard could not reach the browser preview API.',
      'connect',
    );
  }
}

export async function getInvestigationWorkspace(
  investigationId: string,
): Promise<{ investigation: InvestigationWorkspace; events: InvestigationEvent[] } | null> {
  try {
    const [investigationResponse, eventsResponse] = await Promise.all([
      fetch(`${getApiUrl()}/investigations/${investigationId}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(6_000),
      }),
      fetch(`${getApiUrl()}/investigations/${investigationId}/events`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(6_000),
      }),
    ]);
    if (!investigationResponse.ok || !eventsResponse.ok) return null;
    const investigation = investigationSchema.safeParse(await investigationResponse.json());
    const events = z.array(investigationEventSchema).safeParse(await eventsResponse.json());
    return investigation.success && events.success
      ? { investigation: investigation.data, events: events.data }
      : null;
  } catch {
    return null;
  }
}

function unavailableStatus(
  safeMessage: string,
  phase: 'connect' | 'call' | 'validate',
): McpConnectionStatus {
  return { status: 'unavailable', error: { code: 'MCP_UNAVAILABLE', safeMessage, phase } };
}

function unavailableScreenshot(
  safeMessage: string,
  phase: 'connect' | 'create_session' | 'navigate' | 'screenshot' | 'close' | 'validate',
): BrowserScreenshotStatus {
  return { status: 'unavailable', error: { code: 'BROWSER_UNAVAILABLE', safeMessage, phase } };
}
