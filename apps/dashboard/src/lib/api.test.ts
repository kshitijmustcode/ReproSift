import { afterEach, describe, expect, it, vi } from 'vitest';
import { getInvestigationWorkspace, getMcpConnectionStatus, getSampleCartScreenshot } from './api';

afterEach(() => {
  vi.unstubAllGlobals();
});

it('validates persisted workspace and event responses', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 'x',
            report: 'report',
            expectedBehavior: 'expected',
            scenarioId: 'sample-coupon',
            status: 'queued',
            createdAt: '2026-09-19T00:00:00Z',
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            { id: 'event-1', sequence: 1, type: 'run_started', timestamp: '2026-09-19T00:00:00Z' },
          ]),
        ),
      ),
  );
  await expect(getInvestigationWorkspace('x')).resolves.toMatchObject({
    investigation: { status: 'queued' },
    events: [{ type: 'run_started' }],
  });
});

describe('getSampleCartScreenshot', () => {
  it('accepts the captured screenshot response contract', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            status: 'captured',
            screenshot: {
              schemaVersion: 1,
              contentType: 'image/png',
              base64: 'aW1hZ2U=',
              capturedAt: '2026-09-17T00:00:00Z',
              url: 'http://127.0.0.1:3001/cart',
              title: 'Your cart | ReproSift Store',
            },
          }),
        ),
      ),
    );

    await expect(getSampleCartScreenshot()).resolves.toMatchObject({
      status: 'captured',
      screenshot: { contentType: 'image/png' },
    });
  });
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
              capabilities: { browserExecution: true },
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
