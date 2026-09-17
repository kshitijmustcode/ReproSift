import { McpServer } from '@modelcontextprotocol/server';
import { type BrowserSessionManager } from '@reprosift/browser-runner';
import {
  browserToolFailure,
  browserToolSuccess,
  captureScreenshotInputShape,
  captureScreenshotOutputSchema,
  closeBrowserSessionInputShape,
  closeBrowserSessionOutputSchema,
  createBrowserSessionInputShape,
  createBrowserSessionManager,
  createBrowserSessionOutputSchema,
  navigateBrowserSessionInputShape,
  navigateBrowserSessionOutputSchema,
} from './browser-tools.js';
import { getServerStatus, statusInputSchema, statusOutputSchema } from './status.js';

export function createServer(): McpServer {
  return createServerWithBrowserSessions(createBrowserSessionManager());
}

function createServerWithBrowserSessions(browserSessions: BrowserSessionManager): McpServer {
  const server = new McpServer({ name: 'reprosift-mcp', version: '0.0.0' });
  server.registerTool(
    'get_status',
    {
      title: 'ReproSift server status',
      description:
        'Returns MCP process status and implemented capabilities. Does not check the API, demo store, or browser readiness.',
      inputSchema: statusInputSchema,
      outputSchema: statusOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    () => {
      const status = getServerStatus();
      return {
        content: [{ type: 'text', text: JSON.stringify(status) }],
        structuredContent: status,
      };
    },
  );
  server.registerTool(
    'create_browser_session',
    {
      title: 'Create browser session',
      description: 'Creates one isolated browser session owned by this MCP connection.',
      inputSchema: createBrowserSessionInputShape,
      outputSchema: createBrowserSessionOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async () => {
      try {
        const sessionId = await browserSessions.createSession();
        return browserToolSuccess({ sessionId });
      } catch (error) {
        return browserToolFailure(error);
      }
    },
  );
  server.registerTool(
    'navigate_browser_session',
    {
      title: 'Navigate browser session',
      description: 'Navigates an owned browser session to an allowed relative demo-store path.',
      inputSchema: navigateBrowserSessionInputShape,
      outputSchema: navigateBrowserSessionOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ sessionId, path }) => {
      try {
        const output = await browserSessions.navigate(sessionId, path);
        return browserToolSuccess(output);
      } catch (error) {
        return browserToolFailure(error);
      }
    },
  );
  server.registerTool(
    'capture_screenshot',
    {
      title: 'Capture browser screenshot',
      description: 'Captures a PNG screenshot from an owned browser session.',
      inputSchema: captureScreenshotInputShape,
      outputSchema: captureScreenshotOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ sessionId }) => {
      try {
        const output = await browserSessions.captureScreenshot(sessionId);
        return browserToolSuccess(output);
      } catch (error) {
        return browserToolFailure(error);
      }
    },
  );
  server.registerTool(
    'close_browser_session',
    {
      title: 'Close browser session',
      description: 'Closes an owned browser session and releases its resources.',
      inputSchema: closeBrowserSessionInputShape,
      outputSchema: closeBrowserSessionOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ sessionId }) => {
      try {
        await browserSessions.closeSession(sessionId);
        return browserToolSuccess({ closed: true as const });
      } catch (error) {
        return browserToolFailure(error);
      }
    },
  );
  return server;
}
