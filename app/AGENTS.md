# App Module Guidelines

## Scope
This guide applies only to files under `app/` (the TypeScript CLI module). For repository-wide conventions, refer to the root `AGENTS.md`.

## Project Structure & Module Organization
Source code lives in `src/` and is organized by responsibility:
- `src/cli.ts`: CLI entrypoint and command routing.
- `src/commands/`: command handlers and option parsers (`add`, `update`, `del`, `list`, `find`, `sync`).
- `src/agents.ts`, `src/config-reader.ts`, `src/config-writer.ts`, `src/utils.ts`, `src/types.ts`: shared domain logic.
- `src/__tests__/`: Vitest suites (`*.test.ts`) for parsers, agent config, and utility behavior.
Build output is generated into `dist/` (gitignored).

## Build, Test, and Development Commands
- `npm run dev -- <args>`: run CLI from TypeScript source via `tsx`.
- `npm run build`: bundle `src/cli.ts` to ESM output in `dist/` using `tsup`.
- `npm run type-check`: run strict TypeScript checks without emitting files.
- `npm test`: run all tests once with Vitest.
- `npm run test:watch`: run Vitest in watch mode during local development.
- `npm run format` / `npm run format:check`: apply or verify Prettier formatting for `src/**/*.ts`.

## Coding Style & Naming Conventions
Use TypeScript with ESM imports and explicit `.js` import suffixes in source files. Formatting is enforced by Prettier (`singleQuote: true`, `printWidth: 100`, `trailingComma: es5`); do not hand-format against it. Follow existing naming patterns:
- Files: kebab-case (for example, `config-reader.ts`).
- Functions/variables: `camelCase`.
- Types/interfaces: `PascalCase`.
Keep command behavior deterministic and side-effect boundaries clear (parse -> validate -> apply).

## Testing Guidelines
Use Vitest and place new tests in `src/__tests__/` as `*.test.ts`. Mirror target modules in test names (for example, `agents.test.ts` for `agents.ts`). Cover both happy paths and invalid input/edge cases (unknown agent names, malformed JSON/TOML, missing flags). Run `npm test` and `npm run type-check` before opening a PR.

## Commit & Pull Request Guidelines
Recent history uses lightweight Conventional Commit prefixes (`feat:`, `chore:`, `docs:`, `tag:`). Prefer:
- `feat: add qoder global sync fallback`
- `fix: handle missing --from in sync parser`
Keep commits focused and scoped to one concern. PRs should include: purpose, key changes, commands run (`npm test`, `npm run type-check`), and CLI output examples when behavior changes.

## Security & Configuration Tips
This tool reads/writes agent config files in home/workspace paths. Never commit personal config artifacts (`.cursor/`, `.mcp.json`, `.codex/`, etc. are already ignored). Use fixture files or temporary directories for tests instead of real user config paths.
