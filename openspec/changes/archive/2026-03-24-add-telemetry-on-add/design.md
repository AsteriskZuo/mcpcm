## Context

The backend ingest endpoint (`POST /v1/ingest/mcp-servers`) is already implemented in `api`, but the CLI `mcpcm add` command currently performs only local config mutation and does not emit telemetry. This creates a product gap: local install behavior works, while server-side collection cannot reflect actual add/replace activity.

The `add` command already contains nuanced behavior (skip existing entries by default, replace when requested, partial success across agents), so telemetry must align with real write outcomes rather than raw input. The same backend integration surface is expected to be reused by future `find` work, so coupling network logic directly into `add.ts` would increase future refactor cost.

## Goals / Non-Goals

**Goals:**
- Add ingest telemetry reporting to `mcpcm add` based on actual successful local write outcomes.
- Include `add --replace` replacement results in telemetry reporting.
- Aggregate telemetry at server level (`mcp_name`) with deduplicated, stable `agents` list.
- Introduce reusable `cli/src/telemetry.ts` as the API integration module for current add and future find use.
- Keep local config mutation as the primary success path even when telemetry upload fails.

**Non-Goals:**
- Changing `find` behavior in this change.
- Changing backend API contract or backend storage model.
- Adding new backend endpoints or altering query semantics.

## Decisions

### 1. Introduce a dedicated telemetry client module (`telemetry.ts`)
- **Decision:** Create `cli/src/telemetry.ts` to own backend HTTP concerns (endpoint URL resolution, request/response handling, timeout/error normalization).
- **Rationale:** Keeps command handlers focused on command semantics and makes future `find` reuse straightforward.
- **Alternatives considered:**
  - Inline fetch in `add.ts`: faster initially, but duplicates network logic and raises reuse cost for later `find` changes.

### 2. Telemetry events are derived from effective write outcomes, not raw input
- **Decision:** Build telemetry payload candidates only from entries that were actually written (added or replaced), excluding skipped duplicates and failed writes.
- **Rationale:** Telemetry should represent observed installs, not attempted operations.
- **Alternatives considered:**
  - Emit from raw input for all targets: easier, but overcounts and reports events that never took effect.

### 3. Aggregate by `mcp_name` and encode agents as sorted comma-separated string
- **Decision:** For one add run, combine all successful agent targets for a given server into one ingest event with `agents` as deduplicated, sorted CSV.
- **Rationale:** Matches current API payload shape and reduces redundant requests while preserving traceability.
- **Alternatives considered:**
  - Per `(agent, server)` events: simpler mapping but noisier telemetry and unnecessary request volume.

### 4. `--replace` results are install telemetry events
- **Decision:** Replacement writes under `add --replace` are reported to ingest with `event: "install"`.
- **Rationale:** Business intent from product direction is to treat successful replacement installs as install events.
- **Alternatives considered:**
  - Distinct `replace` event: rejected because backend currently accepts only `install`.

### 5. Failure isolation: telemetry is best-effort
- **Decision:** Telemetry upload failure logs warnings and does not fail the overall `add` command when local writes succeed.
- **Rationale:** CLI’s primary responsibility is local config management; network outages should not block local usage.
- **Alternatives considered:**
  - Hard fail on telemetry failure: stronger consistency, but unacceptable UX regression for offline/local workflows.

## Risks / Trade-offs

- [Risk] Existing `add` logic currently skips duplicates even with `--replace`, so intended replace telemetry could never trigger. → Mitigation: update add write-path semantics so replace targets are actually written and marked for telemetry.
- [Risk] `raw_config` may include sensitive `env` values and will be sent to server. → Mitigation: explicitly document current behavior and flag payload-sanitization follow-up if required.
- [Risk] Backend currently upserts by `mcp_name` only, so `global` variations overwrite latest state fields. → Mitigation: keep client payload contract aligned but avoid adding assumptions that backend stores per-scope history.
- [Trade-off] Aggregation reduces request count but loses per-agent request granularity. → Mitigation: preserve agent list in payload and deterministic ordering for testability.

## Migration Plan

1. Add telemetry module and configuration surface in `cli`.
2. Refactor `add` outcome tracking to distinguish added/replaced/skipped/failed per server+agent.
3. Build aggregated ingest payloads from successful outcomes and submit best-effort telemetry.
4. Add/adjust tests for replace behavior, aggregation, payload mapping, and failure isolation.
5. Release as non-breaking CLI behavior enhancement.

Rollback strategy:
- If telemetry causes instability, disable telemetry invocation path while preserving local add behavior.

## Open Questions

- Should sensitive fields in `raw_config.env` be masked before upload, or is full payload storage currently intentional?
- Should telemetry endpoint URL be required, or optional with graceful no-op when unset?
