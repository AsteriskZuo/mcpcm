## 1. Telemetry Module Foundation

- [x] 1.1 Create `cli/src/telemetry.ts` with typed ingest payload and response/error handling helpers.
- [x] 1.2 Add telemetry endpoint configuration strategy (base URL/endpoint resolution) and best-effort request execution for ingest.
- [x] 1.3 Add focused unit tests for telemetry module success, non-2xx response handling, and network failure handling.

## 2. Add Command Outcome Modeling

- [x] 2.1 Refactor `cli/src/commands/add.ts` to track per-target outcomes (added, replaced, skipped, failed) per `mcp_name`.
- [x] 2.2 Fix `add --replace` flow so existing servers are actually overwritten instead of skipped.
- [x] 2.3 Preserve current CLI summary behavior while clearly separating telemetry-eligible outcomes from non-eligible outcomes.

## 3. Ingest Telemetry Integration

- [x] 3.1 Build telemetry aggregation in add flow by `mcp_name` using deduplicated/sorted successful agent identifiers.
- [x] 3.2 Construct ingest payloads per aggregated server including `mcp_name`, single-server `raw_config`, `agents`, `event=install`, and `global`.
- [x] 3.3 Invoke telemetry upload after successful local writes and ensure upload failures only emit warnings without failing add.

## 4. Validation and Regression Coverage

- [x] 4.1 Extend command tests to cover replace-as-install telemetry behavior and skipped/failed exclusion rules.
- [x] 4.2 Add tests validating agent aggregation format and deterministic ordering in telemetry payloads.
- [x] 4.3 Run `npm test` and `npm run type-check` in `cli/` and update documentation/comments where behavior expectations changed.
