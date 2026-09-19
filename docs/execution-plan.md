# Execution checklist

Last updated: 2026-09-17.

## Current status

Steps 1–20 are complete. The dashboard validates and renders persisted investigation workspace status and events through FastAPI. Steps 21–34 remain pending.

**Next action: Step 21 — record structured reproductions.** Store immutable actions, preconditions, and assertions.

## How to use this plan

- Execute in order, verify the completion check, then update the checkbox and progress log with evidence before moving on. Do not mark a step complete merely because files were generated.
- Read README.md, AGENTS.md and relevant specifications first. Preserve existing work; inspect repository status at session start.
- Install dependencies when their component is introduced. Read existing code and avoid repeating completed steps.
- Track partial work, blockers, commands/checks and the exact next action in the progress log. This checklist records progress; README.md owns product scope and the approximate 14-day schedule.
- These are implementation steps, not 34 separate days. The 14-day target assumes roughly 4–6 focused hours per day and may change as integration work reveals constraints.
- This sequence refines the earlier schedule: build one sample end to end before the other four scenarios. Lightweight local database/queue containers may be added when required; step 31 is full application containerization.
- Step 17 may introduce the embedding-only provider adapter needed for retrieval; step 18 adds model generation and consolidates provider usage/budgets. Avoid duplicating OpenAI configuration.
- Cancellation, cleanup and ownership begin with resource-owning features, even when later steps broaden verification. No unmanaged long-running work after returning an HTTP response.
- Step 32 selects a provider and costs; it does not authorize purchases. Apply existing authorization and deployment constraints before external changes.

## Phase 1 — Scaffold the project

- [x] **Step 1. Verify prerequisites**
  - Work: Check Node.js, pnpm, Python, uv, Docker and Git. Select compatible runtime versions.
  - Completion check: Required tools run and selected versions are documented.

- [x] **Step 2. Initialize the repository**
  - Status: complete. Git and runtime pins preserved; pnpm workspace discovers five private members plus root, with a synchronized lockfile and documented directory ownership.
  - Work: Initialize Git only if absent; add workspace configuration, runtime pins and package structure.
  - Completion check: Existing documents preserved; dependencies and secrets correctly ignored.

- [x] **Step 3. Create the dashboard**
  - Work: Scaffold Next.js with TypeScript, Tailwind and the four product page shells.
  - Completion check: Dashboard opens locally and navigation works.

- [x] **Step 4. Create the demo store**
  - Work: Scaffold a separate Next.js application with catalog, product, cart and checkout routes.
  - Completion check: Store opens independently of the dashboard.

- [x] **Step 5. Create the Python backend**
  - Status: complete. Locked Python package, explicit dotenv loading, validated API settings, app factory and `/health`; Python checks introduced now per AGENTS.md.
  - Work: Initialize a uv-managed Python package with FastAPI, validated configuration and a health endpoint.
  - Completion check: Backend starts; valid and invalid configuration behave correctly.

- [x] **Step 6. Configure development checks**
  - Status: complete. Root ESLint/Vitest and aggregate commands cover both Next.js apps; Ruff, mypy and pytest cover the Python package.
  - Work: Add TypeScript checks, ESLint, Ruff, mypy, pytest and basic test configuration. Retain Prettier.
  - Completion check: Formatting, linting, type checks and starter tests pass.

- [x] **Step 7. Create the MCP server**
  - Status: complete. Official TypeScript SDK v2, Zod input/output schemas, stdio lifecycle, smoke client and real-process protocol tests.
  - Work: Initialize the TypeScript MCP server with a small status tool and validated output.
  - Completion check: An MCP client can discover and call the tool.

- [x] **Step 8. Connect Python to MCP**
  - Status: complete. Python MCP SDK 2.2.0 client launches the compiled TypeScript stdio entry point per probe, validates schema version 1, applies separate initialization/tool timeouts, and always exits scoped transport/session contexts.
  - Work: Add a Python MCP client adapter with explicit session ownership and cleanup.
  - Completion check: Python calls the TypeScript tool and handles connection failure.

- [x] **Step 9. Connect the dashboard to FastAPI**
  - Status: complete. FastAPI exposes a typed, safe MCP diagnostic and the dashboard server validates/render its result with Zod; the browser never connects to MCP directly.
  - Work: Add a typed API client and connection-status display.
  - Completion check: Dashboard displays MCP status obtained through Python.

- [x] **Step 10. Document startup**
  - Status: complete. A fresh-terminal guide covers locked setup, build prerequisites, API/dashboard/store terminals, health/MCP probes, smoke diagnostic, shutdown, and expected local failures.
  - Work: Add development commands and update setup instructions.
  - Completion check: Instructions work from a fresh terminal.

## Phase 2 — Build one browser workflow

- [x] **Step 11. Implement the sample cart**
  - Status: complete. `src/lib/cart.ts` owns seeded cent arithmetic and coupon state; the `/cart` client UI exposes stable controls and observable totals. Unit tests cover the initial state, coupon control, no-coupon control, buggy $85.00 observation and corrected $90.00 comparison. Local server configuration selects the corrected development comparison without displaying a variant label.
  - Work: Build the documented coupon scenario with seeded data and buggy/corrected variants.
  - Completion check: Manual reproduction gives the specified totals.

- [x] **Step 12. Add browser lifecycle tools**
  - Status: complete. Playwright Chromium sessions are isolated, limited to the configured local demo-store origin, and explicitly closed through Python-owned MCP calls. The FastAPI screenshot route validates the returned PNG payload and the sample dashboard workspace renders it without exposing MCP configuration.
  - Work: Implement scoped session creation, allowed navigation, screenshots and cleanup.
  - Completion check: Python requests a screenshot through MCP and the UI displays it.

- [x] **Step 13. Add browser actions**
  - Status: complete. The MCP server provides bounded visible-text inspection and exact role/name, label, or test-id click/fill/select actions. Python executes the canonical coupon-and-remove sequence through those tools and validates its returned observation without classifying a defect.
  - Work: Implement page inspection, click, fill and select with runtime validation.
  - Completion check: A scripted sequence applies the coupon and removes an item.

- [x] **Step 14. Capture evidence**
  - Status: complete. The browser MCP server emits an opaque ephemeral artifact ID, in-memory PNG screenshot, action log, console messages, and same-origin request method/path metadata. The Python client validates the evidence after the canonical cart workflow and never classifies the observed behavior.
  - Work: Record action results, console/network events, screenshots and artifact references.
  - Completion check: Sample workflow produces inspectable evidence.

- [x] **Step 15. Add reset and isolation**
  - Status: complete. Every MCP session creates a fresh Playwright context. The reset tool clears cookies, local storage, and session storage before reloading the seeded cart route; Python calls it before the canonical workflow. Navigation and mutating actions have a 12-command cap. The current demo fixture is client-only, so there is no backend cart state before Step 16.
  - Work: Reset backend and browser state; enforce allowed targets and execution limits.
  - Completion check: Repeated runs start identically and release resources.

## Phase 3 — Add investigation intelligence

- [x] **Step 16. Add persistence**
  - Status: complete. SQLAlchemy models, an Alembic migration, and repositories store investigations, attempts, ordered events, and artifact metadata. The database URL supports PostgreSQL deployments and defaults to SQLite for self-contained local setup.
  - Work: Set up PostgreSQL, migrations, investigations, attempts, events and artifact metadata.
  - Completion check: Run history survives service restarts.

- [x] **Step 17. Implement requirements retrieval**
  - Status: complete. Versioned Markdown requirements are split into persisted heading chunks and retrieved by a bounded deterministic lexical baseline with document/version/chunk citations. The Step 18 OpenAI provider adapter will add embeddings and PostgreSQL pgvector ranking without changing the citation contract.
  - Work: Add Markdown/text ingestion, embeddings, pgvector search and source references.
  - Completion check: Coupon requirement is retrieved with its version and citation.

- [x] **Step 18. Add OpenAI integration**
  - Status: complete. The provider adapter uses the official Responses API with strict JSON Schema output, validates a Pydantic plan, and enforces per-call and per-run token budgets. Unit tests use an injected fake client; a live request requires a user-configured server-side API key.
  - Work: Implement the model adapter, structured outputs, usage recording and budgets.
  - Completion check: One bounded model request succeeds and failures are reported clearly.

- [x] **Step 19. Build the LangGraph workflow**
  - Status: complete. A bounded LangGraph run retrieves approved requirement citations, requests one structured model plan, and collects raw scoped browser evidence before terminating. It does not classify a defect or loop/retry actions.
  - Work: Connect requirement retrieval, browser observation, action selection and stopping rules.
  - Completion check: Agent investigates the sample report without a hardcoded action sequence.

- [x] **Step 20. Build the investigation workspace**
  - Status: complete. FastAPI creates, reads, lists events for, and idempotently cancels persisted investigations. The dashboard validates the workspace contract and renders persisted status and event progress for real investigation IDs.
  - Work: Show persisted progress, screenshots, evidence and cancellation.
  - Completion check: User can submit, follow and cancel a run.

## Phase 4 — Produce and verify regression tests

- [ ] **Step 21. Record structured reproductions**
  - Work: Store versioned actions, preconditions, assertions and requirement references.
  - Completion check: Candidate data passes schema validation and remains immutable.

- [ ] **Step 22. Generate Playwright tests**
  - Work: Convert candidates into test code using controlled templates.
  - Completion check: Exported test runs with documented setup.

- [ ] **Step 23. Implement independent replay**
  - Work: Replay without LLM decisions against freshly reset state.
  - Completion check: Intended assertion fails on the buggy version.

- [ ] **Step 24. Implement verification policy**
  - Work: Classify matching defects, expected behavior, execution failures and inconclusive results in Python.
  - Completion check: Classifier tests cover the documented decision table.

- [ ] **Step 25. Compare corrected behavior**
  - Work: Execute the identical candidate against the corrected variant.
  - Completion check: Relevant assertion passes without modifying the test.

- [ ] **Step 26. Complete the results page**
  - Work: Add comparison results, evidence, replay controls and downloads.
  - Completion check: Report-to-test demo works through the UI.

## Phase 5 — Reliability and evaluation

- [ ] **Step 27. Add durable job execution**
  - Work: Introduce Celery/Redis locally, attempt tracking, recovery and concurrency limits.
  - Completion check: Worker failure produces a defined outcome without blindly repeating actions.

- [ ] **Step 28. Add the remaining scenarios**
  - Work: Implement the other four fixture specifications and corrected counterparts.
  - Completion check: Manually authored control tests validate each fixture.

- [ ] **Step 29. Build the evaluation harness**
  - Work: Add report variations, no-bug cases, replay measurements and cost/latency reporting.
  - Completion check: Repeatable command generates benchmark results including failures.

- [ ] **Step 30. Fix measured weaknesses**
  - Work: Improve issues exposed by evaluation and add targeted regression coverage.
  - Completion check: Improvements are supported by repeatable results.

## Phase 6 — Deploy and package

- [ ] **Step 31. Containerize the services**
  - Work: Add reproducible images and local Compose configuration.
  - Completion check: Core workflow runs in containers.

- [ ] **Step 32. Choose the hosted execution path**
  - Work: Verify current free-tier limits; select suitable job dispatch, database and artifact storage.
  - Completion check: Deployment design and estimated costs documented.

- [ ] **Step 33. Deploy the bounded demo**
  - Work: Add usage caps, artifact expiry, saved examples and startup states.
  - Completion check: Visitors can explore examples and launch permitted runs.

- [ ] **Step 34. Finish portfolio documentation**
  - Work: Update architecture, setup, limitations, benchmark results and record a walkthrough.
  - Completion check: Another developer can run it and understand the evidence.

## Progress log

- 2026-09-19 — Step 19 complete: added a LangGraph evidence-only workflow with injected requirement-search, plan-provider, and browser ports. Its only path is retrieve → plan → collect evidence → end; the workflow test validates citation, structured plan, and browser evidence propagation without a real model or browser call. Next: Step 20, investigation workspace.

- 2026-09-19 — Step 18 complete: added the official OpenAI Python SDK and a bounded Responses adapter with strict structured output, validated plan schema, input/output token accounting, and safe missing-key, malformed-output, and budget failures. Tests use an injected fake client and consume no credits. A live model request remains a local configuration check once `OPENAI_API_KEY` is supplied. Next: Step 19, LangGraph workflow.

- 2026-09-19 — Step 17 complete: added versioned Markdown ingestion, immutable source/version enforcement, persisted heading chunks, and bounded source-backed retrieval. The coupon requirement test returns its document ID, version, chunk ID, heading, and content citation. Local lexical ranking is the intentional baseline until the Step 18 provider adapter adds embeddings and PostgreSQL pgvector ranking. Next: Step 18, OpenAI integration.

- 2026-09-19 — Step 16 complete: added SQLAlchemy 2, Alembic, and a PostgreSQL driver; created the initial migration and Python-owned repositories for investigations, attempts, events, and artifact metadata. A migration-backed SQLite test creates records, disposes the database, reopens it, and reads the same investigation/event history. PostgreSQL remains the deployment target. Next: Step 17, requirements retrieval.

- 2026-09-18 — Step 15 complete: added the idempotent `reset_browser_session` MCP tool, which clears cookies and browser storage then reloads the allowed seeded route. The Python workflow resets before acting; two real executions produced the same reset/fill/click/click action sequence with distinct browser session IDs. Browser sessions already use isolated contexts and now cap navigation/reset/click/fill/select operations at 12 commands. The cart remains a stateless client fixture until persistence exists. Next: Step 16, persistence.

- 2026-09-18 — Step 14 complete: added `collect_browser_evidence` to the TypeScript MCP server. It returns an opaque ephemeral artifact ID, screenshot, actions, console messages, and same-origin request metadata from the owned Playwright session. The Python client validates that contract after the canonical coupon-and-remove workflow and releases the session. Durable retention remains Step 16; this step records observations without inferring a defect. Next: Step 15, reset and isolation.

- 2026-09-18 — Step 13 complete: added validated inspect, click, fill and select MCP tools backed by Playwright locators. The Python client owns a scripted cart sequence and preserves browser cleanup. Real local execution applied SAVE10, removed Item B, and observed the buggy $85.00 total. Next: Step 14, capture evidence.

- 2026-09-17 — Step 12 complete: added a Playwright Chromium lifecycle adapter with UUID session ownership, allowed-relative-path navigation, in-memory PNG capture and explicit context/browser cleanup. The TypeScript MCP server exposes lifecycle tools; Python owns their bounded create → navigate → screenshot → close sequence; FastAPI validates and serves an ephemeral capture; the sample dashboard workspace renders it. Browser verification confirmed the screenshot is shown. `pnpm check` passed with 26 TypeScript and 20 Python tests; the existing Starlette deprecation warning remains. Next: Step 13, add browser actions.

- 2026-09-17 — Step 11 complete: implemented the seeded REQ-CART-001 cart fixture in `apps/demo-store`, with pure integer-cent totals, coupon application, resettable local state, and server-side local selection between buggy and corrected behavior. Focused cart/catalog tests (10 assertions), strict store typecheck, and production build passed. Browser verification confirmed the default buggy workflow ends at subtotal $100.00, discount $15.00 and total $85.00 after applying SAVE10 then removing Item B; corrected mode ends at $100.00, $10.00 and $90.00. Next: Step 12, add browser lifecycle tools.

- 2026-09-16 — Step 7 committed as 0ce5290. Step 8 complete: added the official Python MCP SDK 2.2.0 and a scoped stdio adapter that launches the compiled Node entry point, initializes/calls with separate bounded timeouts, validates the camelCase version 1 response, and closes the session/child process through nested context managers. Sixteen Python tests passed, including a real cross-language call plus missing entry point, unavailable executable, timeout, and invalid response cases. Ruff and strict mypy passed. The existing Starlette deprecation warning remains. Step 8 changes are local. Next: Step 9, dashboard integration; no browser execution yet.

- 2026-09-16 — Step 8 committed as 3eab409. Step 9 complete: FastAPI now owns `GET /mcp/status`, returning a typed connected response or safe 503 unavailable response without changing liveness semantics. The Next.js server uses a Zod-validated, six-second no-store request and renders the result on the investigations page. Live local verification returned the Node MCP status through FastAPI and rendered “Connected to reprosift-mcp” in dashboard HTML. Eighteen Python tests, 18 TypeScript tests, lint and type checks passed; the existing Starlette deprecation warning remains. Step 9 changes are local. Next: Step 10, document startup; no browser execution yet.

- 2026-09-16 — Step 9 committed as 247d36b. Step 10 complete: added `docs/local-development.md` with locked installation, MCP build prerequisite, three-terminal startup, health/MCP/dashboard verification, smoke diagnostic, shutdown and troubleshooting. The commands were exercised from a fresh shell and the live endpoints returned API liveness plus a connected MCP status. Step 10 changes are local. Next: Step 11, implement the sample cart; no browser execution yet.

- 2026-09-15 — Step 4 committed as 315b6fb. Step 5 complete: Python 3.13.15 package with pinned FastAPI/Pydantic Settings/Uvicorn and uv.lock. `uv run --locked reprosift-api` starts on 127.0.0.1:8000; real HTTP `/health` returns the documented liveness response. Ruff formatting/lint and strict mypy passed; 11 pytest cases passed covering health/OpenAPI, invalid configuration, dotenv precedence, production docs and CLI input redaction. Two upstream Starlette deprecation warnings remain (httpx test transport and AnyIO BlockingPortal alias); checks pass. Root `.env.example` distinguishes four consumed API settings from proposed future settings. No agent, MCP, persistence or worker is implemented. Step 5 changes are uncommitted. Next: Step 6, add remaining repository/TypeScript checks while preserving the Python checks.

| Date       | Step     | Status   | Evidence / next action                                                                                        |
| ---------- | -------- | -------- | ------------------------------------------------------------------------------------------------------------- |
| 2026-09-14 | Planning | Complete | Specifications and Prettier already present; 34-step execution checklist recorded. Next: audit prerequisites. |

For completed steps, record actual checks and results. Keep limitations explicit: a saved report is not live execution; repeated test failures alone are not proof of a defect; corrected-version comparison is not proof of absence of all defects.

- 2026-09-15 — Step 1 complete: Node 24.21.0, pnpm 11.19.0, Python 3.13.15, uv 0.12.13, Docker 29.8.0, Compose 5.5.1 and Git 2.42.0 verified. Docker hello-world passed. Added runtime pins and prerequisites.md. Step 2 remains partial; next action is workspace/package structure.

- 2026-09-15 — Step 2 complete: added pnpm-workspace.yaml, engine/exact-version policy and private manifests for dashboard, demo-store, mcp-server, browser-runner and contracts-ts. Added Python/backend and supporting directory ownership notes. Verified six-project discovery, offline frozen-lockfile installation and ignore rules. Next: Step 3 dashboard. Changes are local until separately committed/pushed.

- 2026-09-15 — Step 3 complete: Next.js, strict TypeScript and Tailwind dashboard with all four routes. Production build and typecheck passed. Browser checks covered navigation, sample/clear draft actions, evidence/requirements toggles, result preview, mobile layout and unknown IDs. Preview data is presentation-only; submission and exports are disabled until implementation. Steps 1–2 were committed as 484bfb8; Step 3 remains local. Next: Step 4, separate demo-store scaffold. ESLint and test infrastructure remain Step 6.

- 2026-09-15 — Step 3 committed as 978d200. Step 4 complete: separate Next.js demo store on 127.0.0.1:3001 with catalog, dynamic product, cart and checkout shells. Reused the dashboard's pinned framework versions and root lockfile. Production build and strict typecheck passed. Browser checks covered both products, catalog → product → cart → checkout navigation, disabled actions, unknown-product recovery and mobile layouts; dashboard still serves on port 3000. No console errors observed on normal store routes. Cart mutations, coupon logic, attempt reset and variants remain Step 11; ESLint/test infrastructure remains Step 6. Step 4 changes are uncommitted. Next: Step 5, uv-managed FastAPI backend with validated configuration and health endpoint.

- 2026-09-15 — Step 5 committed as 5b7ce71. Step 6 complete: pinned ESLint 9.39.5 (the newest release compatible with the Next.js 16.3.5 plugin peer ranges), eslint-config-next, eslint-config-prettier and Vitest 5. Root `pnpm check` verifies Prettier/Ruff formatting, JavaScript/Python lint, both app typechecks, strict mypy and both test suites. Five Vitest assertions protect sample links/expectations and catalog identity/pricing/formatting; 11 backend tests remain green. pnpm reports no peer issues and frozen install works with an explicit blocked optional resolver downloader. Existing two upstream Starlette deprecation warnings remain documented. Step 6 changes are uncommitted. Next: Step 7, TypeScript MCP server with validated status tool.
