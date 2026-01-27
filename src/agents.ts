import { homedir, platform } from 'os';
import { join } from 'path';
import { existsSync } from 'fs';
import type { AgentConfig, AgentType } from './types.js';

const home = homedir();
const isMac = platform() === 'darwin';
const isWindows = platform() === 'win32';

// VS Code global config path varies by OS
function getVscodeGlobalPath(): string {
  if (isMac) {
    return join(home, 'Library/Application Support/Code/User/mcp.json');
  } else if (isWindows) {
    return join(home, 'AppData/Roaming/Code/User/mcp.json');
  } else {
    return join(home, '.config/Code/User/mcp.json');
  }
}

/**
 * Agent configurations with MCP config paths
 */
export const agents: Record<AgentType, AgentConfig> = {
  cursor: {
    name: 'cursor',
    displayName: 'Cursor',
    projectConfigPath: '.cursor/mcp.json',
    globalConfigPath: join(home, '.cursor/mcp.json'),
    configFormat: 'json',
    mcpConfigKey: 'mcpServers',
    detectInstalled: async () => existsSync(join(home, '.cursor')),
  },
  'claude-code': {
    name: 'claude-code',
    displayName: 'Claude Code',
    projectConfigPath: '.mcp.json',
    globalConfigPath: join(home, '.claude.json'),
    configFormat: 'json',
    mcpConfigKey: 'mcpServers',
    detectInstalled: async () => existsSync(join(home, '.claude.json')),
  },
  antigravity: {
    name: 'antigravity',
    displayName: 'Antigravity',
    projectConfigPath: '.gemini/mcp_config.json',
    globalConfigPath: join(home, '.gemini/antigravity/mcp_config.json'),
    configFormat: 'json',
    mcpConfigKey: 'mcpServers',
    detectInstalled: async () =>
      existsSync(join(home, '.gemini/antigravity')) || existsSync(join(home, '.gemini')),
  },
  windsurf: {
    name: 'windsurf',
    displayName: 'Windsurf',
    projectConfigPath: '.windsurf/mcp_config.json',
    globalConfigPath: join(home, '.codeium/windsurf/mcp_config.json'),
    configFormat: 'json',
    mcpConfigKey: 'mcpServers',
    detectInstalled: async () => existsSync(join(home, '.codeium/windsurf')),
  },
  vscode: {
    name: 'vscode',
    displayName: 'VS Code / GitHub Copilot',
    projectConfigPath: '.vscode/mcp.json',
    globalConfigPath: getVscodeGlobalPath(),
    configFormat: 'json',
    mcpConfigKey: 'servers',
    detectInstalled: async () => {
      if (isMac) {
        return existsSync(join(home, 'Library/Application Support/Code'));
      } else if (isWindows) {
        return existsSync(join(home, 'AppData/Roaming/Code'));
      }
      return existsSync(join(home, '.config/Code'));
    },
  },
  codex: {
    name: 'codex',
    displayName: 'Codex',
    projectConfigPath: '.codex/config.toml',
    globalConfigPath: join(home, '.codex/config.toml'),
    configFormat: 'toml',
    mcpConfigKey: 'mcp_servers',
    detectInstalled: async () => existsSync(join(home, '.codex')),
  },
  opencode: {
    name: 'opencode',
    displayName: 'OpenCode',
    projectConfigPath: null,
    globalConfigPath: join(home, '.config/opencode/opencode.json'),
    configFormat: 'json',
    mcpConfigKey: 'mcpServers',
    detectInstalled: async () => existsSync(join(home, '.config/opencode')),
  },
  'gemini-cli': {
    name: 'gemini-cli',
    displayName: 'Gemini CLI',
    projectConfigPath: '.gemini/settings.json',
    globalConfigPath: join(home, '.gemini/settings.json'),
    configFormat: 'json',
    mcpConfigKey: 'mcpServers',
    detectInstalled: async () => existsSync(join(home, '.gemini')),
  },
  qoder: {
    name: 'qoder',
    displayName: 'Qoder',
    projectConfigPath: null,
    globalConfigPath: null, // Managed via qodercli
    configFormat: 'json',
    mcpConfigKey: null,
    detectInstalled: async () => false, // Cannot detect programmatically
  },
  'qwen-code': {
    name: 'qwen-code',
    displayName: 'Qwen Code',
    projectConfigPath: '.qwen/settings.json',
    globalConfigPath: join(home, '.qwen/settings.json'),
    configFormat: 'json',
    mcpConfigKey: 'mcpServers',
    detectInstalled: async () => existsSync(join(home, '.qwen')),
  },
  trae: {
    name: 'trae',
    displayName: 'Trae',
    projectConfigPath: '.trae/mcp.json',
    globalConfigPath: null,
    configFormat: 'json',
    mcpConfigKey: 'mcpServers',
    detectInstalled: async () => existsSync(join(process.cwd(), '.trae')),
  },
};

/**
 * Get all agent types
 */
export function getAllAgentTypes(): AgentType[] {
  return Object.keys(agents) as AgentType[];
}

/**
 * Detect installed agents
 */
export async function detectInstalledAgents(): Promise<AgentType[]> {
  const installed: AgentType[] = [];

  for (const [type, config] of Object.entries(agents)) {
    if (await config.detectInstalled()) {
      installed.push(type as AgentType);
    }
  }

  return installed;
}

/**
 * Get agent config by type
 */
export function getAgentConfig(type: AgentType): AgentConfig {
  return agents[type];
}

/**
 * Validate agent type
 */
export function isValidAgentType(type: string): type is AgentType {
  return type in agents;
}
