# Repository Guidelines

## Scope
This root guide is the monorepo entry point. Module-specific contributor instructions live in:
- [`app/AGENTS.md`](app/AGENTS.md) for the TypeScript CLI package.
- [`api/AGENTS.md`](api/AGENTS.md) for the FastAPI backend.

When rules differ, submodule guides take precedence for files inside that module.

## Repository Layout
- `app/`: Node.js/TypeScript CLI (`mcpcm`).
- `api/`: Python/FastAPI service (`mcpcm-server`).
- `docs/`: shared design notes and contracts.
- `docker/`: container-related assets.

## How To Work In This Repo
1. Identify the module you are changing (`app` or `api`).
2. Follow that module’s `AGENTS.md` for commands, tests, style, and structure.
3. Keep changes scoped; avoid mixing unrelated CLI and API refactors in one PR.

Example:
- CLI change: run commands from `app/` and follow `app/AGENTS.md`.
- API change: run commands from `api/` and follow `api/AGENTS.md`.

## Shared Commit & PR Expectations
- Use concise commit prefixes consistent with history: `feat:`, `fix:`, `chore:`, `docs:`, `tag:`.
- Keep each commit focused on one concern.
- PR descriptions should include:
  - changed module(s): `app`, `api`, or both,
  - why the change was made,
  - verification commands executed,
  - sample output/API example when behavior changes.

## Security & Config Hygiene
- Never commit secrets, local tokens, or personal machine config.
- Keep test fixtures sanitized.
- If config paths or environment variables change, update the relevant module README/AGENTS in the same PR.
