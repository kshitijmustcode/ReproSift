import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { statusOutputSchema } from './status.js';

// Development diagnostic only. The Python production client arrives in Step 8.
const client = new Client({ name: 'reprosift-smoke', version: '0.0.0' });
const transport = new StdioClientTransport({
  command: process.execPath,
  args: [fileURLToPath(new URL('./cli.js', import.meta.url))],
});

try {
  await client.connect(transport, { timeout: 5000 });
  const { tools } = await client.listTools({}, { timeout: 5000 });
  if (!tools.some((tool) => tool.name === 'get_status')) {
    throw new Error('The MCP server did not advertise get_status.');
  }
  const result = await client.callTool({ name: 'get_status', arguments: {} }, { timeout: 5000 });
  if (result.isError) throw new Error('The MCP status tool returned an error.');
  const status = statusOutputSchema.parse(result.structuredContent);
  console.log(JSON.stringify({ tools: tools.map((tool) => tool.name), status }, null, 2));
} finally {
  await transport.close();
  await client.close();
}
