# API Module Guidelines

## Scope
This guide applies only to files under `api/` (the FastAPI backend module). For repository-wide conventions, refer to the root `AGENTS.md`.

## Project Structure & Module Organization
Backend code is organized by layer:
- `main.py`: app factory, lifespan wiring, and router mounting.
- `routers/`: HTTP endpoints (`health`, `ingest`, `query`).
- `services/`: business logic.
- `repositories/`: persistence abstraction over the database layer.
- `schemas/`: request/response models.
- `db/`: database connection and schema bootstrap.
- `tests/`: `api/`, `services/`, and `integration/` test suites.

Keep routers thin and place business rules in `services/`.

## Build, Test, and Development Commands
Run commands from `api/`:
- `uv sync`: install/update dependencies.
- `uv run uvicorn main:app --reload`: run local API server.
- `uv run pytest`: run the full test suite.
- `uv run ruff check .`: lint.
- `uv run ruff format .`: format Python files.

## Coding Style & Naming Conventions
- Follow PEP 8 with 4-space indentation.
- Add type hints at service and repository boundaries.
- Modules/files: `snake_case.py`; classes: `PascalCase`; functions/variables: `snake_case`.
- Keep imports consistent with current style (for example `from services.query_service import QueryService`).
- Use Ruff rules from `pyproject.toml` (line length 100, py311 target).

## Testing Guidelines
- Framework: `pytest` with FastAPI test client fixtures from `tests/conftest.py`.
- Test files use `test_*.py` naming.
- Add regression tests for bug fixes and include invalid input/error-path coverage.
- For API changes, update route tests under `tests/api/` and add integration coverage when behavior spans multiple layers.

## Commit & Pull Request Guidelines
Use concise commit prefixes (`feat:`, `fix:`, `chore:`, `docs:`). Keep each commit focused.

PRs should include:
- summary of behavior change,
- verification commands executed (for example `uv run pytest`, `uv run ruff check .`),
- sample request/response payloads for API contract changes.

## Security & Configuration Tips
- Never commit `.env` files, secrets, or production database paths.
- Validate and sanitize incoming MCP payload data.
- Keep environment variable docs synchronized with `README.md` when config keys change.
