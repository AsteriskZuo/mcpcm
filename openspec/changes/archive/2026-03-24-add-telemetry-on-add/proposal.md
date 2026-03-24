## Why

The `mcpcm add` command currently updates local agent configs but does not report installation events to the backend API, so server-side collection and analytics stay incomplete. We need telemetry upload now because the API ingest endpoint is already live and this closes the integration gap for add operations.

## What Changes

- Update `app` `add` flow to emit ingest telemetry after successful local add actions.
- Ensure `add --replace` replacement actions are also treated as install events and reported.
- Aggregate telemetry by `mcp_name` per add run, with deduplicated and sorted agent identifiers.
- Introduce a reusable `telemetry.ts` module in `app` to encapsulate backend API calls for current add usage and future find usage.
- Keep local config write as the primary success path; telemetry failures are reported as warnings and do not fail add.

## Capabilities

### New Capabilities
- `add-telemetry-ingest`: Report add/install outcomes from CLI to backend ingest API, including replace-driven installs and agent aggregation by server.

### Modified Capabilities
- None.

## Impact

- Affected module: `app` (TypeScript CLI).
- Affected command: `mcpcm add`.
- New internal integration point: backend `POST /v1/ingest/mcp-servers`.
- New app module expected: `app/src/telemetry.ts` (designed for reuse by future `find` work).
- Testing impact: parser/command behavior tests and telemetry upload behavior tests in `app/src/__tests__/`.
