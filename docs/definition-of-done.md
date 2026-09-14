# Definition of done

These are acceptance gates, not claims of completed implementation. The README contains the day-by-day schedule.

| Milestone                      | Required evidence                                                                                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Foundation (days 1–3)          | Documented startup; resettable sample; validated MCP browser action and saved screenshot; invalid targets rejected                                           |
| First investigation (days 4–7) | UI submission, persisted progress, cancellation, retrieved requirement, structured candidate and downloadable test for E01                                   |
| Verification (days 8–10)       | Fresh browser + backend reset; relevant assertion failure on buggy and pass on corrected; execution failures classified separately; bounded jobs and cleanup |
| Evaluation (days 11–12)        | Versioned reports and fixtures; no-bug cases; raw results including failures; reviewed assertions; reproducible runner                                       |
| Delivery (days 13–14)          | Clean setup verification, four product pages, artifact access/expiry behavior, README and demo video; live hosted status explicitly stated                   |

## Every implementation change

- Behavior and failure cases identified before accepting generated code.
- Follows AGENTS.md: cohesive boundaries, strict types, runtime validation, cleanup and explicit errors.
- Run Prettier for JS/TS/docs, Ruff and mypy for Python once configured, and cross-language contract checks; run other lint/type checks once configured, plus tests appropriate to the behavior. Report unavailable or unrun checks honestly.
- No real credentials, unsupported success claims, silent assertion weakening, or uncontrolled external targets.
- Relevant docs/contracts updated. Candidate and event schema changes have a versioning/migration decision.
- Small reviewable diff; owner can explain the critical path.

## Project acceptance

A visitor can select a sample, watch an investigation, inspect cited evidence, replay a fixed candidate and download a test with its setup requirements. Verification must distinguish matching defect from broken execution. A compatible MCP client can use the tools independently. Measured limitations and usage costs are visible in documentation.

A saved report or video is useful but must not be presented as live execution. Three repeated outcomes are not a no-flakiness guarantee. Automatic fixes remain out of scope.
