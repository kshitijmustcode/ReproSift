import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { createServer } from './server.js';

// The SDK owns connection setup, stdin EOF handling and transport cleanup.
// stdout belongs exclusively to MCP messages; diagnostics go to stderr.
const handle = serveStdio(createServer, {
  onerror: () => {
    console.error('MCP transport error. Check the client protocol and connection.');
  },
});

let shutdown: Promise<void> | undefined;
function close(): void {
  shutdown ??= handle.close().catch(() => {
    console.error('MCP shutdown failed.');
    process.exitCode = 1;
  });
}

process.once('SIGINT', close);
process.once('SIGTERM', close);
