# Python backend

Step 5 implements the uv-managed FastAPI package, startup configuration and process health endpoint. Python will also own agent orchestration, retrieval, persistence, verification policy and evaluation.

## Run from the repository root

```sh
uv sync --project services/backend --locked
uv run --project services/backend --locked reprosift-api
```

Uses Python 3.13.15 from the root `.python-version`. Open http://127.0.0.1:8000/health or http://127.0.0.1:8000/docs. Restart after code changes; this entry point does not enable automatic reload.

`GET /health` returns `{"status":"ok","service":"reprosift-api"}`. This is process liveness only; it does not check a database, MCP connection or model provider. No external service credentials are needed. Investigation routes and workers are not implemented.

## Configuration

Settings load once before the CLI opens the server socket. With no arguments, only process environment and defaults are used. To read a dotenv file explicitly:

```sh
uv run --project services/backend --locked reprosift-api --env-file .env
```

The path is relative to the invoking terminal's directory. No automatic dotenv search occurs. Environment variables override file values; missing or unreadable requested files fail startup.

| Variable               | Default                         | Validation / use                                       |
| ---------------------- | ------------------------------- | ------------------------------------------------------ |
| APP_ENV                | development                     | development, test or production                        |
| API_HOST               | 127.0.0.1                       | IPv4 or IPv6 address                                   |
| API_PORT               | 8000                            | Integer from 1 to 65535                                |
| LOG_LEVEL              | info                            | debug, info, warning, error or critical                |
| MCP_NODE_COMMAND       | node                            | Local executable that launches the stdio MCP process   |
| MCP_SERVER_ENTRYPOINT  | packages/mcp-server/dist/cli.js | Absolute path or repository-relative compiled entry    |
| MCP_CONNECT_TIMEOUT_MS | 5000                            | Integer from 100 to 30000; launch and initialize bound |
| MCP_CALL_TIMEOUT_MS    | 5000                            | Integer from 100 to 30000; per-tool-call bound         |

Invalid values fail startup with exit code 2 and field/error categories, without logging the supplied values. Extra dotenv keys are ignored because the root template also documents future features. Production disables `/docs` and `/openapi.json`.

## MCP status adapter

The Python investigation service owns the client session. `McpStatusClient.from_settings(Settings())` starts the compiled TypeScript server over stdio, initializes one session, calls `get_status`, validates the camelCase response as an immutable Python contract, then closes both session and child process. It reports safe `connect`, `call`, or `validate` errors; connection and call timeouts are bounded independently. `pnpm test:python` builds the TypeScript entry point first and runs a real cross-language test, plus missing-server, unavailable-command, timeout, and malformed-response cases.

## Structure and checks

- `src/reprosift/config.py`: validated immutable process settings.
- `src/reprosift/app.py`: app factory with explicit settings injection.
- `src/reprosift/health.py`: typed HTTP response and health route.
- `src/reprosift/cli.py`: configuration validation and server lifecycle entry point.
- `src/reprosift/mcp/status_client.py`: scoped stdio MCP adapter and status contract.
- `tests/test_api.py`: health contract, configuration errors, dotenv precedence and CLI error redaction.
- `tests/test_mcp_status_client.py`: real TypeScript MCP integration and failure handling.

```sh
uv run --directory services/backend --locked ruff format --check
uv run --directory services/backend --locked ruff check
uv run --directory services/backend --locked mypy
uv run --directory services/backend --locked pytest
```

These commands select the backend working directory so checks discover its configuration. Python checks were introduced here to satisfy the coding standards; Step 6 still covers repository-wide checks and TypeScript lint/test setup.

Settings follow the [FastAPI settings guide](https://fastapi.tiangolo.com/advanced/settings/); packaging uses the [uv build backend](https://docs.astral.sh/uv/concepts/build-backend/). Dependencies are pinned in `pyproject.toml` and resolved in `uv.lock`.

This directory is deliberately outside pnpm workspace globs. One Python backend package is sufficient; do not add a separate uv workspace until multiple Python packages actually require one.
