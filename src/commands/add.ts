import { readFileSync } from 'fs';
import type { McpConfig, AgentType, AddOptions } from '../types.js';
import { agents, getAllAgentTypes, detectInstalledAgents, isValidAgentType } from '../agents.js';
import { readGlobalConfig, readProjectConfig, parseMcpConfigString } from '../config-reader.js';
import { writeGlobalConfig, writeProjectConfig, mergeMcpConfigs } from '../config-writer.js';
import { success, error, warn, info, verbose, RESET, BOLD, DIM, TEXT, CYAN } from '../utils.js';

/**
 * Parse add command options
 */
export function parseAddOptions(args: string[]): { input: string | null; options: AddOptions } {
  const options: AddOptions = {};
  let input: string | null = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--agent' || arg === '-a') {
      options.agents = [];
      // Collect all agent names until next flag
      while (i + 1 < args.length && !args[i + 1]?.startsWith('-')) {
        i++;
        const agentName = args[i];
        if (agentName && isValidAgentType(agentName)) {
          options.agents.push(agentName);
        } else if (agentName) {
          warn(`Unknown agent: ${agentName}`);
        }
      }
    } else if (arg === '--global' || arg === '-g') {
      options.global = true;
    } else if (arg === '--workspace' || arg === '-w') {
      options.workspace = true;
    } else if (arg === '--replace' || arg === '-r') {
      options.replace = true;
    } else if (arg === '--file' || arg === '-f') {
      options.file = args[++i];
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (!arg?.startsWith('-') && !input) {
      input = arg ?? null;
    }
  }

  return { input, options };
}

/**
 * Execute add command
 */
export async function runAdd(input: string | null, options: AddOptions): Promise<void> {
  verbose('Running add command', options.verbose ?? false);

  // Parse MCP config from input
  let mcpConfig: McpConfig | null = null;

  if (options.file) {
    // Read from file
    try {
      const content = readFileSync(options.file, 'utf-8');
      mcpConfig = parseMcpConfigString(content);
      if (!mcpConfig) {
        error(`Invalid MCP config in file: ${options.file}`);
        return;
      }
      verbose(`Read config from file: ${options.file}`, options.verbose ?? false);
    } catch (err) {
      error(`Failed to read file: ${options.file}`);
      return;
    }
  } else if (input) {
    // Parse JSON string
    mcpConfig = parseMcpConfigString(input);
    if (!mcpConfig) {
      error('Invalid MCP config JSON');
      return;
    }
  } else {
    error('No MCP config provided. Use JSON string or --file option.');
    console.log(`\n${DIM}Example:${RESET}`);
    console.log(
      `  mcpm add '{"mcpServers":{"my-server":{"command":"node","args":["/path/to/server.js"]}}}' --agent cursor`
    );
    console.log(`  mcpm add --file mcp.json --global`);
    return;
  }

  const serverNames = Object.keys(mcpConfig.mcpServers);
  info(`Adding ${serverNames.length} MCP server(s): ${serverNames.join(', ')}`);

  // Determine target agents
  let targetAgents: AgentType[] = [];

  if (options.agents && options.agents.length > 0) {
    targetAgents = options.agents;
  } else if (options.global) {
    targetAgents = await detectInstalledAgents();
    if (targetAgents.length === 0) {
      warn('No installed agents detected. Specify agents with --agent.');
      return;
    }
  } else if (options.workspace) {
    // For workspace, we apply to all agents that have project config support
    targetAgents = getAllAgentTypes().filter((t) => agents[t].projectConfigPath !== null);
  } else {
    error('Specify target with --agent, --global, or --workspace');
    return;
  }

  verbose(`Target agents: ${targetAgents.join(', ')}`, options.verbose ?? false);

  // Apply config to each agent
  let successCount = 0;
  let failCount = 0;

  for (const agentType of targetAgents) {
    const agent = agents[agentType];

    if (options.workspace) {
      // Write to project config
      if (!agent.projectConfigPath) {
        verbose(`${agent.displayName} doesn't support project config`, options.verbose ?? false);
        continue;
      }

      const existing = readProjectConfig(agentType, process.cwd(), options.verbose);
      const merged = mergeMcpConfigs(
        existing.config || { mcpServers: {} },
        mcpConfig,
        options.replace
      );

      const result = writeProjectConfig(
        agentType,
        merged,
        existing.rawContent,
        process.cwd(),
        options.verbose
      );
      if (result.success) {
        success(`${agent.displayName}: ${result.path}`);
        successCount++;
      } else {
        error(`${agent.displayName}: ${result.error}`);
        failCount++;
      }
    } else {
      // Write to global config
      if (!agent.globalConfigPath) {
        verbose(`${agent.displayName} doesn't support global config`, options.verbose ?? false);
        continue;
      }

      const existing = readGlobalConfig(agentType, options.verbose);
      const merged = mergeMcpConfigs(
        existing.config || { mcpServers: {} },
        mcpConfig,
        options.replace
      );

      const result = writeGlobalConfig(agentType, merged, existing.rawContent, options.verbose);
      if (result.success) {
        success(`${agent.displayName}: ${result.path}`);
        successCount++;
      } else {
        error(`${agent.displayName}: ${result.error}`);
        failCount++;
      }
    }
  }

  console.log();
  if (successCount > 0) {
    success(`Added to ${successCount} agent(s)`);
  }
  if (failCount > 0) {
    error(`Failed for ${failCount} agent(s)`);
  }
}
