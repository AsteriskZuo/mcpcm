# MCP Configuration Manager (MCP CLI INSTALL)

## 项目背景

现有的 AI Agent 越来越多（如 Cursor、Antigravity、Claude Code 等），它们逐渐开始支持 MCP (Model Context Protocol) 以扩展能力。
然而，每个 Agent 的全局或者本地的 MCP 配置文件路径可能都各不相同。如果开发者想要在一个项目使用多种开发工具，那么需要手动维护各个 MCP 配置，这是一件麻烦的事情。

所以，本项目设计一个工具，可以将指定的 MCP 添加到多个 Agent 的全局、本地等配置中，可以和现有的配置进行合并，可以修改，可以删除。

## 命令名称

mcpm: 是 Model Context Protocol Manager 的缩写。

## 术语表

| 术语           | 说明                                                                      |
| -------------- | ------------------------------------------------------------------------- |
| **Agent**      | 支持 MCP 的 AI 编程工具，如 Cursor、Claude Code、Antigravity、Windsurf 等 |
| **MCP**        | Model Context Protocol，一种扩展 AI Agent 能力的协议                      |
| **MCP Server** | 提供特定功能的 MCP 服务端，如文件系统访问、数据库查询等                   |

## 支持哪些 Agent

以下是已调研的主流 Agent 的 MCP 配置文件路径：

<!-- available-agents:start -->

| Agent                    | `--agent`     | Project MCP Config          | Global MCP Config                                        |
| ------------------------ | ------------- | --------------------------- | -------------------------------------------------------- |
| Cursor                   | `cursor`      | `.cursor/mcp.json`          | `~/.cursor/mcp.json`                                     |
| Claude Code              | `claude-code` | `.mcp.json`                 | `~/.claude.json`                                         |
| Antigravity              | `antigravity` | `.gemini/mcp_config.json`   | `~/.gemini/antigravity/mcp_config.json`                  |
| Windsurf                 | `windsurf`    | `.windsurf/mcp_config.json` | `~/.codeium/windsurf/mcp_config.json`                    |
| VS Code / GitHub Copilot | `vscode`      | `.vscode/mcp.json`          | `~/Library/Application Support/Code/User/mcp.json` (Mac) |
| Codex                    | `codex`       | `.codex/config.toml`        | `~/.codex/config.toml`                                   |
| OpenCode                 | `opencode`    | -                           | `~/.config/opencode/opencode.json`                       |
| Gemini CLI               | `gemini-cli`  | `.gemini/settings.json`     | `~/.gemini/settings.json`                                |
| Qoder                    | `qoder`       | -                           | IDE 内置设置（通过 UI 或 `qodercli mcp add` 管理）       |
| Qwen Code                | `qwen-code`   | `.qwen/settings.json`       | `~/.qwen/settings.json`                                  |
| Trae                     | `trae`        | `.trae/mcp.json`            | -                                                        |

> **注意**:
>
> - Claude Code 使用 `~/.claude.json` 存储 MCP 配置（注意不是 `~/.claude/` 目录下）
> - 部分 VSCode 扩展（如 Cline、Roo Code）的配置存储在 VSCode 的 `globalStorage` 中
> - 某些 Agent 尚未官方支持项目级 MCP 配置（标记为 `-`）

<!-- available-agents:end -->

## 支持的命令

参考 SKILL 工具命令帮助

```bash
npx skills --help

Usage: skills <command> [options]

Commands:
  find [query]      Search for skills interactively
  init [name]       Initialize a skill (creates <name>/SKILL.md or ./SKILL.md)
  add <package>     Add a skill package
                    e.g. vercel-labs/agent-skills
                         https://github.com/vercel-labs/agent-skills
  check             Check for available skill updates
  update            Update all skills to latest versions
  generate-lock     Generate lock file from installed skills

Add Options:
  -g, --global           Install skill globally (user-level) instead of project-level
  -a, --agent <agents>   Specify agents to install to
  -s, --skill <skills>   Specify skill names to install (skip selection prompt)
  -l, --list             List available skills in the repository without installing
  -y, --yes              Skip confirmation prompts
  --all                  Install all skills to all agents without any prompts

Options:
  --help, -h        Show this help message
  --version, -v     Show version number
  --dry-run         Preview changes without writing (generate-lock)

Examples:
  $ skills find                     # interactive search
  $ skills find typescript          # search by keyword
  $ skills find "react testing"    # search by phrase
  $ skills init my-skill
  $ skills add vercel-labs/agent-skills
  $ skills add vercel-labs/agent-skills -g
  $ skills add vercel-labs/agent-skills --agent claude-code cursor
  $ skills add vercel-labs/agent-skills --skill pr-review commit
  $ skills check
  $ skills update
  $ skills generate-lock --dry-run

Discover more skills at https://skills.sh/
```

我们的命令工具支持:

Commands:

- add: 添加一个 mcp 配置
  - 支持 字符串输入（JSON 字符串）
  - 支持 文件输入（--file mcp.json）
- update: 修改一个 mcp 配置
  - 支持 字符串输入（JSON 字符串）
  - 支持 文件输入（--file mcp.json）
- del: 删除一个 mcp 配置
- find: 可以查找指定的 MCP Server 是否存在，如果存在列出存在的位置
- list: 列出所有已安装 Agent 的 MCP 配置
- sync: 同步指定 Agent 的 MCP 配置到其他 Agent

add / update / del / list command options:

- global: 所有已安装 Agent 的配置
- agent: 指定 Agent 的配置
- workspace: 指定项目的配置

Options:

- help: 帮助命令
- version: 版本号
- verbose: 冗余输出

add 命令 支持 --replace 命令，默认是 merge 模式

## 使用方法

### add 命令

```bash
# 直接输入 JSON 字符串的方式添加到指定 Agent
npx mcpm add '{
  "mcpServers": {
    "easeim": {
      "command": "node",
      "args": ["/path/to/easeim-mcp-server/dist/index.js"]
    }
  }
}' --agent claude-code cursor

# 指定配置文件的方式添加到全局
npx mcpm add --file "mcp.json" --global

# 添加到当前项目（workspace）
npx mcpm add --file "mcp.json" --workspace

# 使用 --replace 模式（替换而非合并）
npx mcpm add --file "mcp.json" --agent cursor --replace
```

### update 命令

```bash
# 更新指定 MCP Server 的配置
npx mcpm update '{
  "mcpServers": {
    "easeim": {
      "command": "node",
      "args": ["/new/path/to/index.js"]
    }
  }
}' --agent claude-code

# 从文件更新配置
npx mcpm update --file "mcp.json" --global
```

### del 命令

```bash
# 从指定 Agent 删除某个 MCP Server
npx mcpm del easeim --agent cursor

# 从所有 Agent 删除某个 MCP Server
npx mcpm del easeim --global

# 从当前项目配置中删除
npx mcpm del easeim --workspace
```

### find 命令

```bash
# 查找某个 MCP Server 是否存在
npx mcpm find easeim

# 输出示例:
# ✓ easeim found in:
#   - cursor (global): ~/.cursor/mcp.json
#   - claude-code (project): .mcp.json
```

### list 命令

```bash
# 列出所有已安装 Agent 的 MCP 配置
npx mcpm list

# 列出指定 Agent 的配置
npx mcpm list --agent cursor

# 列出全局配置
npx mcpm list --global

# 列出当前项目的配置
npx mcpm list --workspace

# 详细输出模式
npx mcpm list --verbose
```

### sync 命令

```bash
# 同步一个 Agent 的配置到另一个
npx mcpm sync --from cursor --to antigravity

# 同步到多个 Agent
npx mcpm sync --from cursor --to antigravity claude-code windsurf

# 同步到所有已安装的 Agent
npx mcpm sync --from cursor --to-all
```

### 其他选项

```bash
# 查看帮助
npx mcpm --help
npx mcpm add --help

# 查看版本
npx mcpm --version

# 详细输出模式（调试用）
npx mcpm list --verbose
```

## 配置优先级

项目 > 编辑器 > 全局
