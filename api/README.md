# mcpcm-server (API)

[English](README.md) | [简体中文](README.zh-CN.md)

FastAPI backend for `mcpcm` ingest/query workflows.

## Overview

This service provides:
- `POST /v1/ingest/mcp-servers`: ingest install events from CLI.
- `GET /v1/query/mcp-servers`: query stored MCP records.
- `GET /health`: health check endpoint.

Storage is SQLite (`MCPPCM_DATABASE_URL`) and schema is initialized at startup.

## Project Layout

- `main.py`: app factory, lifespan wiring, router mounting
- `routers/`: HTTP endpoints (`health`, `ingest`, `query`)
- `services/`: business logic
- `repositories/`: data-access layer
- `schemas/`: request/response models
- `db/`: database connection and schema bootstrap
- `tests/`: API, service, and integration tests

## Prerequisites

- Python `>=3.11`
- `uv`

## Quick Start

Run all commands from `api/`:

```bash
cd api
uv sync
uv run uvicorn main:app --reload
```

Default local URL: `http://127.0.0.1:8000`

## Common Commands

```bash
uv sync
uv run uvicorn main:app --reload
uv run pytest
uv run ruff check .
uv run ruff format .
```

## Environment Variables

Create local env file from template:

```bash
cd api
cp .env.example .env
```

Current settings are read from `os.getenv` (the app does not auto-load `.env`).
If needed, export variables before startup:

```bash
set -a
source .env
set +a
uv run uvicorn main:app --reload
```

Supported variables:

- `MCPPCM_HOST` (default: `127.0.0.1`)
- `MCPPCM_PORT` (default: `8000`)
- `MCPPCM_DATABASE_URL` (default: `sqlite:///./data/mcpcm.db`)
- `MCPPCM_MAX_INGEST_PAYLOAD_BYTES` (default: `65536`)

## API Contract (v1)

Contract doc: `docs/api-contract.md`

### Ingest

- Endpoint: `POST /v1/ingest/mcp-servers`
- Body example:

```json
{
  "mcp_name": "my_mcp_server",
  "raw_config": "{\"mcpServers\":{\"my_mcp_server\":{}}}",
  "agents": "cursor,claude",
  "event": "install",
  "global": false
}
```

Notes:
- `event` currently supports only `install`
- repeated installs of the same `mcp_name` increment `install_count`

### Query

- Endpoint: `GET /v1/query/mcp-servers`
- Optional query param: `mcp_name` (contains match)
- Response example:

```json
[
  {
    "mcp_name": "my_mcp_server",
    "raw_config": "{\"mcpServers\":{\"my_mcp_server\":{}}}",
    "install_count": 3
  }
]
```

No-match response:

```json
[]
```

## VS Code Setup

If you open the monorepo root (`.../mcpcm`), recommend:

```json
{
  "python.defaultInterpreterPath": "${workspaceFolder}/api/.venv/bin/python",
  "python.analysis.extraPaths": ["${workspaceFolder}/api"]
}
```

If you open only `api/`, recommend:

```json
{
  "python.defaultInterpreterPath": "${workspaceFolder}/.venv/bin/python",
  "python.analysis.extraPaths": ["${workspaceFolder}"]
}
```

## Troubleshooting

### `Import "fastapi" could not be resolved`

Usually the Python interpreter is not set to `api/.venv/bin/python`.

### Commands fail due to missing dependencies

Ensure your working directory is `api/`, then run:

```bash
uv sync
```

## Development Notes

- Keep current import style (without `api.` prefix)
- Add tests under `tests/`
- Keep API behavior aligned with `docs/api-contract.md`
