# Evaluation harness

This directory owns Python-harness datasets, reports and evaluation-only labels. See ../docs/evaluation-plan.md. Never mount it into the agent runtime or index it into RAG. Directory separation alone does not enforce isolation; verify tool scopes and deployment mounts.

Run the deterministic development baseline from the repository root:

```bash
uv run --directory services/backend --locked reprosift-evaluate \
  --dataset evals/development/cases.json \
  --output artifacts/evaluation-development-v1.json
```

The initial baseline replays recorded browser observations to verify reporting, aggregation, no-bug controls, execution-failure preservation, latency fields, and zero model-cost accounting without starting a browser or using an API key. `BrowserRunnerReplayExecutor` defines the JSON process boundary for the TypeScript browser-runner integration; replace the recorded executor only when that subprocess bridge is implemented and run against a local fixture environment. Generated reports belong under ignored `artifacts/`.
