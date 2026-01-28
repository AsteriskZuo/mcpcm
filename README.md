# mcpm

MCP Configuration Manager - Manage MCP configurations across AI Agents.

<!-- agent-list:start -->

Supports **Cursor**, **Claude Code**, **Antigravity**, **Windsurf**, **VS Code**, and [6 more](#supported-agents).

<!-- agent-list:end -->

## Installation

```bash
# Use directly with npx (no install required)
npx mcpm --help

# Or install globally
npm install -g @asteriskzuo/mcpm
```

## Quick Start

```bash
# Add MCP server to specific agent
npx mcpm add '{"mcpServers":{"my-server":{"command":"node","args":["/path/to/server"]}}}' --agent cursor

# Add from file to all installed agents
npx mcpm add --file mcp.json --global

# List all configured MCP servers
npx mcpm list
```

## Commands

| Command       | Description                                          |
| ------------- | ---------------------------------------------------- |
| `mcpm add`    | Add **new** MCP servers (skips existing)             |
| `mcpm update` | Update **existing** MCP servers (skips non-existing) |
| `mcpm del`    | Delete MCP servers (skips non-existing)              |
| `mcpm list`   | List all MCP configurations                          |
| `mcpm find`   | Find where an MCP server is configured               |
| `mcpm sync`   | Full sync from one agent to others (overwrites)      |

## Common Options

These options are shared across multiple commands:

| Option                    | Applies to             | Description                                     |
| ------------------------- | ---------------------- | ----------------------------------------------- |
| `-a, --agent <agents...>` | add, update, del, list | Target specific agent(s)                        |
| `-g, --global`            | add, update, del, list | Apply to global configs of all installed agents |
| `-w, --workspace`         | add, update, del, list | Apply to project-level configs                  |
| `-f, --file <path>`       | add, update            | Read config from file instead of JSON string    |
| `-v, --verbose`           | all                    | Show detailed output                            |

> [!TIP]
> You must specify one of `--agent`, `--global`, or `--workspace` to indicate where to apply the operation.

## Add Command

Add **new** MCP servers to agent configurations.

```bash
# From JSON string
npx mcpm add '{"mcpServers":{"easeim":{"command":"node","args":["/path/to/index.js"]}}}' --agent cursor

# From file to all installed agents
npx mcpm add --file mcp.json --global

# To current project
npx mcpm add --file mcp.json --workspace
```

> [!NOTE]
> If a server already exists, it will be **skipped** (not overwritten).
> Use `mcpm update` to modify existing servers.

## Update Command

Update existing MCP server configurations.

```bash
# Update specific server in an agent
npx mcpm update '{"mcpServers":{"my-server":{"args":["/new/path"]}}}' --agent cursor

# Update from file
npx mcpm update --file mcp.json --global
```

> [!NOTE]
> Only **existing** servers will be updated. Non-existing servers are skipped.
> Use `mcpm add` to add new servers.

## Delete Command

Delete MCP servers from configurations.

```bash
# From specific agent
npx mcpm del my-server --agent cursor

# From all agents
npx mcpm del my-server --global

# From project configs
npx mcpm del my-server --workspace
```

> [!NOTE]
> Only **existing** servers will be deleted. Non-existing servers are skipped with a warning.

## List Command

List all configured MCP servers.

```bash
# All configs
npx mcpm list

# Specific agent
npx mcpm list --agent cursor

# Global configs only
npx mcpm list --global

# Project configs only
npx mcpm list --workspace
```

## Find Command

Search for an MCP server across all configurations.

```bash
npx mcpm find easeim

# Output:
# ✓ easeim found in:
#   Cursor (global): ~/.cursor/mcp.json
#   Claude Code (project): .mcp.json
```

## Sync Command

Synchronize MCP configurations from one agent to others.

```bash
# Sync to specific agents
npx mcpm sync --from cursor --to antigravity claude-code

# Sync to all installed agents
npx mcpm sync --from cursor --to-all
```

> [!IMPORTANT]
> Sync performs a **full synchronization**: existing servers are **overwritten**, and new servers are added.
> This is different from `add` which skips existing servers.

## Supported Agents

<!-- available-agents:start -->

| Agent                    | `--agent`     | Project Config              | Global Config                                      |
| ------------------------ | ------------- | --------------------------- | -------------------------------------------------- |
| Cursor                   | `cursor`      | `.cursor/mcp.json`          | `~/.cursor/mcp.json`                               |
| Claude Code              | `claude-code` | `.mcp.json`                 | `~/.claude.json`                                   |
| Antigravity              | `antigravity` | `.gemini/mcp_config.json`   | `~/.gemini/antigravity/mcp_config.json`            |
| Windsurf                 | `windsurf`    | `.windsurf/mcp_config.json` | `~/.codeium/windsurf/mcp_config.json`              |
| VS Code / GitHub Copilot | `vscode`      | `.vscode/mcp.json`          | `~/Library/Application Support/Code/User/mcp.json` |
| Codex                    | `codex`       | `.codex/config.toml`        | `~/.codex/config.toml`                             |
| OpenCode                 | `opencode`    | -                           | `~/.config/opencode/opencode.json`                 |
| Gemini CLI               | `gemini-cli`  | `.gemini/settings.json`     | `~/.gemini/settings.json`                          |
| Qoder                    | `qoder`       | -                           | (managed via `qodercli`)                           |
| Qwen Code                | `qwen-code`   | `.qwen/settings.json`       | `~/.qwen/settings.json`                            |
| Trae                     | `trae`        | `.trae/mcp.json`            | -                                                  |

<!-- available-agents:end -->

> [!NOTE]
>
> - Claude Code uses `~/.claude.json` (not `~/.claude/` directory) for global config
> - VS Code path varies by OS (shown above is macOS)
> - Some agents don't support project-level or global configs (marked with `-`)

## MCP Configuration Format

```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["/path/to/server/index.js"],
      "env": {
        "API_KEY": "your-api-key"
      }
    }
  }
}
```

## Examples

### Add multiple servers from file

Create `mcp.json`:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/dir"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "your-token"
      }
    }
  }
}
```

Then:

```bash
# Add to all installed agents
npx mcpm add --file mcp.json --global

# Or add to current project for team sharing
npx mcpm add --file mcp.json --workspace
```

### Sync development environment

```bash
# Set up Cursor with all your MCP servers
# Then sync to other agents
npx mcpm sync --from cursor --to-all
```

## Configuration Priority

When agents have multiple config sources:

**Project > Editor > Global**

Project configs take precedence over global configs.

## Recommended .gitignore

If you're using `mcpm` in a project, add the following to your `.gitignore` to exclude agent config directories created during testing:

```gitignore
# MCP Configuration files (created during testing)
.cursor/
.mcp.json
.gemini/
.windsurf/
.vscode/
.codex/
.qwen/
.trae/
```

## Troubleshooting

### "No installed agents detected"

The CLI auto-detects installed agents by checking for config directories. If none are found:

- Ensure at least one supported agent is installed
- Use `--agent` to explicitly specify target agents

### Config not taking effect

- Restart the AI agent after modifying configs
- Check the config file format (JSON vs TOML for Codex)
- Verify the `command` path is correct and executable

### Permission errors

Ensure you have write access to the config directory.

## Custom Agent Configuration

You can add or modify AI Agent configurations by editing the `agents` object in the installed CLI file.

### Locate the CLI File

```bash
# Find the global installation path
npm root -g
# Then edit: <npm_root>/@asteriskzuo/mcpm/dist/cli.js
```

### Modify the `agents` Object

Open `dist/cli.js` and locate the `agents` object (around line 27). Add or modify agent entries:

```javascript
var agents = {
  // ... existing agents ...

  // Add your custom agent:
  'my-agent': {
    name: 'my-agent',
    displayName: 'My Custom Agent',
    projectConfigPath: '.my-agent/mcp.json', // or null if not supported
    globalConfigPath: join(home, '.my-agent/mcp.json'),
    configFormat: 'json', // 'json' or 'toml'
    mcpConfigKey: 'mcpServers', // key in config file
    detectInstalled: async () => existsSync(join(home, '.my-agent')),
  },
};
```

### Configuration Fields

| Field               | Description                                           |
| ------------------- | ----------------------------------------------------- |
| `name`              | Agent identifier (used in `--agent` option)           |
| `displayName`       | Human-readable name shown in output                   |
| `projectConfigPath` | Relative path for project config (or `null`)          |
| `globalConfigPath`  | Absolute path for global config (or `null`)           |
| `configFormat`      | Config file format: `'json'` or `'toml'`              |
| `mcpConfigKey`      | Key for MCP servers in config (e.g., `'mcpServers'`)  |
| `detectInstalled`   | Async function returning `true` if agent is installed |

> [!NOTE]
> Changes take effect immediately. No rebuild required.

> [!WARNING]
> Reinstalling or updating the package will overwrite your changes.

> [!TIP]
> If you find this method cumbersome, consider [submitting a PR](https://github.com/AsteriskZuo/mcpm/pulls) to add official support for your agent!

## License

MIT
