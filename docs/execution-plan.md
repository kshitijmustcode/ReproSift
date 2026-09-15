# Execution checklist

Last updated: 2026-09-15.

## Current status

Planning documents, coding standards and pinned Prettier tooling are complete. Workspace setup is complete. Steps 1–4 are complete. Dashboard and demo-store page shells run locally on separate ports; Steps 5–34 remain pending.

**Next action: Step 5 — create the Python backend.** See [prerequisite audit](prerequisites.md) for verified versions and startup instructions. The first milestone is dashboard → FastAPI → Python MCP client → TypeScript MCP status tool. No LLM calls are needed for that milestone.

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

- [ ] **Step 5. Create the Python backend**
  - Work: Initialize a uv-managed Python package with FastAPI, validated configuration and a health endpoint.
  - Completion check: Backend starts; valid and invalid configuration behave correctly.

- [ ] **Step 6. Configure development checks**
  - Work: Add TypeScript checks, ESLint, Ruff, mypy, pytest and basic test configuration. Retain Prettier.
  - Completion check: Formatting, linting, type checks and starter tests pass.

- [ ] **Step 7. Create the MCP server**
  - Work: Initialize the TypeScript MCP server with a small status tool and validated output.
  - Completion check: An MCP client can discover and call the tool.

- [ ] **Step 8. Connect Python to MCP**
  - Work: Add a Python MCP client adapter with explicit session ownership and cleanup.
  - Completion check: Python calls the TypeScript tool and handles connection failure.

- [ ] **Step 9. Connect the dashboard to FastAPI**
  - Work: Add a typed API client and connection-status display.
  - Completion check: Dashboard displays MCP status obtained through Python.

- [ ] **Step 10. Document startup**
  - Work: Add development commands and update setup instructions.
  - Completion check: Instructions work from a fresh terminal.

## Phase 2 — Build one browser workflow

- [ ] **Step 11. Implement the sample cart**
  - Work: Build the documented coupon scenario with seeded data and buggy/corrected variants.
  - Completion check: Manual reproduction gives the specified totals.

- [ ] **Step 12. Add browser lifecycle tools**
  - Work: Implement scoped session creation, allowed navigation, screenshots and cleanup.
  - Completion check: Python requests a screenshot through MCP and the UI displays it.

- [ ] **Step 13. Add browser actions**
  - Work: Implement page inspection, click, fill and select with runtime validation.
  - Completion check: A scripted sequence applies the coupon and removes an item.

- [ ] **Step 14. Capture evidence**
  - Work: Record action results, console/network events, screenshots and artifact references.
  - Completion check: Sample workflow produces inspectable evidence.

- [ ] **Step 15. Add reset and isolation**
  - Work: Reset backend and browser state; enforce allowed targets and execution limits.
  - Completion check: Repeated runs start identically and release resources.

## Phase 3 — Add investigation intelligence

- [ ] **Step 16. Add persistence**
  - Work: Set up PostgreSQL, migrations, investigations, attempts, events and artifact metadata.
  - Completion check: Run history survives service restarts.

- [ ] **Step 17. Implement requirements retrieval**
  - Work: Add Markdown/text ingestion, embeddings, pgvector search and source references.
  - Completion check: Coupon requirement is retrieved with its version and citation.

- [ ] **Step 18. Add OpenAI integration**
  - Work: Implement the model adapter, structured outputs, usage recording and budgets.
  - Completion check: One bounded model request succeeds and failures are reported clearly.

- [ ] **Step 19. Build the LangGraph workflow**
  - Work: Connect requirement retrieval, browser observation, action selection and stopping rules.
  - Completion check: Agent investigates the sample report without a hardcoded action sequence.

- [ ] **Step 20. Build the investigation workspace**
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

| Date       | Step     | Status   | Evidence / next action                                                                                        |
| ---------- | -------- | -------- | ------------------------------------------------------------------------------------------------------------- |
| 2026-09-14 | Planning | Complete | Specifications and Prettier already present; 34-step execution checklist recorded. Next: audit prerequisites. |

For completed steps, record actual checks and results. Keep limitations explicit: a saved report is not live execution; repeated test failures alone are not proof of a defect; corrected-version comparison is not proof of absence of all defects.

- 2026-09-15 — Step 1 complete: Node 24.21.0, pnpm 11.19.0, Python 3.13.15, uv 0.12.13, Docker 29.8.0, Compose 5.5.1 and Git 2.42.0 verified. Docker hello-world passed. Added runtime pins and prerequisites.md. Step 2 remains partial; next action is workspace/package structure.

- 2026-09-15 — Step 2 complete: added pnpm-workspace.yaml, engine/exact-version policy and private manifests for dashboard, demo-store, mcp-server, browser-runner and contracts-ts. Added Python/backend and supporting directory ownership notes. Verified six-project discovery, offline frozen-lockfile installation and ignore rules. Next: Step 3 dashboard. Changes are local until separately committed/pushed.

- 2026-09-15 — Step 3 complete: Next.js, strict TypeScript and Tailwind dashboard with all four routes. Production build and typecheck passed. Browser checks covered navigation, sample/clear draft actions, evidence/requirements toggles, result preview, mobile layout and unknown IDs. Preview data is presentation-only; submission and exports are disabled until implementation. Steps 1–2 were committed as 484bfb8; Step 3 remains local. Next: Step 4, separate demo-store scaffold. ESLint and test infrastructure remain Step 6.

- 2026-09-15 — Step 3 committed as 978d200. Step 4 complete: separate Next.js demo store on 127.0.0.1:3001 with catalog, dynamic product, cart and checkout shells. Reused the dashboard's pinned framework versions and root lockfile. Production build and strict typecheck passed. Browser checks covered both products, catalog → product → cart → checkout navigation, disabled actions, unknown-product recovery and mobile layouts; dashboard still serves on port 3000. No console errors observed on normal store routes. Cart mutations, coupon logic, attempt reset and variants remain Step 11; ESLint/test infrastructure remains Step 6. Step 4 changes are uncommitted. Next: Step 5, uv-managed FastAPI backend with validated configuration and health endpoint.
