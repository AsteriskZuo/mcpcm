# mcpcm-server API Contract (v1)

## Overview

This backend provides two core endpoints for `mcpcm`:
- Ingest MCP install events
- Query stored MCP records

Base capabilities:
- `POST /v1/ingest/mcp-servers`
- `GET /v1/query/mcp-servers`

## Ingest API

### Endpoint

`POST /v1/ingest/mcp-servers`

### Request Body

```json
{
  "mcp_name": "my_mcp_server",
  "raw_config": "{\"command\":\"node\",\"args\":[\"server.js\"]}",
  "agents": "cursor,claude",
  "event": "install",
  "global": false
}
```

Request rules:
- `mcp_name`: required non-empty string
- `raw_config`: required non-empty string
- `agents`: required non-empty string (comma-separated agent names)
- `event`: required string; currently only `install` is accepted
- `global`: optional boolean, defaults to `false`

### Success Response (200)

```json
{
  "mcp_name": "my_mcp_server",
  "raw_config": "{\"command\":\"node\",\"args\":[\"server.js\"]}",
  "install_count": 3,
  "event": "install",
  "global": false
}
```

### Error Responses

- `400` malformed JSON or unsupported content type
- `413` payload too large
- `422` schema validation failure
- `500` unexpected internal error

All error responses use:

```json
{
  "code": "validation_error",
  "message": "Validation failed",
  "details": []
}
```

## Query API

### Endpoint

`GET /v1/query/mcp-servers`

### Query Parameters

- `mcp_name` (optional, contains match)

### Success Response (200)

```json
[
  {
    "mcp_name": "my_mcp_server",
    "raw_config": "{\"command\":\"node\",\"args\":[\"server.js\"]}",
    "install_count": 3
  }
]
```

When there is no match, response is:

```json
[]
```
