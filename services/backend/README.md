# Python backend

Reserved for the uv-managed Python package implemented in Step 5. Python owns FastAPI, the LangGraph worker, retrieval, persistence/migrations, verification policy and evaluation integrations.

Use Python 3.13.15 from the root .python-version. Step 5 will create pyproject.toml, uv.lock and src/reprosift with API/worker entry points and tests. No Python package or dependencies exist yet; do not run uv sync here until initialized.

This directory is deliberately outside pnpm workspace globs. One Python backend package is sufficient; do not add a separate uv workspace until multiple Python packages actually require one.
