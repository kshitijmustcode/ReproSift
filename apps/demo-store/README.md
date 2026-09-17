# @reprosift/demo-store

Standalone Next.js shopping application using strict TypeScript, React, Tailwind CSS and Lucide icons. The Step 11 sample cart fixture is complete.

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
| `/cart`            | Seeded SAVE10 cart fixture              |
| `/checkout`        | Checkout preview with ordering disabled |

Product pages share the `/products/[id]` route. Unknown products and pages show the not-found view. Shared layout/navigation stays in this app; it does not depend on dashboard code or a running backend.

## Scope and next implementation

`src/lib/cart.ts` owns the deterministic REQ-CART-001 fixture: Item A ($100.00) and Item B ($50.00), integer-cent pricing, SAVE10 application, totals, and cart removal behavior. The cart page starts from this seed on every refresh and provides a local reset action. It intentionally supports the documented buggy behavior by default: applying SAVE10 then removing Item B leaves a $15.00 discount and produces $85.00.

For a local corrected-behavior check, start the store with `DEMO_STORE_VARIANT=corrected pnpm dev:store`; then the same workflow produces a $10.00 discount and $90.00 total. This is a development-only server setting and is not rendered as UI content. Step 15 replaces it with trusted harness-owned selection and reset/isolation controls. There is no persistence, reset endpoint, API or MCP integration yet.

## Verification

```sh
pnpm build:store
pnpm typecheck:store
pnpm lint:js
pnpm test:js
```

`cart.test.ts` protects the seeded totals, coupon controls, buggy observation, and corrected comparison. Browser lifecycle and end-to-end checks are introduced in later steps.
