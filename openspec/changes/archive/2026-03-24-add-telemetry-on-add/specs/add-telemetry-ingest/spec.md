## ADDED Requirements

### Requirement: Add command MUST report successful install outcomes to ingest API
The `mcpcm add` command MUST send ingest telemetry for each MCP server that is successfully written to at least one target agent configuration in the current run.

#### Scenario: New server is added to multiple agents
- **WHEN** `mcpcm add` writes `serverA` successfully to `cursor` and `claude-code`
- **THEN** the CLI MUST submit ingest telemetry for `serverA`
- **THEN** the telemetry payload MUST contain `mcp_name` as `serverA`
- **THEN** the telemetry payload MUST contain `agents` as a deduplicated comma-separated list of successful target agents

### Requirement: Add replace operations MUST be treated as install telemetry
When `mcpcm add --replace` overwrites an existing server configuration successfully, that outcome MUST be included in ingest telemetry as an install event.

#### Scenario: Existing server is replaced
- **WHEN** `mcpcm add --replace` successfully overwrites `serverA` in one or more target agents
- **THEN** the CLI MUST include `serverA` in ingest telemetry for that run
- **THEN** the telemetry payload MUST use `event` value `install`

### Requirement: Telemetry payload MUST align with ingest API contract
For each reported MCP server, the CLI MUST send a payload compatible with `POST /v1/ingest/mcp-servers`.

#### Scenario: Telemetry payload fields are constructed
- **WHEN** the CLI builds telemetry payload for a successfully written server
- **THEN** payload MUST include non-empty `mcp_name`, `raw_config`, `agents`, and `event`
- **THEN** payload MUST set `event` to `install`
- **THEN** payload MUST include boolean `global` matching the add target mode semantics used for the write

### Requirement: Telemetry upload MUST be best-effort
Telemetry upload failures MUST NOT cause successful local add operations to be reported as failed.

#### Scenario: Ingest API is unavailable
- **WHEN** local writes complete successfully but telemetry request fails due to network or API error
- **THEN** `mcpcm add` MUST still complete as a successful local operation
- **THEN** the CLI MUST emit warning output indicating telemetry upload failure

### Requirement: Non-effective outcomes MUST NOT be reported as installs
The CLI MUST exclude skipped duplicates and failed writes from ingest telemetry.

#### Scenario: Duplicate is skipped without replace
- **WHEN** `mcpcm add` encounters `serverA` already existing for an agent target and no replace write occurs
- **THEN** that skipped outcome MUST NOT contribute to telemetry payload agent aggregation

#### Scenario: Write failure occurs for a target agent
- **WHEN** a target write fails for `serverA` on one agent but succeeds on another
- **THEN** telemetry MUST include only agents with successful writes for `serverA`
