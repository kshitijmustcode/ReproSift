import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const serverPath = fileURLToPath(new URL('../dist/cli.js', import.meta.url));
const expectedStatus = {
  schemaVersion: 1,
  service: 'reprosift-mcp',
  version: '0.0.0',
  status: 'ok',
  transport: 'stdio',
  capabilities: { browserExecution: true },
};

describe.each(['legacy', 'auto'] as const)('MCP over a real stdio process (%s)', (mode) => {
  let client: Client;
  let transport: StdioClientTransport;

  beforeEach(async () => {
    client = new Client(
      { name: 'reprosift-test', version: '0.0.0' },
      { versionNegotiation: { mode, probe: { timeoutMs: 5000 } } },
    );
    transport = new StdioClientTransport({ command: process.execPath, args: [serverPath] });
    await client.connect(transport, { timeout: 5000 });
  });

  afterEach(async () => {
    await transport.close();
    await client.close();
  });

  it('advertises the status tool with input and output contracts', async () => {
    const { tools } = await client.listTools({}, { timeout: 5000 });
    expect(tools.map((tool) => tool.name)).toEqual([
      'collect_browser_evidence',
      'inspect_browser_page',
      'fill_browser_target',
      'click_browser_target',
      'select_browser_option',
      'get_status',
      'create_browser_session',
      'navigate_browser_session',
      'capture_screenshot',
      'close_browser_session',
    ]);
    expect(tools.find((tool) => tool.name === 'get_status')).toMatchObject({
      name: 'get_status',
      inputSchema: { type: 'object', additionalProperties: false },
      outputSchema: { type: 'object' },
      annotations: { readOnlyHint: true, openWorldHint: false },
    });
    expect(tools.find((tool) => tool.name === 'navigate_browser_session')).toMatchObject({
      inputSchema: { type: 'object', required: ['sessionId', 'path'] },
      annotations: { openWorldHint: false },
    });
    expect(tools.find((tool) => tool.name === 'collect_browser_evidence')).toMatchObject({
      inputSchema: { type: 'object', required: ['sessionId'] },
      outputSchema: {
        type: 'object',
        required: [
          'artifactId',
          'sessionId',
          'screenshot',
          'actions',
          'consoleMessages',
          'networkRequests',
        ],
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    });
  });

  it('returns consistent structured and text status with browser lifecycle capability', async () => {
    const result = await client.callTool({ name: 'get_status', arguments: {} }, { timeout: 5000 });
    expect(result.isError).not.toBe(true);
    expect(result.structuredContent).toEqual(expectedStatus);
    expect(result.content).toEqual([{ type: 'text', text: JSON.stringify(expectedStatus) }]);
  });

  it('rejects unexpected arguments', async () => {
    const result = await client.callTool(
      { name: 'get_status', arguments: { targetUrl: 'https://example.com' } },
      { timeout: 5000 },
    );
    expect(result.isError).toBe(true);
    expect(result.structuredContent).toBeUndefined();
  });

  it('rejects an unknown tool', async () => {
    await expect(
      client.callTool({ name: 'missing_tool', arguments: {} }, { timeout: 5000 }),
    ).rejects.toThrow();
  });

  it('releases the server process on client close', async () => {
    const pid = transport.pid;
    expect(pid).not.toBeNull();
    await transport.close();
    if (pid === null) throw new Error('Missing server process ID');
    expect(() => process.kill(pid, 0)).toThrow();
  });
});

it('exits cleanly when stdin closes before a client connects', async () => {
  const child = spawn(process.execPath, [serverPath], { stdio: ['pipe', 'pipe', 'pipe'] });
  try {
    const exit = once(child, 'exit', { signal: AbortSignal.timeout(5000) });
    child.stdin.end();
    expect(await exit).toEqual([0, null]);
  } finally {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
  }
});
