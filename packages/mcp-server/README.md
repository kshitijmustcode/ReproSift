# @reprosift/mcp-server

The stdio MCP server uses the official TypeScript SDK v2, Zod, and the Step 12 Playwright lifecycle adapter. It exposes status plus scoped browser lifecycle tools.

## Run and verify

From the repository root, with the pinned Node version selected:

```sh
pnpm install --frozen-lockfile
pnpm smoke:mcp
```

The smoke command builds the package, launches it through a real MCP client, discovers `get_status`, validates its structured result, prints it and closes the child process. Browser capture additionally requires local Chromium installation.

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
  "capabilities": { "browserExecution": true }
}
```

The text content contains the same JSON for clients that consume text results. `ok` means this MCP process can answer; it makes no claim that the demo store is currently reachable. No paths, environment values or credentials are exposed.

`create_browser_session`, `navigate_browser_session`, `capture_screenshot`, and `close_browser_session` are the Step 12 lifecycle tools. Navigation accepts only an owned session ID and an allowed relative path; `capture_screenshot` returns an in-memory PNG payload. The Python client owns the short-lived MCP process and always closes the created browser session in a `finally` block. Artifact persistence and browser actions arrive in later steps.

Step 13 adds `inspect_browser_page`, `fill_browser_target`, `click_browser_target`, and `select_browser_option`. Locators are constrained to exact role/name, label, or test ID; arbitrary CSS selectors and JavaScript execution are not available.

Step 14 adds `collect_browser_evidence`. It returns an opaque ephemeral artifact ID, a PNG screenshot, recorded browser actions, console messages, and same-origin request method/path metadata. It does not persist evidence or classify a verification outcome.

`src/status.ts` owns the version 1 Zod input/output schemas and inferred type. `src/server.ts` registers the schemas and delegates to the status function. `src/cli.ts` owns stdio startup/shutdown. `src/smoke.ts` is a development diagnostic, not the Python application client. Keep the status contract here while it has one implementation; Step 8 validates the wire response in Python and adds shared compatibility examples.

## Checks

```sh
pnpm typecheck:mcp
pnpm test:js
pnpm check
```

The root test command builds this package before running the real-process tests. Tests cover tool discovery, structured/text results, invalid arguments, unknown tools, client-close cleanup and stdin EOF. The SDK's legacy and modern negotiation paths are exercised. `pnpm check` includes MCP source and test typing, repository lint and both language test suites.

The v2 package layout and stdio factory follow the [official server guide](https://ts.sdk.modelcontextprotocol.io/v2/get-started/first-server). The SDK's `serveStdio` supports legacy initialization as well as modern clients; Python interoperability is verified by the Step 8 integration tests and the FastAPI dashboard diagnostic. See the [local development guide](../../docs/local-development.md) for startup order.
