# @reprosift/browser-runner

TypeScript browser lifecycle, action execution, structured test generation and replay. Return raw observations; Python owns verification classification.

Step 12 implements the first lifecycle boundary with Playwright Chromium. `BrowserSessionManager` creates isolated headless browser contexts, accepts only relative paths resolved against the configured `DEMO_STORE_BASE_URL`, captures in-memory PNG data, and releases context/browser resources when a session closes. It does not perform page interactions, persist artifacts, classify verification outcomes, or select fixture variants.

The MCP package owns the tool contracts and invokes this package. Build it through the root command before starting FastAPI:

```sh
pnpm build:mcp
pnpm --filter @reprosift/browser-runner exec playwright install chromium
```

The Chromium installation is a local development prerequisite, not a committed artifact. Step 13 adds bounded visible-text inspection plus exact role/name, label, and test-id click/fill/select actions. Step 14 adds retained evidence.
