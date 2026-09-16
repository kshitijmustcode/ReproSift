# @reprosift/mcp-server

Step 7 implements a standalone stdio MCP server with the official TypeScript SDK v2 and Zod. It exposes one read-only `get_status` tool. Browser tools arrive in later steps.

## Run and verify

From the repository root, with the pinned Node version selected:

```sh
pnpm install --frozen-lockfile
pnpm smoke:mcp
```

The smoke command builds the package, launches it through a real MCP client, discovers `get_status`, validates its structured result, prints it and closes the child process. No API, dashboard, model credits or browser installation are required.

For an MCP host or the future Python client, build once with `pnpm build:mcp`, then launch `node /absolute/path/to/ReproSift/packages/mcp-server/dist/cli.js`. Use the actual absolute checkout path and a Node 24 executable available to that host. Invoke Node directly so package-manager output cannot enter the MCP stdout stream.

The server has no localhost port or HTTP endpoint. The client owns its process and pipes; running `pnpm --filter @reprosift/mcp-server start` manually waits for MCP messages on stdin. Close stdin or send SIGINT/SIGTERM to shut down. The SDK owns transport cleanup, while CLI diagnostics use stderr only. The entry point fixes the transport to stdio and does not read the proposed `MCP_TRANSPORT` environment variable.

## Tool contract

`get_status` accepts an empty object `{}` and rejects additional arguments. Its structured output is:

```json
{
  "schemaVersion": 1,
  "service": "reprosift-mcp",
  "version": "0.0.0",
  "status": "ok",
  "transport": "stdio",
  "capabilities": { "browserExecution": false }
}
```

The text content contains the same JSON for clients that consume text results. `ok` means this MCP process can answer; it makes no claim about the API, demo store or browser readiness. No paths, environment values or credentials are exposed.

`src/status.ts` owns the version 1 Zod input/output schemas and inferred type. `src/server.ts` registers the schemas and delegates to the status function. `src/cli.ts` owns stdio startup/shutdown. `src/smoke.ts` is a development diagnostic, not the Python application client. Keep the status contract here while it has one implementation; Step 8 validates the wire response in Python and adds shared compatibility examples.

## Checks

```sh
pnpm typecheck:mcp
pnpm test:js
pnpm check
```

The root test command builds this package before running the real-process tests. Tests cover tool discovery, structured/text results, invalid arguments, unknown tools, client-close cleanup and stdin EOF. The SDK's legacy and modern negotiation paths are exercised. `pnpm check` includes MCP source and test typing, repository lint and both language test suites.

The v2 package layout and stdio factory follow the [official server guide](https://ts.sdk.modelcontextprotocol.io/v2/get-started/first-server). The SDK's `serveStdio` supports legacy initialization as well as modern clients; actual Python interoperability remains Step 8's acceptance check.
