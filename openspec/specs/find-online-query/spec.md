# find-online-query Specification

## Purpose
TBD - created by archiving change add-online-find-query. Update Purpose after archive.
## Requirements
### Requirement: Find command SHALL support strict online query mode
The CLI MUST support online query mode only when invoked as `mcpcm find --online <keyword>`.

#### Scenario: Valid online syntax
- **WHEN** a user runs `mcpcm find --online demo`
- **THEN** the CLI MUST treat the command as online mode and query the backend with keyword `demo`

#### Scenario: Trailing online flag is rejected
- **WHEN** a user runs `mcpcm find demo --online`
- **THEN** the CLI MUST reject the invocation
- **THEN** the CLI MUST print guidance that online mode only supports `mcpcm find --online <keyword>`

#### Scenario: Missing online keyword is rejected
- **WHEN** a user runs `mcpcm find --online`
- **THEN** the CLI MUST reject the invocation
- **THEN** the CLI MUST print usage guidance for `mcpcm find --online <keyword>`

### Requirement: Online mode MUST query backend MCP server search API
In online mode, the CLI MUST call `GET /v1/query/mcp-servers` with `mcp_name` equal to the provided keyword.

#### Scenario: Query API request is constructed
- **WHEN** a user runs `mcpcm find --online alpha`
- **THEN** the CLI MUST issue a GET request to `/v1/query/mcp-servers?mcp_name=alpha`

### Requirement: Online mode response output MUST follow REST result semantics
Online mode MUST print backend response array for successful requests and print status/error details for failed HTTP responses.

#### Scenario: API returns matching items
- **WHEN** query API responds with status `200` and a non-empty array
- **THEN** the CLI MUST print the returned array to console in human-readable form

#### Scenario: API returns empty result
- **WHEN** query API responds with status `200` and `[]`
- **THEN** the CLI MUST print `[]`

#### Scenario: API returns non-200 error
- **WHEN** query API responds with a non-`200` status
- **THEN** the CLI MUST print the response status code
- **THEN** the CLI MUST print the error text/body returned by the API

### Requirement: Online mode MUST be resilient to request failures
Network/request exceptions in online mode MUST not crash the CLI process.

#### Scenario: Network error occurs
- **WHEN** the request fails due to timeout, DNS failure, or connection error
- **THEN** the CLI MUST emit a warning with the request error message
- **THEN** the command process MUST remain non-crashing

