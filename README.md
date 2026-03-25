# mcpcm Monorepo

[English](README.md) | [简体中文](README.zh-CN.md)

`mcpcm` is a monorepo that contains:

- A TypeScript CLI for managing MCP server configurations across AI agents.
- A FastAPI backend for ingesting install events and querying shared MCP records.

## Repository Structure

- `cli/`: `mcpcm` CLI package (TypeScript/Node.js)
- `api/`: `mcpcm-server` backend (Python/FastAPI + SQLite)
- `docs/`: shared notes (for example OpenSpec usage)
- `docker/`: container assets (reserved)

## How Components Work Together

- Local config management:
  - `mcpcm add`, `update`, `del`, `list`, `find` (local mode) operate on agent config files.
- Optional backend integration:
  - `mcpcm add` can upload install telemetry to `POST /v1/ingest/mcp-servers`.
  - `mcpcm find --online <keyword>` queries `GET /v1/query/mcp-servers`.

Set `MCPPCM_SERVER_URL` (or `MCPPCM_API_BASE_URL`) to enable backend calls from the CLI.

## Prerequisites

- Node.js `>=18` (for `cli/`)
- Python `>=3.11` (for `api/`)
- `uv` (Python package manager/runner)

## Quick Start

### 1. Run the API server

```bash
cd api
uv sync
uv run uvicorn main:app --reload
```

API default URL: `http://127.0.0.1:8000`  
Health check: `GET /health`

### 2. Run the CLI

```bash
cd cli
npm install
npm run dev -- --help
```

Example:

```bash
npm run dev -- add '{"mcpServers":{"my-server":{"command":"node","args":["/path/to/server"]}}}' --agent cursor
```

### 3. Connect CLI to API (optional but recommended)

```bash
export MCPPCM_SERVER_URL=http://127.0.0.1:8000
cd cli
npm run dev -- find --online my-server
```

## Key Commands

### CLI (`cli/`)

```bash
npm run dev -- <command>
npm run build
npm run type-check
npm test
npm run format:check
```

Main CLI commands:

- `add`
- `update`
- `del`
- `list`
- `find`
- `sync`

### API (`api/`)

```bash
uv sync
uv run uvicorn main:app --reload
uv run pytest
uv run ruff check .
uv run ruff format .
```

## Environment Variables

### CLI

- `MCPPCM_SERVER_URL`: backend base URL for telemetry and online find
- `MCPPCM_API_BASE_URL`: fallback alias for backend base URL
- `MCPPCM_TELEMETRY_TIMEOUT_MS`: telemetry request timeout (ms, default `3000`)

### API

- `MCPPCM_HOST` (default: `127.0.0.1`)
- `MCPPCM_PORT` (default: `8000`)
- `MCPPCM_DATABASE_URL` (default: `sqlite:///./data/mcpcm.db`)
- `MCPPCM_MAX_INGEST_PAYLOAD_BYTES` (default: `65536`)

## API Endpoints

- `GET /health`
- `POST /v1/ingest/mcp-servers`
- `GET /v1/query/mcp-servers`

Details: `api/docs/api-contract.md`

## Development Notes

- For repo-wide contribution and workflow rules, see `AGENTS.md`.
- For module-specific rules, see:
  - `cli/AGENTS.md`
  - `api/AGENTS.md`
