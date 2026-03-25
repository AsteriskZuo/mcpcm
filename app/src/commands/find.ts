import type { FindResult, AgentType } from '../types.js';
import { agents, getAllAgentTypes } from '../agents.js';
import { readGlobalConfig, readProjectConfig } from '../config-reader.js';
import { resolveTelemetryBaseUrl } from '../telemetry.js';
import { info, warn, RESET, BOLD, DIM, CYAN, GREEN } from '../utils.js';

const FIND_ONLINE_USAGE = 'mcpcm find --online <keyword>';
const FIND_LOCAL_USAGE = 'mcpcm find <server-name>';

export type FindMode = 'local' | 'online';

export interface ParsedFindArgs {
  mode: FindMode;
  keyword: string;
  verbose: boolean;
}

export interface ParsedFindArgsError {
  error: string;
}

export interface OnlineFindOptions {
  baseUrl?: string | null;
  fetchImpl?: typeof fetch;
  env?: NodeJS.ProcessEnv;
}

export interface OnlineFindResponse {
  ok: boolean;
  status?: number;
  data?: unknown;
  error?: string;
  warning?: string;
}

function parseRawConfigForDisplay(rawConfig: unknown): unknown {
  if (typeof rawConfig !== 'string') {
    return rawConfig;
  }

  try {
    return JSON.parse(rawConfig) as unknown;
  } catch {
    return rawConfig;
  }
}

function normalizeOnlineFindDataForDisplay(data: unknown): unknown {
  if (!Array.isArray(data)) {
    return data;
  }

  return data.map((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return item;
    }

    const record = item as Record<string, unknown>;
    if (!('raw_config' in record)) {
      return record;
    }

    return {
      ...record,
      raw_config: parseRawConfigForDisplay(record.raw_config),
    };
  });
}

export function parseFindArgs(args: string[]): ParsedFindArgs | ParsedFindArgsError {
  const hasOnline = args.includes('--online');
  if (hasOnline) {
    if (args[0] !== '--online') {
      return {
        error: `Online mode only supports: ${FIND_ONLINE_USAGE}`,
      };
    }

    if (args.length !== 2 || !args[1] || args[1].startsWith('-')) {
      return {
        error: `Usage: ${FIND_ONLINE_USAGE}`,
      };
    }

    return {
      mode: 'online',
      keyword: args[1],
      verbose: false,
    };
  }

  const verbose = args.includes('--verbose') || args.includes('-v');
  const positionalArgs = args.filter((arg) => !arg.startsWith('-'));
  const keyword = positionalArgs[0];

  if (!keyword) {
    return {
      error: `Usage: ${FIND_LOCAL_USAGE}`,
    };
  }

  return {
    mode: 'local',
    keyword,
    verbose,
  };
}

function buildFindQueryUrl(baseUrl: string, keyword: string): string {
  const encodedKeyword = encodeURIComponent(keyword);
  return `${baseUrl}/v1/query/mcp-servers?mcp_name=${encodedKeyword}`;
}

export async function queryFindOnline(
  keyword: string,
  options: OnlineFindOptions = {}
): Promise<OnlineFindResponse> {
  const env = options.env ?? process.env;
  const baseUrl = options.baseUrl ?? resolveTelemetryBaseUrl(env);

  if (!baseUrl) {
    return {
      ok: false,
      warning: 'Online query failed: MCPPCM_SERVER_URL is not configured.',
    };
  }

  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  if (!fetchImpl) {
    return {
      ok: false,
      warning: 'Online query failed: Fetch API is not available.',
    };
  }

  try {
    const response = await fetchImpl(buildFindQueryUrl(baseUrl, keyword), {
      method: 'GET',
    });
    const text = await response.text();

    if (response.status !== 200) {
      return {
        ok: false,
        status: response.status,
        error: text,
      };
    }

    try {
      return {
        ok: true,
        status: 200,
        data: text ? (JSON.parse(text) as unknown) : [],
      };
    } catch {
      return {
        ok: false,
        status: 200,
        error: `Invalid JSON response: ${text}`,
      };
    }
  } catch (err) {
    return {
      ok: false,
      warning:
        err instanceof Error ? `Online query request failed: ${err.message}` : 'Online query failed',
    };
  }
}

async function runFindOnline(keyword: string): Promise<void> {
  console.log(`\n${DIM}Searching online for "${keyword}"...${RESET}\n`);

  const onlineResult = await queryFindOnline(keyword);

  if (onlineResult.ok) {
    const normalizedData = normalizeOnlineFindDataForDisplay(onlineResult.data ?? []);
    console.log(JSON.stringify(normalizedData, null, 2));
    console.log();
    return;
  }

  if (onlineResult.status !== undefined) {
    console.log(`HTTP ${onlineResult.status}`);
    console.log(onlineResult.error || '');
    console.log();
    return;
  }

  warn(onlineResult.warning || onlineResult.error || 'Online query failed');
}

/**
 * Execute find command
 */
export async function runFind(args: string[]): Promise<void> {
  const parsedArgs = parseFindArgs(args);
  if ('error' in parsedArgs) {
    info(parsedArgs.error);
    console.log(`\n${DIM}Examples:${RESET}`);
    console.log(`  ${FIND_LOCAL_USAGE}`);
    console.log(`  ${FIND_ONLINE_USAGE}`);
    return;
  }

  if (parsedArgs.mode === 'online') {
    await runFindOnline(parsedArgs.keyword);
    return;
  }

  const serverName = parsedArgs.keyword;
  const verbose = parsedArgs.verbose;
  console.log(`\n${DIM}Searching for "${serverName}"...${RESET}\n`);

  const results: FindResult[] = [];

  for (const agentType of getAllAgentTypes()) {
    const agent = agents[agentType];

    // Check global config
    if (agent.globalConfigPath) {
      const globalConfig = readGlobalConfig(agentType, verbose);
      if (globalConfig.config?.mcpServers[serverName]) {
        results.push({
          agent: agentType,
          scope: 'global',
          path: globalConfig.path,
          config: globalConfig.config.mcpServers[serverName],
        });
      }
    }

    // Check project config
    if (agent.projectConfigPath) {
      const projectConfig = readProjectConfig(agentType, process.cwd(), verbose);
      if (projectConfig.config?.mcpServers[serverName]) {
        results.push({
          agent: agentType,
          scope: 'project',
          path: projectConfig.path,
          config: projectConfig.config.mcpServers[serverName],
        });
      }
    }
  }

  if (results.length === 0) {
    info(`"${serverName}" not found in any MCP configuration`);
    return;
  }

  console.log(`${GREEN}✓${RESET} ${BOLD}${serverName}${RESET} found in:\n`);

  for (const result of results) {
    const agent = agents[result.agent];
    const scopeLabel = result.scope === 'global' ? 'global' : 'project';
    console.log(
      `  ${CYAN}${agent.displayName}${RESET} (${scopeLabel}): ${DIM}${result.path}${RESET}`
    );

    if (verbose) {
      const config = result.config;
      console.log(`    ${DIM}command:${RESET} ${config.command}`);
      if (config.args && config.args.length > 0) {
        console.log(`    ${DIM}args:${RESET} ${config.args.join(' ')}`);
      }
      if (config.env) {
        console.log(`    ${DIM}env:${RESET} ${JSON.stringify(config.env)}`);
      }
    }
  }

  console.log();
}
