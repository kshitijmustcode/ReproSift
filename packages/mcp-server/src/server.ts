import { McpServer } from '@modelcontextprotocol/server';
import { type BrowserSessionManager } from '@reprosift/browser-runner';
import {
  browserToolFailure,
  browserToolSuccess,
  browserActionOutputSchema,
  collectEvidenceInputShape,
  collectEvidenceOutputSchema,
  clickInputShape,
  captureScreenshotInputShape,
  captureScreenshotOutputSchema,
  closeBrowserSessionInputShape,
  closeBrowserSessionOutputSchema,
  createBrowserSessionInputShape,
  createBrowserSessionManager,
  createBrowserSessionOutputSchema,
  fillInputShape,
  inspectPageInputShape,
  inspectPageOutputSchema,
  navigateBrowserSessionInputShape,
  navigateBrowserSessionOutputSchema,
  selectInputShape,
} from './browser-tools.js';
import { getServerStatus, statusInputSchema, statusOutputSchema } from './status.js';

export function createServer(): McpServer {
  return createServerWithBrowserSessions(createBrowserSessionManager());
}

function createServerWithBrowserSessions(browserSessions: BrowserSessionManager): McpServer {
  const server = new McpServer({ name: 'reprosift-mcp', version: '0.0.0' });
  server.registerTool(
    'collect_browser_evidence',
    {
      title: 'Collect browser evidence',
      description:
        'Returns in-memory screenshot, action, console, and same-origin network evidence.',
      inputSchema: collectEvidenceInputShape,
      outputSchema: collectEvidenceOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ sessionId }) => {
      try {
        return browserToolSuccess(await browserSessions.collectEvidence(sessionId));
      } catch (error) {
        return browserToolFailure(error);
      }
    },
  );
  server.registerTool(
    'inspect_browser_page',
    {
      title: 'Inspect browser page',
      description: 'Returns bounded visible text from an owned browser session.',
      inputSchema: inspectPageInputShape,
      outputSchema: inspectPageOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ sessionId }) => {
      try {
        return browserToolSuccess(await browserSessions.inspectPage(sessionId));
      } catch (error) {
        return browserToolFailure(error);
      }
    },
  );
  server.registerTool(
    'fill_browser_target',
    {
      title: 'Fill browser target',
      description: 'Fills an exact supported locator in an owned browser session.',
      inputSchema: fillInputShape,
      outputSchema: browserActionOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ sessionId, target, value }) => {
      try {
        return browserToolSuccess(await browserSessions.fill(sessionId, target, value));
      } catch (error) {
        return browserToolFailure(error);
      }
    },
  );
  server.registerTool(
    'click_browser_target',
    {
      title: 'Click browser target',
      description: 'Clicks an exact supported locator in an owned browser session.',
      inputSchema: clickInputShape,
      outputSchema: browserActionOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ sessionId, target }) => {
      try {
        return browserToolSuccess(await browserSessions.click(sessionId, target));
      } catch (error) {
        return browserToolFailure(error);
      }
    },
  );
  server.registerTool(
    'select_browser_option',
    {
      title: 'Select browser option',
      description: 'Selects an option in an exact supported locator in an owned browser session.',
      inputSchema: selectInputShape,
      outputSchema: browserActionOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ sessionId, target, value }) => {
      try {
        return browserToolSuccess(await browserSessions.select(sessionId, target, value));
      } catch (error) {
        return browserToolFailure(error);
      }
    },
  );
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
