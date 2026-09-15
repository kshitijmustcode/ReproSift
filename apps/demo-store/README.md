# @reprosift/demo-store

Standalone Next.js shopping application using strict TypeScript, React, Tailwind CSS and Lucide icons. Step 4 page shells are complete.

## Start locally

From the repository root:

```sh
nvm use
pnpm install --frozen-lockfile
pnpm dev:store
```

Open http://127.0.0.1:3001. The store runs independently; the dashboard can run in another terminal with `pnpm dev:dashboard` on port 3000. Current scripts bind explicitly to 127.0.0.1; the proposed root `.env.example` is not consumed yet.

## Routes

| Route              | Content                                 |
| ------------------ | --------------------------------------- |
| `/`                | Catalog with two product previews       |
| `/products/item-a` | Item A, $100.00                         |
| `/products/item-b` | Item B, $50.00                          |
| `/cart`            | Empty cart shell                        |
| `/checkout`        | Checkout preview with ordering disabled |

Product pages share the `/products/[id]` route. Unknown products and pages show the not-found view. Shared layout/navigation stays in this app; it does not depend on dashboard code or a running backend.

## Scope and next implementation

`src/lib/catalog.ts` contains presentation data, with integer USD cents matching the planned sample prices. These are not attempt-scoped fixture seeds. The cart starts empty, adding products is disabled, and checkout cannot place orders. There is no persistence, coupon calculation, reset endpoint, variant selection, API or MCP integration yet.

Step 11 introduces the documented sample cart and buggy/corrected behavior. Keep trusted variant labels out of browser-visible data. Read `docs/sample-case.md` and the evaluation plan before implementing that step.

## Verification

```sh
pnpm build:store
pnpm typecheck:store
pnpm format:check
```

Browser checks cover catalog → product → cart → checkout navigation, both product details, disabled actions, unknown-product handling and mobile layouts. ESLint and automated test infrastructure remain Step 6.
