# mcpcm-server (API)

[English](README.md) | [简体中文](README.zh-CN.md)

`mcpcm` 的 FastAPI 后端服务，提供采集与查询能力。

## 概览

该服务提供：
- `POST /v1/ingest/mcp-servers`：接收 CLI 上报的安装事件
- `GET /v1/query/mcp-servers`：查询已存储的 MCP 记录
- `GET /health`：健康检查

数据存储使用 SQLite（`MCPPCM_DATABASE_URL`），并在启动时自动初始化表结构。

## 项目结构

- `main.py`：应用创建、生命周期管理、路由挂载
- `routers/`：HTTP 接口（`health`、`ingest`、`query`）
- `services/`：业务逻辑层
- `repositories/`：数据访问层
- `schemas/`：请求/响应模型
- `db/`：数据库连接与建表逻辑
- `tests/`：API、服务、集成测试

## 前置依赖

- Python `>=3.11`
- `uv`

## 快速开始

所有命令都在 `api/` 目录下执行：

```bash
cd api
uv sync
uv run uvicorn main:app --reload
```

默认地址：`http://127.0.0.1:8000`

## 常用命令

```bash
uv sync
uv run uvicorn main:app --reload
uv run pytest
uv run ruff check .
uv run ruff format .
```

## 环境变量

先从模板创建本地环境文件：

```bash
cd api
cp .env.example .env
```

当前配置通过 `os.getenv` 读取（应用不会自动加载 `.env`）。
如有需要，启动前手动导出：

```bash
set -a
source .env
set +a
uv run uvicorn main:app --reload
```

支持的环境变量：

- `MCPPCM_HOST`（默认：`127.0.0.1`）
- `MCPPCM_PORT`（默认：`8000`）
- `MCPPCM_DATABASE_URL`（默认：`sqlite:///./data/mcpcm.db`）
- `MCPPCM_MAX_INGEST_PAYLOAD_BYTES`（默认：`65536`）

## API 契约（v1）

详细文档：`docs/api-contract.md`

### Ingest

- 接口：`POST /v1/ingest/mcp-servers`
- 请求体示例：

```json
{
  "mcp_name": "my_mcp_server",
  "raw_config": "{\"mcpServers\":{\"my_mcp_server\":{}}}",
  "agents": "cursor,claude",
  "event": "install",
  "global": false
}
```

说明：
- `event` 当前只支持 `install`
- 同一个 `mcp_name` 重复安装会累加 `install_count`

### Query

- 接口：`GET /v1/query/mcp-servers`
- 可选查询参数：`mcp_name`（contains 匹配）
- 响应示例：

```json
[
  {
    "mcp_name": "my_mcp_server",
    "raw_config": "{\"mcpServers\":{\"my_mcp_server\":{}}}",
    "install_count": 3
  }
]
```

无匹配时返回：

```json
[]
```

## VS Code 配置建议

如果你打开的是仓库根目录（`.../mcpcm`），推荐：

```json
{
  "python.defaultInterpreterPath": "${workspaceFolder}/api/.venv/bin/python",
  "python.analysis.extraPaths": ["${workspaceFolder}/api"]
}
```

如果你只打开 `api/`，推荐：

```json
{
  "python.defaultInterpreterPath": "${workspaceFolder}/.venv/bin/python",
  "python.analysis.extraPaths": ["${workspaceFolder}"]
}
```

## 常见问题

### `Import "fastapi" could not be resolved`

通常是 Python 解释器没有选到 `api/.venv/bin/python`。

### 命令报缺少依赖

确认当前目录是 `api/`，然后执行：

```bash
uv sync
```

## 开发建议

- 保持当前导入风格（不加 `api.` 前缀）
- 新测试放在 `tests/`
- API 行为与 `docs/api-contract.md` 保持一致
