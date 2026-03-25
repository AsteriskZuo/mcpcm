## Why

`mcpcm find` currently searches only local configuration files, which misses server-side telemetry-backed matches collected through ingest APIs. We need an explicit online lookup mode so users can query the backend index when local files do not contain the target MCP server.

## What Changes

- Add an online query mode to `mcpcm find` using a new `--online` flag.
- Support online command form only as `mcpcm find --online <keyword>`.
- Reject `mcpcm find <keyword> --online` with a clear usage hint.
- In online mode, call `GET /v1/query/mcp-servers?mcp_name=<keyword>` and print server response results directly.
- Standardize online output behavior:
  - `200`: print returned array (including `[]`).
  - non-`200`: print status code plus error message/body.
  - network/request failure: print warning and keep command non-crashing.

## Capabilities

### New Capabilities
- `find-online-query`: add explicit online search flow for `find` backed by the query API.

### Modified Capabilities
- None.

## Impact

- Affected module: `app`.
- Primary files: `app/src/commands/find.ts`, shared API client/helper area if extracted.
- API dependency: existing backend endpoint `GET /v1/query/mcp-servers` (no contract change required).
- Testing impact: add parser/behavior coverage for strict `--online <keyword>` syntax and API response/error handling.
