# @reprosift/dashboard

Next.js investigation dashboard using React, strict TypeScript, Tailwind CSS and Lucide icons.

## Run from the repository root

```sh
nvm use
pnpm install --frozen-lockfile
pnpm dev:dashboard
```

Open http://127.0.0.1:3000. Validate with `pnpm build:dashboard`, `pnpm typecheck:dashboard` and `pnpm format:check`.

## Page shells

- `/`: investigation home and empty history.
- `/investigations/new`: local draft with sample and clear actions.
- `/investigations/sample-coupon`: sample workspace with timeline, evidence and requirements panels.
- `/investigations/sample-coupon/result`: empty verification result preview.

Dynamic routes currently accept only `sample-coupon`; unknown IDs show the not-found page. Sample data lives in `src/lib/sample-case.ts` and is presentation-only, not an API contract or evaluation fixture. Shared components own layout and focused client interactions.

## Current limits

No API, database, MCP or model calls are connected. Drafts are not persisted. Investigation submission and exports are disabled. The preview does not claim a reproduced or verified defect. ESLint and automated test infrastructure are scheduled for Step 6.
