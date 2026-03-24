# mcpcm-server (app) 使用说明

本文档说明如何在本项目中开发、运行和排错，并同步当前 v1 API 契约。

## 1. 目录与约定

- Python 项目根目录是 `app/`
- 依赖安装、服务启动、测试都在 `app/` 目录执行
- 当前导入风格：**不使用** `from app.xxx import ...`，使用 `from core.xxx import ...`、`from routers.xxx import ...` 等

## 2. 首次使用

在 `app/` 下执行：

```bash
uv sync
```

这会创建并使用虚拟环境：

- `app/.venv`

## 3. 常用命令（都在 app/ 下执行）

```bash
uv run fastapi dev --entrypoint main:app
uv run uvicorn main:app --reload
uv run pytest
uv run ruff check .
uv run ruff format .
```

## 4. 环境变量配置（.env.example）

本项目的示例环境变量文件在 `app/.env.example`。

建议先在 `app/` 目录创建本地环境文件：

```bash
cp .env.example .env
```

默认内容：

```env
MCPPCM_HOST=127.0.0.1
MCPPCM_PORT=8000
MCPPCM_DATABASE_URL=sqlite:///./data/mcpcm.db
MCPPCM_MAX_INGEST_PAYLOAD_BYTES=65536
```

注意：
- 当前配置读取基于 `os.getenv`，不会自动加载 `.env` 文件。
- 启动前可手动导出环境变量，例如：

```bash
set -a
source .env
set +a
uv run uvicorn main:app --reload
```

## 5. API 快速对照（v1）

详细文档见 `app/docs/api-contract.md`，这里给最小可用示例。

### 5.1 Ingest

- Endpoint: `POST /v1/ingest/mcp-servers`
- 请求体：

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

- `event` 字段保留，当前仅支持 `install`
- 同名 `mcp_name` 重复安装会累加 `install_count`

### 5.2 Query

- Endpoint: `GET /v1/query/mcp-servers`
- 可选查询参数：`mcp_name`（contains 匹配）
- 响应：顶层数组，每项仅包含 `mcp_name`、`raw_config`、`install_count`

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

## 6. VSCode 推荐配置

### 6.1 打开仓库根目录时（`.../mcpcm-server`）

建议在 `.vscode/settings.json`：

```json
{
  "python.defaultInterpreterPath": "${workspaceFolder}/app/.venv/bin/python",
  "python.analysis.extraPaths": ["${workspaceFolder}/app"]
}
```

### 6.2 只打开 app 目录时（`.../mcpcm-server/app`）

建议在 `app/.vscode/settings.json`：

```json
{
  "python.defaultInterpreterPath": "${workspaceFolder}/.venv/bin/python",
  "python.analysis.extraPaths": ["${workspaceFolder}"]
}
```

## 7. 常见问题

### Q1: `Import "fastapi" could not be resolved`

通常是解释器没选到 `app/.venv/bin/python`。

排查：

1. VSCode `Python: Select Interpreter`
2. 选 `.../mcpcm-server/app/.venv/bin/python`
3. `Developer: Reload Window`

### Q2: 在根目录打开和在 app 目录打开行为不一致

这是 Python 路径解析差异导致。按上面的两套 `settings.json` 配置即可。

### Q3: 运行命令报依赖问题

确认当前工作目录是 `app/`，然后重跑：

```bash
uv sync
```

## 8. 开发建议

- 新代码保持当前导入风格（不带 `app.` 前缀）
- 新测试放在 `app/tests/`
- API 契约文档以 `app/docs/api-contract.md` 为准
