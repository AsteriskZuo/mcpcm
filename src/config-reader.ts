import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { parse as parseToml } from '@iarna/toml';
import type { McpConfig, McpServerConfig, AgentType } from './types.js';
import { getAgentConfig } from './agents.js';
import { expandPath, safeParseJson, verbose as log } from './utils.js';

export interface ReadConfigResult {
  config: McpConfig | null;
  rawContent: Record<string, unknown> | null;
  path: string;
  exists: boolean;
  error?: string;
}

/**
 * Read MCP config from a file
 */
export function readConfigFile(
  filePath: string,
  format: 'json' | 'toml',
  mcpConfigKey: string | null,
  verboseMode = false
): ReadConfigResult {
  const expandedPath = expandPath(filePath);

  if (!existsSync(expandedPath)) {
    log(`Config file not found: ${expandedPath}`, verboseMode);
    return { config: null, rawContent: null, path: expandedPath, exists: false };
  }

  try {
    const content = readFileSync(expandedPath, 'utf-8');
    let parsed: Record<string, unknown>;

    if (format === 'toml') {
      parsed = parseToml(content) as Record<string, unknown>;
    } else {
      const jsonParsed = safeParseJson<Record<string, unknown>>(content);
      if (!jsonParsed) {
        return {
          config: null,
          rawContent: null,
          path: expandedPath,
          exists: true,
          error: 'Invalid JSON',
        };
      }
      parsed = jsonParsed;
    }

    // Extract mcpServers based on key
    let mcpServers: Record<string, McpServerConfig> = {};
    if (mcpConfigKey) {
      const servers = parsed[mcpConfigKey];
      if (servers && typeof servers === 'object') {
        mcpServers = servers as Record<string, McpServerConfig>;
      }
    } else {
      // Use mcpServers at root level
      if (parsed['mcpServers'] && typeof parsed['mcpServers'] === 'object') {
        mcpServers = parsed['mcpServers'] as Record<string, McpServerConfig>;
      }
    }

    log(`Read config from ${expandedPath}: ${Object.keys(mcpServers).length} servers`, verboseMode);

    return {
      config: { mcpServers },
      rawContent: parsed,
      path: expandedPath,
      exists: true,
    };
  } catch (err) {
    return {
      config: null,
      rawContent: null,
      path: expandedPath,
      exists: true,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Read agent's global config
 */
export function readGlobalConfig(agentType: AgentType, verboseMode = false): ReadConfigResult {
  const agent = getAgentConfig(agentType);

  if (!agent.globalConfigPath) {
    return {
      config: null,
      rawContent: null,
      path: '',
      exists: false,
      error: 'No global config path',
    };
  }

  return readConfigFile(
    agent.globalConfigPath,
    agent.configFormat,
    agent.mcpConfigKey,
    verboseMode
  );
}

/**
 * Read agent's project config
 */
export function readProjectConfig(
  agentType: AgentType,
  projectDir: string = process.cwd(),
  verboseMode = false
): ReadConfigResult {
  const agent = getAgentConfig(agentType);

  if (!agent.projectConfigPath) {
    return {
      config: null,
      rawContent: null,
      path: '',
      exists: false,
      error: 'No project config path',
    };
  }

  const fullPath = join(projectDir, agent.projectConfigPath);
  return readConfigFile(fullPath, agent.configFormat, agent.mcpConfigKey, verboseMode);
}

/**
 * Parse MCP config from JSON string
 */
export function parseMcpConfigString(jsonString: string): McpConfig | null {
  const parsed = safeParseJson<Record<string, unknown>>(jsonString);
  if (!parsed) return null;

  // Check for mcpServers key
  if (parsed['mcpServers'] && typeof parsed['mcpServers'] === 'object') {
    return { mcpServers: parsed['mcpServers'] as Record<string, McpServerConfig> };
  }

  // If the input is already a servers object, wrap it
  const firstValue = Object.values(parsed)[0];
  if (firstValue && typeof firstValue === 'object' && 'command' in (firstValue as object)) {
    return { mcpServers: parsed as Record<string, McpServerConfig> };
  }

  return null;
}
