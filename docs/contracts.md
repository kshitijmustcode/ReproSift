# Core contracts — proposed version 1

Status: investigation contracts below remain design specifications. The Step 7 MCP status contract is implemented in [status.ts](../packages/mcp-server/src/status.ts) and documented in the [MCP package](../packages/mcp-server/README.md). It has schemaVersion 1, strict empty input and explicit browserExecution=false. Python response validation and shared compatibility examples arrive in Step 8. During further implementation, owner schemas in the Python backend and packages/contracts-ts become authoritative; update this document with links rather than maintaining conflicting type copies.

## Shared conventions

Opaque IDs; ISO-8601 UTC timestamps; integer money in cents; durations in milliseconds. Every stored candidate/event has schemaVersion. Validate unknown input with Pydantic in Python and Zod in TypeScript. Ownership comes from authenticated server context, never model arguments. Do not return local paths or credentials to untrusted clients.

## Investigation and attempt

Investigation: id, report, expectedBehavior, scenarioId, createdAt, status, activeAttemptId, conclusion, requirementRefs.

Status: queued → running → replaying → completed. queued/running/replaying can transition to cancelled; active states can become failed or interrupted. An interrupted attempt remains immutable; an explicit bounded retry creates a new attempt and requeues the investigation. Terminal completed/failed/cancelled investigations require a new run to try again. Persist transitions atomically and reject stale updates by version.

Attempt: id, investigationId, ordinal, startedAt, finishedAt, state, deadlineAt, limits, usage, error. Queue delivery deduplication must not imply browser actions are safe to repeat.

Conclusion: matching_defect | expected_behavior | inconclusive. Technical failure details and replay outcomes remain separate.

## Browser actions

Discriminated union: navigate (allowed relative path), click (locator), fill (locator/value), select (locator/value). MVP locators: exact role/name, label, test ID. Avoid arbitrary JavaScript execution, filesystem access and unrestricted absolute destinations.

Action command: id, sessionId, ordinal, action, timeoutMs. Server verifies session ownership and remaining budget. Action result: succeeded with observation references, or failed with typed error. Unknown execution status after disconnection is not automatically retried.

## Assertions and reproduction

Assertion: id, kind (text_equals | money_equals | count_equals | visible), target locator, expected typed value, requirementRef (documentId/version/chunkId), timeoutMs. Visibility can specify false. Monetary expectations include currency. Preconditions are separate assertions establishing the relevant state.

Reproduction: id, version, schemaVersion, scenarioId, fixtureVersion, ordered actions, preconditions, assertions, source requirement refs, createdAt, contentHash. Immutable once replay begins. Generated code must preserve this representation.

## Events

Envelope: id, investigationId, attemptId, sequence, timestamp, schemaVersion, type, payload.

Types: run_started, requirements_retrieved, action_started, action_finished, artifact_created, candidate_created, replay_started, replay_finished, run_finished, run_cancelled, run_failed. Payload is a discriminated schema per type. Persist before publishing; sequence ordering supports reconnect with a last-seen cursor. Deliveries can repeat: clients deduplicate by event ID. Emit concise actions/evidence, not private model chain-of-thought.

## Replay result

Fields: id, reproductionId/version/hash, environmentBuildId, fixtureVersion, browserVersion, seedId, startedAt, durationMs, outcome, preconditionsReached, assertionResults, failureSignature, artifactIds, error.

Outcome: matching_defect | expected_behavior | execution_failure | inconclusive. An assertion result includes expected/actual values and source support. Harness-only environment variant labels are omitted from agent-visible views.

## Artifacts and errors

Artifact: id, owner/run IDs, kind (screenshot | trace | test | network | report), contentType, sizeBytes, checksum, createdAt, expiresAt. Storage keys are internal; access uses scoped handlers or expiring links. Expired artifacts must show an explicit UI state.

Error: code, safeMessage, phase, retriable, correlationId. Example codes: INVALID_INPUT, FORBIDDEN, TARGET_NOT_ALLOWED, SESSION_EXPIRED, RESET_FAILED, LOCATOR_FAILED, DEADLINE_EXCEEDED, BUDGET_EXCEEDED, BROWSER_CRASHED, MODEL_ERROR, STORAGE_ERROR. retriable is advisory, not authorization to replay a mutation.

## HTTP/MCP boundaries

POST investigation creates persisted work and returns an ID, not a synchronous browser result. GET status/events reads scoped persisted state. Cancel is idempotent. Replay creates a new replay ID for a fixed candidate. MCP tools validate arguments, enforce trusted context, and delegate; adapters must not leak Playwright/ORM objects into contracts.

## Hybrid implementation ownership

Python/FastAPI owns investigation APIs, events and verification classification. Pydantic defines API/event contracts and exports OpenAPI/JSON Schema; TypeScript consumes derived types and validates untrusted runtime input. TypeScript/Zod owns browser MCP schemas; the Python client validates returned structures. Preserve camelCase wire fields with explicit Python aliases, schema versions, nullability and integer units. Add shared JSON compatibility examples accepted/rejected by both runtimes.

The TypeScript runner reports precondition/assertion observations and technical errors. Python applies verification-rules.md to classify them. Requirement search stays in Python and is a local agent tool. Only the trusted harness receives variant labels. Neither side should duplicate the other's business policy.
