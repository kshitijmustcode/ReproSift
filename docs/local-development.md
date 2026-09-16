# Local development

This guide starts the currently implemented integration:

```text
Dashboard → FastAPI → Python MCP client → TypeScript MCP status tool
```

It does not start browser execution, persistence, model calls, queues, or an investigation worker. No credentials are required.

## One-time setup

From the repository root, select the pinned Node version and install both locked environments:

```sh
nvm use
pnpm install --frozen-lockfile
uv sync --project services/backend --locked
pnpm build:mcp
```

`pnpm build:mcp` creates the ignored `packages/mcp-server/dist/cli.js` entry point used by the Python status client. Re-run it after changing MCP TypeScript source. The project needs Node 24.21.0, pnpm 11.19.0, Python 3.13.15, and uv 0.12.13; see [prerequisites](prerequisites.md) for installation details.

## Start the local services

Open separate terminals at the repository root.

Terminal 1 starts FastAPI on `127.0.0.1:8000`:

```sh
uv run --project services/backend --locked reprosift-api
```

Terminal 2 starts the dashboard on `127.0.0.1:3000`:

```sh
pnpm dev:dashboard
```

The dashboard defaults to `http://127.0.0.1:8000`. To use another internal API address, set its server-only configuration before starting the dashboard:

```sh
REPROSIFT_API_URL=http://127.0.0.1:8000 pnpm dev:dashboard
```

Optional Terminal 3 starts the independent demo store on `127.0.0.1:3001`:

```sh
pnpm dev:store
```

## Verify the integration

With FastAPI running, run these commands from another terminal:

```sh
curl --fail --silent http://127.0.0.1:8000/health
curl --fail --silent http://127.0.0.1:8000/mcp/status
```

The first response is API liveness. The second starts a short-lived local Node MCP process through Python and should report `"status":"connected"`, `"service":"reprosift-mcp"`, and `"browserExecution":false`. Open http://127.0.0.1:3000 and confirm the home page shows **Connected to reprosift-mcp**. A dashboard card reading **Unavailable** means FastAPI returned a safe MCP diagnostic failure; `/health` can still be healthy in that case.

`pnpm smoke:mcp` independently builds, launches, discovers, calls, and closes the TypeScript MCP server. It is a one-shot diagnostic, not a background service:

```sh
pnpm smoke:mcp
```

## Checks and shutdown

Run the full repository validation before accepting changes:

```sh
pnpm check
```

Use `Ctrl+C` in each service terminal to stop it. The Python status client owns and closes its short-lived Node MCP child process on every probe, so there is no separate MCP daemon to stop.

## Common local failures

| Symptom                              | Check                                                                                                                                    |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `/mcp/status` returns `503`          | Run `pnpm build:mcp`, then restart FastAPI. Check that `node` is available in the FastAPI terminal.                                      |
| Dashboard shows Unavailable          | Confirm FastAPI is running, then run both curl commands above. Set `REPROSIFT_API_URL` only when the API is not at its default address.  |
| A port is already in use             | Stop the prior local development process or select a different `API_PORT`; dashboard and store ports are fixed by their current scripts. |
| Installation rejects the Node engine | Run `nvm use` from the repository root and confirm the pinned Node version.                                                              |

The dashboard intentionally shows connection state only. It cannot create investigations or execute browser actions yet.
