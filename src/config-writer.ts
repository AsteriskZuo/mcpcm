import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { parse as parseToml, stringify as stringifyToml } from '@iarna/toml';
import type { McpConfig, McpServerConfig, AgentType } from './types.js';
import { getAgentConfig } from './agents.js';
import { ensureDir, expandPath, safeParseJson, verbose as log } from './utils.js';

export interface WriteConfigResult {
  success: boolean;
  path: string;
  error?: string;
}

/**
 * Merge two MCP configs
 * @param existing Existing config
 * @param incoming New config to add
 * @param replace If true, replace matching servers; if false, merge
 */
export function mergeMcpConfigs(
  existing: McpConfig,
  incoming: McpConfig,
  replace = false
): McpConfig {
  if (replace) {
    return {
      mcpServers: {
        ...existing.mcpServers,
        ...incoming.mcpServers,
      },
    };
  }

  // Deep merge: for each incoming server, merge with existing
  const merged: Record<string, McpServerConfig> = { ...existing.mcpServers };
  for (const [name, config] of Object.entries(incoming.mcpServers)) {
    if (merged[name]) {
      // Merge with existing
      merged[name] = { ...merged[name], ...config };
    } else {
      merged[name] = config;
    }
  }

  return { mcpServers: merged };
}

/**
 * Remove servers from config
 */
export function removeServersFromConfig(config: McpConfig, serverNames: string[]): McpConfig {
  const filtered = { ...config.mcpServers };
  for (const name of serverNames) {
    delete filtered[name];
  }
  return { mcpServers: filtered };
}

/**
 * Write MCP config to a file
 */
export function writeConfigFile(
  filePath: string,
  config: McpConfig,
  format: 'json' | 'toml',
  mcpConfigKey: string | null,
  existingContent: Record<string, unknown> | null = null,
  verboseMode = false
): WriteConfigResult {
  const expandedPath = expandPath(filePath);

  try {
    ensureDir(expandedPath);

    let content: Record<string, unknown>;

    if (existingContent) {
      content = { ...existingContent };
    } else if (existsSync(expandedPath)) {
      // Read existing content to preserve other settings
      const existing = readFileSync(expandedPath, 'utf-8');
      if (format === 'toml') {
        content = parseToml(existing) as Record<string, unknown>;
      } else {
        content = safeParseJson<Record<string, unknown>>(existing) || {};
      }
    } else {
      content = {};
    }

    // Set mcpServers in the right location
    const key = mcpConfigKey || 'mcpServers';
    content[key] = config.mcpServers;

    // Write file
    let output: string;
    if (format === 'toml') {
      output = stringifyToml(content as any);
    } else {
      output = JSON.stringify(content, null, 2);
    }

    writeFileSync(expandedPath, output, 'utf-8');
    log(`Wrote config to ${expandedPath}`, verboseMode);

    return { success: true, path: expandedPath };
  } catch (err) {
    return {
      success: false,
      path: expandedPath,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Write to agent's global config
 */
export function writeGlobalConfig(
  agentType: AgentType,
  config: McpConfig,
  existingContent: Record<string, unknown> | null = null,
  verboseMode = false
): WriteConfigResult {
  const agent = getAgentConfig(agentType);

  if (!agent.globalConfigPath) {
    return { success: false, path: '', error: 'No global config path' };
  }

  return writeConfigFile(
    agent.globalConfigPath,
    config,
    agent.configFormat,
    agent.mcpConfigKey,
    existingContent,
    verboseMode
  );
}

/**
 * Write to agent's project config
 */
export function writeProjectConfig(
  agentType: AgentType,
  config: McpConfig,
  existingContent: Record<string, unknown> | null = null,
  projectDir: string = process.cwd(),
  verboseMode = false
): WriteConfigResult {
  const agent = getAgentConfig(agentType);

  if (!agent.projectConfigPath) {
    return { success: false, path: '', error: 'No project config path' };
  }

  const fullPath = join(projectDir, agent.projectConfigPath);
  return writeConfigFile(
    fullPath,
    config,
    agent.configFormat,
    agent.mcpConfigKey,
    existingContent,
    verboseMode
  );
}
