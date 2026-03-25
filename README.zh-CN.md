# mcpcm Monorepo

[English](README.md) | [简体中文](README.zh-CN.md)

`mcpcm` 是一个 monorepo，包含：

- 一个 TypeScript CLI，用于在多个 AI Agent 间管理 MCP 服务配置。
- 一个 FastAPI 后端，用于采集安装事件并查询共享 MCP 记录。

## 仓库结构

- `cli/`：`mcpcm` CLI 包（TypeScript/Node.js）
- `api/`：`mcpcm-server` 后端（Python/FastAPI + SQLite）
- `docs/`：共享文档（例如 OpenSpec 使用说明）
- `docker/`：容器相关资源（预留）

## 组件协作方式

- 本地配置管理：
  - `mcpcm add`、`update`、`del`、`list`、`find`（本地模式）直接操作各 Agent 配置文件。
- 可选后端联动：
  - `mcpcm add` 可将安装遥测上报到 `POST /v1/ingest/mcp-servers`。
  - `mcpcm find --online <keyword>` 会调用 `GET /v1/query/mcp-servers`。

设置 `MCPPCM_SERVER_URL`（或 `MCPPCM_API_BASE_URL`）即可启用 CLI 的后端调用。

## 前置依赖

- Node.js `>=18`（用于 `cli/`）
- Python `>=3.11`（用于 `api/`）
- `uv`（Python 包管理/运行工具）

## 快速开始

### 1. 启动 API 服务

```bash
cd api
uv sync
uv run uvicorn main:app --reload
```

API 默认地址：`http://127.0.0.1:8000`  
健康检查：`GET /health`

### 2. 运行 CLI

```bash
cd cli
npm install
npm run dev -- --help
```

示例：

```bash
npm run dev -- add '{"mcpServers":{"my-server":{"command":"node","args":["/path/to/server"]}}}' --agent cursor
```

### 3. CLI 连接 API（可选但推荐）

```bash
export MCPPCM_SERVER_URL=http://127.0.0.1:8000
cd cli
npm run dev -- find --online my-server
```

## 关键命令

### CLI（`cli/`）

```bash
npm run dev -- <command>
npm run build
npm run type-check
npm test
npm run format:check
```

主要命令：

- `add`
- `update`
- `del`
- `list`
- `find`
- `sync`

### API（`api/`）

```bash
uv sync
uv run uvicorn main:app --reload
uv run pytest
uv run ruff check .
uv run ruff format .
```

## 环境变量

### CLI

- `MCPPCM_SERVER_URL`：后端基地址（遥测与在线查询）
- `MCPPCM_API_BASE_URL`：后端基地址备用别名
- `MCPPCM_TELEMETRY_TIMEOUT_MS`：遥测请求超时毫秒数（默认 `3000`）

### API

- `MCPPCM_HOST`（默认：`127.0.0.1`）
- `MCPPCM_PORT`（默认：`8000`）
- `MCPPCM_DATABASE_URL`（默认：`sqlite:///./data/mcpcm.db`）
- `MCPPCM_MAX_INGEST_PAYLOAD_BYTES`（默认：`65536`）

## API 端点

- `GET /health`
- `POST /v1/ingest/mcp-servers`
- `GET /v1/query/mcp-servers`

详细说明：`api/docs/api-contract.md`

## 开发说明

- 仓库级协作规范见 `AGENTS.md`。
- 模块级规范见：
  - `cli/AGENTS.md`
  - `api/AGENTS.md`
