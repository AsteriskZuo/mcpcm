## Context

The current `mcpcm find` command scans local project/global agent configuration files and reports where a server name exists. It does not query backend data exposed by `GET /v1/query/mcp-servers`, even though add telemetry now populates server-side records. Users therefore cannot discover MCP servers that exist in backend records but are absent locally.

This change introduces a strict online mode with clear CLI syntax and deterministic output behavior. The agreed product rule is explicit: online mode must be invoked as `mcpcm find --online <keyword>`, while trailing-flag form (`mcpcm find <keyword> --online`) is invalid and should return a helpful usage hint.

## Goals / Non-Goals

**Goals:**
- Add `--online` mode to `find` with strict accepted syntax `mcpcm find --online <keyword>`.
- In online mode, call `GET /v1/query/mcp-servers?mcp_name=<keyword>` and print array response on `200`.
- Standardize failure output for non-`200` responses (status + error details).
- Keep command resilient for network failures (warning only, no crash).
- Preserve existing local search behavior when `--online` is not used.

**Non-Goals:**
- Changing backend API contract or backend query behavior.
- Combining local and online results in one command output for this change.
- Introducing additional online query flags (pagination/filter/sorting).

## Decisions

### 1. Strict online syntax validation in `find` command
- **Decision:** Treat `--online` mode as a dedicated argument shape: first non-command token must be `--online`, followed by exactly one keyword.
- **Rationale:** Matches confirmed UX and avoids ambiguous parsing between local and online search semantics.
- **Alternatives considered:**
  - Accept both `--online <keyword>` and `<keyword> --online`: rejected due to explicit product decision and increased parser complexity.

### 2. Online mode is API-only path
- **Decision:** In `--online` mode, skip all local file scan logic and execute only one REST request to query API.
- **Rationale:** Keeps output deterministic and consistent with user expectation that online mode reflects backend index.
- **Alternatives considered:**
  - Merge local and online outputs: rejected for now because it obscures source-of-truth and complicates formatting.

### 3. Response rendering and error policy
- **Decision:**
  - `200`: print returned array content directly (including empty array).
  - non-`200`: print `status code + response text`.
  - fetch/network exception: warning with raw error message.
- **Rationale:** Keeps behavior close to raw REST outcomes, minimizes custom wrapping, and remains human-readable.
- **Alternatives considered:**
  - Structured wrapper output (`{code,data,error}`): rejected because user requested no wrapper.

### 4. Endpoint/base URL reuse via existing telemetry env conventions
- **Decision:** Reuse existing base URL resolution (`MCPPCM_SERVER_URL` with fallback `MCPPCM_API_BASE_URL`) rather than introducing new env keys.
- **Rationale:** Reduces config surface and keeps one backend base URL convention across CLI networking features.
- **Alternatives considered:**
  - Separate query-specific env var: rejected as unnecessary fragmentation.

## Risks / Trade-offs

- [Risk] Strict syntax may surprise users accustomed to flexible flag order. → Mitigation: emit explicit guidance showing the only accepted online form.
- [Risk] Backend may return large arrays, making console output noisy. → Mitigation: keep output raw for now and consider pagination/limit in future change.
- [Risk] Missing base URL configuration causes online query to fail. → Mitigation: return actionable warning indicating backend URL env is required.
- [Trade-off] API-only online mode avoids ambiguity but does not provide combined local/remote insight in one command.

## Migration Plan

1. Update `find` argument parsing to branch local mode vs strict online mode.
2. Add online query request helper and response rendering in `find` flow.
3. Add test coverage for syntax validation, success (`200` array), non-`200`, and network failure warning behavior.
4. Update CLI help/readme command docs for online find usage.

Rollback strategy:
- Revert online branch in `find` and keep existing local-only logic unchanged.

## Open Questions

- Should verbose mode include request URL and response status for successful `200` paths, or keep success output raw only?
