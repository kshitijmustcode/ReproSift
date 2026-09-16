# @reprosift/dashboard

Next.js investigation dashboard using React, strict TypeScript, Tailwind CSS and Lucide icons.

## Run from the repository root

```sh
nvm use
pnpm install --frozen-lockfile
pnpm dev:dashboard
```

Open http://127.0.0.1:3000. Validate with `pnpm build:dashboard`, `pnpm typecheck:dashboard` and `pnpm format:check`.

The home page reads `GET /mcp/status` from FastAPI during server rendering and shows the validated connection state. It defaults to `http://127.0.0.1:8000`; set `REPROSIFT_API_URL` when the API uses another internal URL. This is a server-only setting, so browser clients do not call MCP or receive MCP process configuration.

## Page shells

- `/`: investigation home and empty history.
- `/investigations/new`: local draft with sample and clear actions.
- `/investigations/sample-coupon`: sample workspace with timeline, evidence and requirements panels.
- `/investigations/sample-coupon/result`: empty verification result preview.

Dynamic routes currently accept only `sample-coupon`; unknown IDs show the not-found page. Sample data lives in `src/lib/sample-case.ts` and is presentation-only, not an API contract or evaluation fixture. Shared components own layout and focused client interactions.

## Current limits

Only the MCP connection status is connected. Drafts are not persisted. Investigation submission and exports are disabled. The preview does not claim a reproduced or verified defect. Root ESLint, typecheck and Vitest commands cover this app; its API test validates connected and malformed-response handling.
