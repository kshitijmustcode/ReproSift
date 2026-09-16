# ReproSift

AI-powered UI bug reproduction using Python, TypeScript and MCP. Turn bug reports into evidence-backed Playwright tests and verify fixes through isolated replay.

Repository: [kshitijmustcode/ReproSift](https://github.com/kshitijmustcode/ReproSift).

> Project planning and continuity document. Dashboard, demo-store page shells and API health endpoint run locally; investigation execution is still planned.

Last updated: 2026-09-16

## Product goal

Turn a natural-language UI bug report into an evidence-backed, replayable Playwright regression test. Evaluate the generated test through fresh-session replay and, where available, comparison against a corrected application version.

Expose browser investigation and verification capabilities through an MCP server so our dashboard and compatible coding assistants can use them. Automatic source-code fixes are outside the initial scope.

## User context and agreed direction

- Owner knows JavaScript, TypeScript, Java, and Python.
- Portfolio target: software engineering roles at approximately five years of experience in 2027.
- The project must be standalone, easy to demonstrate, and have a natural use for MCP, RAG, LLMs, and agents.
- OpenAI API credit is available; the exact budget is unspecified.
- Prefer free or near-zero-cost deployment for occasional demo visitors.
- AI may accelerate implementation, while the owner reviews, understands, tests, and owns design decisions.
- Selected stack: Python for API, agent orchestration, RAG, persistence and evaluation; TypeScript (JavaScript ecosystem) for the frontend, browser MCP server and generated Playwright tests. Java is not required.
- This document records the current proposed plan, not completed work or measured achievements.

## Positioning

Promise: **Bug report → reproducible test → fix verification.**

Our specialization is reproducible verification with controlled state, meaningful assertions, and inspectable evidence. MCP makes this a capability that other coding agents can consume rather than a replacement for them.

Do not claim that Claude, Cursor, or commercial bug bots cannot do this. No competitor feature comparison has been validated. Do not claim complete uniqueness, production readiness, guaranteed hiring outcomes, deterministic AI, or elimination of flakiness.

## Two-week MVP scope

- One controlled shopping application with five planted bugs and corresponding corrected versions.
- Chromium only, one investigation at a time initially.
- Natural-language report and explicit expected behavior.
- Sample investigations that require no user setup or external credentials.
- Agent investigation through our own MCP server.
- Requirements retrieval with source references.
- Structured action recording and template-based Playwright test generation.
- Screenshots, console events, relevant network metadata, traces, and downloadable test artifacts.
- Independent replay against reset state; comparison against corrected versions when available.
- Persisted run status, progress UI, cancellation, bounded execution, and evaluation results.

### Out of scope

- Automatic code patches, PRs, and repository integration.
- Arbitrary websites, real customer accounts, and production credentials.
- Multiple browsers, parallel investigating agents, and visual coordinate-based computer use.
- Live interactive browser streaming: screenshots and events are sufficient.
- PDF/OCR ingestion: begin with Markdown and plain text requirements.
- Automatic continuation of a browser session after a worker crash.
- Raw CDP integration and Redux instrumentation unless a concrete requirement justifies them.

## User journey

1. Open the dashboard and choose a sample bug or create an investigation.
2. Provide the report and expected behavior; choose an allowed demo scenario.
3. Watch browser screenshots, action events, retrieved requirements, and progress.
4. Review the result, its limitations, and source-backed evidence.
5. Replay and download the generated test.
6. Run the same test against the corrected demo application and compare outcomes.

Example: apply a coupon, remove an item, and observe a stale discount. The report includes the pricing requirement, recorded steps, expected/actual values, screenshot, and matching assertion failure.

## UI: four product pages and four demo-store routes

| Page                    | Route                         | Content                                                                 |
| ----------------------- | ----------------------------- | ----------------------------------------------------------------------- |
| Investigations          | `/`                           | Run history, status, sample shortcuts, new-run action                   |
| New investigation       | `/investigations/new`         | Report, expected behavior, scenario, optional requirement upload        |
| Investigation workspace | `/investigations/[id]`        | Event timeline, latest screenshot, evidence, requirements, cancellation |
| Result and replay       | `/investigations/[id]/result` | Outcome, steps, assertion, evidence, test code, replay, downloads       |

Use Timeline / Evidence / Requirements tabs within the workspace. Use a settings drawer for execution configuration. Separate settings, analytics, and document-management pages are unnecessary initially.

The separate demo store has catalog, product-detail, cart, and checkout routes. Keep its state/reset mechanisms independent of the dashboard.

## Technology choices

The user selected a Python + TypeScript architecture. TypeScript remains the typed language for JavaScript components.

| Layer                      | Selected direction                                   | Responsibility                                                                |
| -------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------- |
| Dashboard and demo store   | Next.js + React + TypeScript                         | Separate web apps; Tailwind CSS + shadcn/ui                                   |
| API                        | Python + FastAPI                                     | Authentication, run creation, status/events, cancellation and artifact access |
| Agent worker               | Python + LangGraph                                   | Investigation state machine and bounded reasoning loop                        |
| LLM                        | OpenAI Python integration through a provider adapter | Use existing API credit; select model through evaluation                      |
| Browser MCP server         | Official TypeScript MCP SDK + Node.js                | Expose scoped browser actions and replay capabilities                         |
| MCP client                 | Python MCP SDK / langchain-mcp-adapters              | Python worker consumes TypeScript tools; verify compatible pinned versions    |
| Browser and test execution | Playwright + Chromium, TypeScript                    | Interaction, evidence, template-based test generation and replay              |
| RAG                        | Python ingestion/retrieval + PostgreSQL/pgvector     | Versioned requirements with citations; embedding calls through OpenAI         |
| Persistence                | Python SQLAlchemy + Alembic                          | Backend owns domain database operations and migrations                        |
| Validation                 | Pydantic in Python; Zod in TypeScript                | Validate at both ends of each trust boundary                                  |
| Local durable dispatch     | Celery + Redis, introduced on day 9                  | Python job delivery; one active investigation initially                       |
| Hosted dispatch            | Managed job/task adapter when needed                 | Avoid always-on Redis costs; select one deployed dispatch backend             |
| Artifacts                  | Local disk, then object storage                      | TypeScript produces evidence; Python controls metadata/access                 |
| Python tooling             | uv + Ruff + mypy + pytest                            | Locked dependencies, formatting/linting, type checks and behavior tests       |
| JavaScript tooling         | pnpm + Prettier + ESLint + TypeScript + Vitest       | One root command validates both applications                                  |
| Local infrastructure       | Docker Compose                                       | Reproducible API, worker, MCP browser service, database and optional queue    |

Prettier and both Next.js applications (React, TypeScript, Tailwind CSS and Lucide icons) are installed. Both apps use the same pinned framework versions and root lockfile. The Python package includes FastAPI, Pydantic Settings, the official MCP SDK, Uvicorn and Ruff/mypy/pytest checks, with its own uv.lock. The TypeScript MCP package uses the official SDK v2 and Zod for a status tool over stdio. The Python adapter launches that compiled local process per status request, validates the versioned response, and closes the session and child process. Agent, database and browser execution remain planned.

FastMCP is unnecessary for this browser server because Playwright capabilities live in TypeScript. The Python orchestrator is an MCP client. Add a Python MCP server only if a distinct Python capability needs external exposure. Keep OpenAI as the initial provider; this language change does not require Claude or a computer-use API.

## Architecture

```text
Next.js dashboard (TypeScript)
          │ HTTP + SSE / polling
          ▼
FastAPI (Python) → PostgreSQL + job dispatch
                         │
                         ▼
                Python investigation worker
                ├── LangGraph + OpenAI
                ├── Python requirement retrieval
                └── MCP client
                         │ MCP
                         ▼
                TypeScript browser MCP server
                ├── Playwright sessions/actions
                ├── screenshots, console/network evidence
                └── structured test generation + replay

Python verification policy classifies structured replay evidence.
Artifact storage retains screenshots, traces and exported tests.
```

The model proposes actions; application services validate authority and the TypeScript server validates execution. Next.js is not a second business API. FastAPI owns run lifecycle and dispatch; browser work does not continue as an unmanaged background task after returning a response.

Requirement retrieval is a Python agent tool. Browser capabilities are MCP tools. There is no need to route every internal function through MCP.

Use persistent explicit MCP sessions or explicit browser session IDs with server-side ownership and lifecycle. Do not assume an adapter retains browser state across independent calls. Start with local stdio when the Python worker owns the child process; use authenticated Streamable HTTP for separately deployed services. Container execution must not require privileged Docker-in-Docker.

Python owns database migrations and application records. TypeScript returns structured observations and artifact references rather than independently editing investigation tables. One verification policy lives in Python; TypeScript executes assertions and reports raw outcomes, not a duplicate policy.

### Repository layout (workspace placeholders created)

```text
apps/
  dashboard/             # Next.js + TypeScript
  demo-store/            # Next.js + TypeScript
services/
  backend/               # one Python package with separate API/worker entry points
    pyproject.toml
    uv.lock
    src/reprosift/           # API factory, settings, health route and CLI
      api/
      agent/
      domain/
      verification/
      retrieval/
      infrastructure/
    tests/
packages/
  mcp-server/            # TypeScript + Playwright
  browser-runner/        # action execution, test generation and replay
  contracts-ts/          # boundary schemas/types
contracts/               # exported schema snapshots and shared JSON examples
fixtures/                # approved public requirements and seed definitions
evals/                   # Python harness; private labels excluded from agent runtime
docs/
infra/
```

### Cross-language contracts

FastAPI/Pydantic owns public API and run-event schemas; publish OpenAPI/JSON Schema and derive TypeScript client types where practical. TypeScript/Zod owns MCP action and replay-tool schemas exposed through MCP. Python validates received tool results against their published contract. Use versioned JSON examples and contract tests in both languages; do not maintain divergent handwritten shapes.

Use camelCase on the wire and idiomatic snake_case internally in Python via explicit aliases. UUID/string IDs, ISO UTC timestamps and integer cents retain identical semantics across runtimes. Async Python adapters must not block the event loop; blocking operations need deliberate isolation.

## MCP surface

Start with a small set of bounded tools; names below are proposed contracts, not implemented APIs.

| Tool                  | Responsibility                                                                |
| --------------------- | ----------------------------------------------------------------------------- |
| `start_session`       | Create a scoped session for an allowed scenario                               |
| `inspect_page`        | Return current URL, relevant page structure, and observations                 |
| `perform_action`      | Execute a validated action such as click, fill, or select                     |
| `capture_screenshot`  | Save a screenshot and return its artifact reference                           |
| `get_network_events`  | Retrieve bounded, redacted request/response evidence                          |
| `get_console_events`  | Retrieve relevant console errors and warnings                                 |
| `search_requirements` | Python agent-local retrieval tool, not part of the initial browser MCP server |
| `replay_steps`        | Run recorded steps and assertions from reset state                            |
| `get_artifact`        | Access an artifact after ownership checks                                     |
| `close_session`       | Release browser resources                                                     |

Later, offer higher-level tools such as `reproduce_bug`, `verify_fix`, and `get_evidence`. Avoid designing these to recursively call the same agent workflow without clear ownership and limits.

## Agent and persistence design

Graph: understand report → retrieve requirements → observe → choose action → execute → evaluate → continue or generate test → independent replay → report.

Persist explicit outcomes such as queued, running, replaying, completed, failed, cancelled, and interrupted. Store events with sequence numbers so the UI can reconnect without losing progress.

Suggested entities: Investigation, RunAttempt, RunEvent, BrowserSession, RequirementDocument, RequirementChunk, Reproduction, Assertion, ReplayResult, Artifact.

Separate immutable candidate test versions from replay results. If the agent revises a candidate, retain prior evidence and version the change. Do not silently overwrite an assertion to obtain a passing result.

After a worker crash, release resources and restart an attempt from clean seeded state. Do not blindly retry non-idempotent browser actions. Job delivery and tool execution may repeat: make lifecycle operations idempotent and explicitly track attempts.

## RAG design

- Index authored acceptance criteria and product requirements, not every browser event or spreadsheet-like row.
- Store source ID, scenario, document version, and chunk references.
- Apply scenario/permission filters before or during retrieval.
- Embed only changed documents.
- Require findings to reference the requirement establishing expected behavior.
- Keep bug implementation details, corrected-code diffs, and answer labels inaccessible to the investigating agent.
- Treat retrieved text as evidence, never as authority to override execution rules.

## Reproduction and verification rules

Generate a validated action/assertion representation and translate it into Playwright TypeScript using controlled templates. Initial assertions cover text, totals, counts, and visibility. Avoid unrestricted generated code execution.

**Three failures do not prove a bug. Three consistent runs do not prove determinism.**

A valid reproduction must reach the intended state and fail at the relevant assertion, with expected behavior grounded in the report/requirements. Selector failures, authentication failures, browser crashes, and unrelated timeouts are execution failures rather than matching reproductions.

Report separately:

- Matching defect observed.
- Expected behavior observed / defect not reproduced under tested conditions.
- Execution failure.
- Inconclusive or inconsistent observations.

Repeat candidate tests from clean state as an initial consistency check. Mixed outcomes may be caused by intermittent application behavior, data, infrastructure, or test logic; preserve evidence rather than automatically weakening/rephrasing assertions.

For the controlled demo, check the same test against buggy and corrected variants. A strong result fails at the intended assertion on the buggy variant and passes on the corrected variant. This supports validity but does not prove the fix has no other defects.

Use Playwright auto-waiting and web-first assertions. Avoid arbitrary sleeps. Reset backend data as well as creating a fresh browser context; fresh browser state alone is insufficient.

## Demo scenarios

1. Coupon discount remains stale after quantity changes.
2. Removing an item does not update the total.
3. Cart badge does not reflect quantity changes.
4. Free shipping uses the wrong threshold.
5. Checkout accepts a missing required field.

Each scenario needs seed data, an explicit acceptance criterion, a buggy variant, a corrected variant, a manual reproduction, and negative/no-bug cases. Reset endpoints must be restricted to test infrastructure.

## Two-week execution plan

Assumption: approximately 4–6 focused hours per day. This is a target, not a guarantee. Protect the day-7 vertical slice if schedule slips.

| Day | Work                                                                          | Acceptance milestone                                        |
| --- | ----------------------------------------------------------------------------- | ----------------------------------------------------------- |
| 1   | pnpm + uv workspaces, app skeletons, cross-language contracts, local services | One documented command starts the foundation                |
| 2   | Demo store, seed/reset, five bug scenarios                                    | Every bug reproducible manually from clean state            |
| 3   | Browser MCP tools and basic constraints                                       | MCP client completes a shopping flow and captures evidence  |
| 4   | Agent graph, validation, time/tool limits                                     | One sample bug investigated with observations               |
| 5   | Persisted events, workspace UI, cancellation                                  | User submits a report and watches progress                  |
| 6   | Requirements ingestion and retrieval                                          | Finding cites the applicable requirement                    |
| 7   | Structured steps, assertion schema, test generator                            | One complete investigation yields a replayable test         |
| 8   | Independent replay and corrected-version comparison                           | Outcome classification and evidence visible                 |
| 9   | Python Celery dispatch, recovery, concurrency limits                          | Refresh preserves runs; worker failure has defined handling |
| 10  | Container/network/resource constraints and budgets                            | Jobs terminate predictably and stay within allowed targets  |
| 11  | Held-out reports, no-bug cases, evaluation runner                             | Repeatable benchmark output exists                          |
| 12  | Fix observed weaknesses and focused regressions                               | Re-run the same benchmark and document changes              |
| 13  | Hosted deployment, artifact lifecycle, UI polish                              | Public sample demo with bounded usage, if hosting is viable |
| 14  | Clean setup check, README, diagram, results, video                            | Shareable portfolio package with honest limitations         |

If live deployment cannot be completed within budget/time, clearly mark it incomplete and ship a local reproducible demo plus a recorded walkthrough and saved results. Do not describe saved results as live execution.

## Evaluation and success criteria

Prepare held-out report paraphrases and no-bug cases. Do not tune solely on those cases. Record the number of scenarios and attempts behind every metric.

Measure matching reproduction rate, false-positive rate on no-bug cases, assertion validity, replay consistency, execution failures, wall-clock latency, token usage, and estimated model cost per investigation.

Compare the investigation agent with a simpler fixed workflow where practical. Agent-written tests and expectations can share the same mistake: manually author the acceptance criteria and inspect representative outputs.

Completion checklist:

- [ ] Visitor can start a sample without configuring a target system.
- [ ] Agent uses our MCP server to interact with the demo store.
- [ ] Findings contain requirement references and browser evidence.
- [ ] Exported tests run from documented clean state.
- [ ] Buggy/corrected comparison is available for demo scenarios.
- [ ] Timeouts, cancellation, ownership checks, and resource cleanup work.
- [ ] Benchmark includes failures and no-bug cases.
- [ ] External compatible MCP client can exercise tools independently of our UI.
- [ ] Setup instructions, limitations, and demo video exist.

## Cost and hosting strategy

Local development requires no additional service fees beyond model/embedding API usage, assuming existing hardware and eligible personal tooling licenses. No paid MCP platform, vector database service, managed browser, or custom domain is required.

For occasional public usage, target a free-tier dashboard/database and a browser worker that scales to zero. Cloud Run or an equivalent managed container platform is a candidate, not a selected deployment. Verify current free allowances, regions, billing requirements, timeouts, and browser compatibility before committing.

Avoid an always-on Redis dependency on the hosted path if that creates a fixed bill; select one managed dispatch mechanism and adapt the worker to it. Long-running browser work must be owned by a managed job/task or an appropriately configured execution request; do not assume background work continues after an HTTP response.

Target near-zero infrastructure cost, not guaranteed zero cost. Container builds/registry, artifacts, networking, database, and model calls may incur charges. Billing alerts are not hard spending caps.

Initial proposed controls: one active investigation, five new public investigations per day globally, 3–5 minute run deadline, bounded model tokens/tool calls, cached document embeddings, artifact expiry, and saved examples that require no new AI calls. Tune caps after measuring real runs.

Docker does not prevent remote side effects. Restrict destinations and credentials; never use real customer accounts for the demo. Keep keys server-side, redact sensitive telemetry, and avoid privileged container execution.

## AI-assisted implementation workflow

1. Define a small behavior and its failure cases.
2. Ask AI for a bounded implementation.
3. Review the diff and explain unknown code before accepting it.
4. Run the feature and meaningful failure checks.
5. Commit a working increment and record consequential decisions.

The owner should be able to trace model action → MCP validation → browser execution; explain crash/retry behavior; and distinguish a genuine reproduced defect from a broken test. Do not generate the whole repository as an unreviewed batch.

## Engineering standards: clean code, OOP, and SOLID

All implementation must follow the repository's [AGENTS.md](AGENTS.md). This is the durable coding instruction entry point for future agent sessions.

Use Python and TypeScript classes where they clarify state, resource lifecycle, and injected dependencies; use pure functions for domain calculations and transformations, and function components for React. Prefer composition over inheritance. Apply SOLID through cohesive responsibilities, small capability contracts, substitutable implementations, and explicit dependency injection.

Keep UI and MCP transport handlers thin. Separate domain rules and application workflows from Playwright, OpenAI, database, queue, and storage adapters. Use patterns only when a concrete boundary or variation warrants them. Avoid speculative abstractions, global mutable services, and one-class-per-operation boilerplate.

Require strict typing, runtime validation at trust boundaries, explicit state/outcome models, cancellation and cleanup, structured redacted logs, meaningful behavior tests, and format/lint/type-check checks. Generated code must be reviewed and verified; these conventions do not guarantee correctness automatically.

## Project specifications and tooling

**Implementation checklist:** [34-step execution plan](docs/execution-plan.md). Track completed steps and evidence there. Steps 1–9 are complete. Next: Step 10, document startup.

Read these before implementing the relevant feature:

- [Workspace structure](docs/workspace.md): package ownership, discovery and install commands.
- [Prerequisite audit and runtime selection](docs/prerequisites.md): verified tools, runtime pins and setup commands.

- [Complete sample case](docs/sample-case.md): exact seed, actions, requirements and expected values.
- [Verification rules](docs/verification-rules.md): outcome decision table and replay policy.
- [Core contracts](docs/contracts.md): proposed states, actions, events, assertions and artifacts.
- [Evaluation plan](docs/evaluation-plan.md): five fixture specifications, controls, metrics and held-out isolation.
- [Definition of done](docs/definition-of-done.md): milestone gates and change acceptance.
- [Configuration template](.env.example): implemented API settings followed by proposed future execution settings.

Executable schemas and fixtures will become the source of truth when implemented. These documents must then link to them and explain semantics. Never include harness answer labels in the agent's retrieval corpus.

### Development checks

Install both locked environments, then run every formatting, lint, type and behavior check from the repository root:

```sh
pnpm install --frozen-lockfile
uv sync --project services/backend --locked
pnpm check
```

`pnpm check` runs Prettier and Ruff format verification, ESLint with Next.js Core Web Vitals and TypeScript rules, Ruff lint, strict TypeScript and mypy checks, Vitest, and pytest. Use `pnpm format` to format both language stacks. Focused root commands are `pnpm format:check`, `pnpm lint`, `pnpm typecheck` and `pnpm test`; language-specific variants use `:js` and `:python` suffixes. Generated output, dependencies and environment files stay excluded. ESLint and Prettier are configured to avoid competing formatting rules.

### Local startup

Follow the [local development guide](docs/local-development.md) for a fresh-terminal setup, service startup order, endpoint checks, MCP smoke diagnostic, shutdown, and common failures. It documents the implemented dashboard → FastAPI → Python MCP client → TypeScript status-tool path; no credentials, model calls, or browser execution are needed.

## Next-session starting instructions

Read this README first, inspect existing files and repository status, and preserve user changes. Check for applicable AGENTS.md instructions. Update this document when scope or architecture changes.

The dashboard and demo store each have four runnable page shells. Follow the [local development guide](docs/local-development.md) to start them with FastAPI and verify the dashboard MCP connection card. `pnpm test:python` builds the server and verifies the real Python-to-TypeScript status call. See [MCP setup](packages/mcp-server/README.md) and [backend setup](services/backend/README.md). Browser-runner and contracts-ts remain placeholders. Run `pnpm check` before accepting changes. Sample previews do not execute or persist investigations; store cart actions and ordering are disabled. Next: Step 11, implement the sample cart.

Before installing dependencies, verify current stable compatible versions and official OpenAI/API documentation. Do not infer permission to buy services, expose unrestricted browser execution, or send messages/create external PRs from this planning document.

## Reference documentation

- MCP TypeScript SDK: https://ts.sdk.modelcontextprotocol.io/v2/
- LangGraph Python: https://docs.langchain.com/oss/python/langgraph/overview
- Python MCP integration: https://docs.langchain.com/oss/python/langchain/mcp
- FastAPI: https://fastapi.tiangolo.com/
- uv: https://docs.astral.sh/uv/
- Ruff: https://docs.astral.sh/ruff/
- Playwright auto-waiting: https://playwright.dev/docs/actionability
- Playwright network APIs: https://playwright.dev/docs/network
- Playwright retries: https://playwright.dev/docs/test-retries
- Playwright traces: https://playwright.dev/docs/trace-viewer
- Playwright Docker: https://playwright.dev/docs/docker
- OpenAI function calling: https://developers.openai.com/api/docs/guides/function-calling
- Cloud Run pricing: https://cloud.google.com/run/pricing

## Progress log

- 2026-09-14: Planning README created from the discussion. No application code, deployment, or benchmark results yet.

- 2026-09-14: Added clean-code and SOLID standards, with detailed persistent coding instructions in AGENTS.md.

- 2026-09-14: Added five pre-coding specifications, configuration placeholders, and local formatting tooling.

- 2026-09-14: User selected Python + TypeScript; revised architecture, service ownership, cross-language contracts, tooling and dispatch plan. Python setup remains pending.

- 2026-09-14: Saved the agreed 34-step execution checklist with progress tracking and phase acceptance checks.

- 2026-09-15: Completed the prerequisite audit, pinned Node/Python, verified Docker execution and recorded Step 2 as partially complete.

- 2026-09-15: Completed Step 2 workspace setup and discovery checks. Runnable applications and Python initialization remain pending.
