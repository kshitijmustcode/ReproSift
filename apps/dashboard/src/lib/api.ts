import { z } from 'zod';

const connectedMcpStatusSchema = z.strictObject({
  status: z.literal('connected'),
  mcp: z.strictObject({
    schemaVersion: z.literal(1),
    service: z.literal('reprosift-mcp'),
    version: z.string(),
    status: z.literal('ok'),
    transport: z.literal('stdio'),
    capabilities: z.strictObject({ browserExecution: z.literal(false) }),
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

function unavailableStatus(
  safeMessage: string,
  phase: 'connect' | 'call' | 'validate',
): McpConnectionStatus {
  return { status: 'unavailable', error: { code: 'MCP_UNAVAILABLE', safeMessage, phase } };
}
