import { afterEach, describe, expect, it, vi } from 'vitest';
import { getMcpConnectionStatus } from './api';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getMcpConnectionStatus', () => {
  it('accepts the connected FastAPI response contract', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            status: 'connected',
            mcp: {
              schemaVersion: 1,
              service: 'reprosift-mcp',
              version: '0.0.0',
              status: 'ok',
              transport: 'stdio',
              capabilities: { browserExecution: false },
            },
          }),
        ),
      ),
    );

    await expect(getMcpConnectionStatus()).resolves.toMatchObject({
      status: 'connected',
      mcp: { service: 'reprosift-mcp' },
    });
  });

  it('does not trust malformed API data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"status":"connected"}')));

    await expect(getMcpConnectionStatus()).resolves.toEqual({
      status: 'unavailable',
      error: {
        code: 'MCP_UNAVAILABLE',
        safeMessage: 'The API returned an invalid MCP status response.',
        phase: 'validate',
      },
    });
  });
});
