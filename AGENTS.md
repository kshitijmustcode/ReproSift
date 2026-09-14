# Engineering instructions for ReproSift

Read README.md for product scope, architecture, verification rules, and milestones before implementing. These instructions apply to all code in this project. Preserve existing user changes and keep planning documents aligned with consequential decisions.

## Clean code and SOLID

- Write cohesive modules with clear responsibilities. Separate UI, transport/MCP handlers, application workflows, domain rules, and infrastructure integrations.
- Use classes for components that own resources, lifecycle, state, or injected dependencies (for example browser sessions and persistence adapters). Use pure functions for transformations, calculations, assertion classification, and validation. Use React function components and focused hooks. Do not force every operation into a class.
- Prefer composition over inheritance. Avoid deep hierarchies, global mutable state, service locators, and giant manager/service classes.
- Single responsibility: each module or class should have a coherent reason to change. MCP handlers validate and delegate; they should not contain browser orchestration, database queries, and verification policy together.
- Open/closed: put genuinely variable external capabilities behind small contracts, such as model access, browser execution, storage, and job dispatch. Add implementations without editing unrelated business rules. Do not invent extension points for hypothetical features.
- Liskov substitution: implementations must preserve their contract's behavior, failure semantics, and lifecycle guarantees. An adapter must not silently weaken a requirement or omit supported behavior.
- Interface segregation: define small consumer-oriented interfaces rather than universal repositories or tool interfaces with unused methods.
- Dependency inversion: application/domain logic depends on capability contracts, not SDK clients, framework objects, or concrete databases. Inject implementations at the application entry point using explicit constructor/function parameters. A DI container is unnecessary initially.

## Boundaries and patterns

Use a lightweight ports-and-adapters structure. Keep dependencies directed toward domain/application contracts; infrastructure implements those contracts. Do not create multiple layers of forwarding code without a clear purpose.

Patterns to use when justified:

- Adapter for OpenAI, Playwright, persistence, artifacts, and queue integrations.
- Explicit state machine / LangGraph for investigation transitions and terminal outcomes.
- Structured command records for browser actions, with validated inputs and recorded results; a class per action is unnecessary.
- Strategy for actual alternative verification policies/providers, not hypothetical variants.
- Repository for domain persistence operations where it clarifies the boundary; avoid generic CRUD abstractions that merely wrap the ORM.
- Factory for resource construction when configuration or lifecycle requires it; simple constructors/functions are the default.

Example separation: an investigation use case receives a browser capability, requirement search, event sink, and storage dependency. MCP wraps the relevant use cases. Playwright-specific types stay inside the browser adapter. Requirement-backed assertion classification stays independently testable.

Do not add patterns to increase class counts or resume keywords. Add a brief decision note when introducing a significant abstraction or dependency.

## Python, TypeScript and contracts

- Enable strict TypeScript and avoid unjustified any, unsafe casts, and non-null assertions. Validate unknown external input before narrowing it.
- Use Zod or equivalent runtime schemas at model, MCP, HTTP, configuration, and persisted-version boundaries. Share stable contract schemas without creating a miscellaneous shared dumping ground.
- Represent states and outcomes with discriminated unions and exhaustive handling. Keep execution failure distinct from a reproduced defect.
- Use descriptive names, focused functions, explicit return contracts where helpful, immutable data by default, and explicit units for durations/costs.
- Keep dependencies acyclic. Domain code must not import Next.js, Playwright, OpenAI SDK, or ORM runtime objects.
- Pin compatible dependencies and commit the package-manager lockfile. Keep secrets out of source and logs.

## Reliability and observability

- Give async work an owner, deadline, cancellation path, and cleanup. Release browser resources in finally blocks or equivalent lifecycle management.
- Do not blindly retry non-idempotent actions. Use attempt IDs and idempotent lifecycle operations where appropriate; preserve original evidence.
- Return typed, actionable errors. Never swallow exceptions or convert infrastructure failures into successful investigations.
- Use structured logs with investigation/attempt IDs. Redact credentials and sensitive network payloads.
- Enforce trusted session ownership, destination allowlists, and budgets inside the server, regardless of model instructions.
- Keep SDK/API keys and authority checks on the server. Validate configuration at startup.

## Testing and review

- Use pure unit tests for consequential domain rules, focused adapter integration tests, and end-to-end tests for core user workflows. Mock external boundaries rather than internal implementation details.
- For verification changes, test matching defects, incorrect assertions, execution failures, mixed outcomes, and corrected variants. Author expected behavior independently of generated candidate tests.
- Cover meaningful cancellation, cleanup, ownership, and retry failure paths. Avoid tests that simply duplicate the implementation or assert private call sequences.
- Format, lint, type-check, and run tests appropriate to each change. Configure these checks in CI once scaffolding exists. Report checks that were not run and why.
- Keep changes small and reviewable. Remove obsolete code rather than retaining competing implementations. Comments should explain intent or constraints, not narrate syntax.
- Before accepting a change, check responsibility boundaries, runtime validation, lifecycle/cleanup, error semantics, and test evidence. Avoid arbitrary file-length, class-count, or coverage targets that encourage ceremony.

These are enforceable project conventions and review criteria, not a claim that generated code is automatically correct. The owner should be able to explain and modify every critical path.

## Required context and formatting workflow

Before coding a feature, read docs/sample-case.md, docs/verification-rules.md and the relevant sections of docs/contracts.md and docs/definition-of-done.md. Read docs/evaluation-plan.md before implementing fixtures or evaluation. Treat these as specifications until executable schemas and fixtures replace their structural details; update links and preserve the documented semantics.

Use the pinned local Prettier through `pnpm format` and verify with `pnpm format:check` for changes to supported source/configuration/documentation files. Do not change formatting conventions casually or hand-format generated lockfiles. Prettier does not replace linting, type checks or behavior tests. Keep .env.example aligned with actual validated configuration once implemented, and never put credentials in it.

## Selected hybrid stack and ownership

Follow the selected Python + TypeScript stack in README.md. Python owns FastAPI, LangGraph, OpenAI calls, RAG, persistence/migrations, investigation lifecycle, verification policy and the evaluation harness. TypeScript owns Next.js, the browser MCP server, Playwright execution and test generation. The Python agent is the MCP client; do not introduce a redundant FastMCP server or switch the agent back to TypeScript without a concrete agreed architecture change.

- Use typed Python functions, small dataclasses/domain models and consumer-oriented Protocols for dependency boundaries. Pydantic validates external data; avoid unchecked dictionaries, broad Any and bare exception handlers. Keep domain logic independent of FastAPI and SDKs.
- Keep async operations cancellable; do not block the Python event loop with synchronous browser, file or database work. Celery job entry points must explicitly own and clean up the async workflow lifecycle.
- Use uv and a committed uv.lock for Python, pnpm and pnpm-lock.yaml for JavaScript. Do not add Python packages to package.json or duplicate Python behavior in a Node service.
- Configure Ruff format/check, mypy and pytest when Python is scaffolded. Prettier remains for supported JS/TS/docs files only. Do not claim these Python checks are installed or passing until actually run.
- FastAPI/Pydantic owns API/event schemas; TypeScript/Zod owns MCP tool schemas. Export versioned contracts and test shared JSON examples in both languages. Preserve wire names, nullability, integer units and error semantics. Avoid independently maintained incompatible model definitions.
- Keep verification classification in Python and raw assertion execution in TypeScript. PostgreSQL domain data and migrations are owned by Python; browser tools return observations rather than bypassing lifecycle rules with direct writes.

## Execution continuity

At the start of implementation sessions, read [docs/execution-plan.md](docs/execution-plan.md) and its progress log. Execute the next incomplete step in order unless a dependency or explicit user direction requires an adjustment. Verify acceptance before marking a checkbox complete; record evidence, partial work and the exact next action. Keep README scope and the execution checklist consistent. Saving a plan is not implementation completion. Do not rerun completed work without a reason.
