import { McpServer } from '@modelcontextprotocol/server';
import { getServerStatus, statusInputSchema, statusOutputSchema } from './status.js';

export function createServer(): McpServer {
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
  return server;
}
