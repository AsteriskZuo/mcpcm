/**
 * Supported AI Agent identifiers
 */
export type AgentType =
  | 'cursor'
  | 'claude-code'
  | 'antigravity'
  | 'windsurf'
  | 'vscode'
  | 'codex'
  | 'opencode'
  | 'gemini-cli'
  | 'qoder'
  | 'qwen-code'
  | 'trae';

/**
 * MCP Server configuration
 */
export interface McpServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  [key: string]: unknown;
}

/**
 * MCP configuration file structure
 */
export interface McpConfig {
  mcpServers: Record<string, McpServerConfig>;
}

/**
 * Agent configuration with paths and detection
 */
export interface AgentConfig {
  name: AgentType;
  displayName: string;
  /** Relative path for project-level config */
  projectConfigPath: string | null;
  /** Absolute path for global config */
  globalConfigPath: string | null;
  /** Config file format */
  configFormat: 'json' | 'toml';
  /** Key path for nested MCP config (e.g., 'mcpServers' or null if at root) */
  mcpConfigKey: string | null;
  /** Detect if agent is installed */
  detectInstalled: () => Promise<boolean>;
}

/**
 * Scope for config operations
 */
export type ConfigScope = 'global' | 'workspace' | 'agent';

/**
 * Options for add/update commands
 */
export interface AddOptions {
  agents?: AgentType[];
  global?: boolean;
  workspace?: boolean;
  replace?: boolean;
  file?: string;
  verbose?: boolean;
}

/**
 * Options for del command
 */
export interface DelOptions {
  agents?: AgentType[];
  global?: boolean;
  workspace?: boolean;
  verbose?: boolean;
}

/**
 * Options for list command
 */
export interface ListOptions {
  agents?: AgentType[];
  global?: boolean;
  workspace?: boolean;
  verbose?: boolean;
}

/**
 * Options for sync command
 */
export interface SyncOptions {
  from: AgentType;
  to?: AgentType[];
  toAll?: boolean;
  verbose?: boolean;
}

/**
 * Result of finding an MCP server
 */
export interface FindResult {
  agent: AgentType;
  scope: 'global' | 'project';
  path: string;
  config: McpServerConfig;
}
