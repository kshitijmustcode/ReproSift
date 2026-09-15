# Prerequisite audit

Verified on 2026-09-15 on macOS Apple Silicon. Phase 1 Step 1 is complete. This verifies tools and runtime selection; application dependency integration will be tested as each component is scaffolded.

| Tool              | Selected / observed version | Verification                                                                                          |
| ----------------- | --------------------------- | ----------------------------------------------------------------------------------------------------- |
| Node.js           | 24.21.0                     | Installed through nvm; direct invocation succeeded; .nvmrc pins it                                    |
| pnpm              | 11.19.0                     | Works from the Node 24 installation; packageManager and engines pin it                                |
| Python            | 3.13.15                     | uv-managed installation; version and ssl/sqlite3/venv/asyncio imports passed; .python-version pins it |
| uv                | 0.12.13                     | CLI and installed interpreter discovery succeeded                                                     |
| Docker engine/CLI | 29.8.0                      | Docker Desktop started; engine responds and hello-world ran successfully                              |
| Docker Compose    | 5.5.1                       | Compose version command succeeded                                                                     |
| Git               | 2.42.0                      | CLI works; repository main tracks origin/main                                                         |

No runtime download was required: appropriate Node/Python installations already existed. Docker Desktop was started and left running. The hello-world container used --rm and was removed on exit; its image may remain cached.

## Select the project runtimes

From the project root, in a shell where nvm is loaded:

```sh
nvm use
node --version
pnpm --version
uv python find 3.13.15
uv run --no-project --python 3.13.15 python --version
pnpm format:check
```

If nvm is not loaded in a fresh macOS terminal:

```sh
source "$HOME/.nvm/nvm.sh"
nvm use
```

The audited shell initially selected Node 20.15.0 and Apple's Python 3.9.6. Neither default was modified. Use nvm use for this repository and uv-managed environments for backend work. Avoid using the bare system python3 for the project. The Python backend declares requires-python = ">=3.13,<3.14" and has a uv.lock, created in Step 5 using Python 3.13.15.

The audit also verified pnpm through the Node 24 installation, so development does not depend on the Codex-provided fallback pnpm path.

## Compatibility basis

Node 24 is an LTS line and exceeds Next.js's documented minimum Node 20.9. Python 3.13 exceeds LangChain's documented Python 3.10 minimum. These baseline checks are not a claim that all uninstalled dependencies have been integration-tested. Resolve compatible stable packages and verify their Python/Node requirements during each scaffolding step.

- [Node release status](https://nodejs.org/en/about/previous-releases)
- [Next.js installation requirements](https://nextjs.org/docs/app/getting-started/installation)
- [LangChain Python installation](https://docs.langchain.com/oss/python/langchain/install)
- [uv Python management](https://docs.astral.sh/uv/guides/install-python/)

## Step 2 status

Completed on 2026-09-15 after this audit. Git, origin/main, ignore rules and runtime pins are present. The pnpm workspace now discovers five private JavaScript members plus root. Python and supporting directories have ownership notes. Offline frozen-lockfile installation and ignore rules were verified. See [workspace structure](workspace.md).

Steps 3–6 application scaffolding and repository checks are complete; next action: Step 7 — create the TypeScript MCP server. No application frameworks, API calls or deployment were introduced by Steps 1–2.
