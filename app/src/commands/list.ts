import type { AgentType, ListOptions } from '../types.js';
import { agents, getAllAgentTypes, detectInstalledAgents, isValidAgentType } from '../agents.js';
import { readGlobalConfig, readProjectConfig } from '../config-reader.js';
import { info, warn, formatServerConfig, RESET, BOLD, DIM, TEXT, CYAN, GREEN } from '../utils.js';

/**
 * Parse list command options
 */
export function parseListOptions(args: string[]): ListOptions {
  const options: ListOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--agent' || arg === '-a') {
      options.agents = [];
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
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    }
  }

  return options;
}

/**
 * Execute list command
 */
export async function runList(options: ListOptions): Promise<void> {
  // Determine target agents
  let targetAgents: AgentType[] = [];

  if (options.agents && options.agents.length > 0) {
    targetAgents = options.agents;
  } else {
    targetAgents = await detectInstalledAgents();
    if (targetAgents.length === 0) {
      info('No installed agents detected.');
      console.log(`\n${DIM}Supported agents:${RESET}`);
      for (const type of getAllAgentTypes()) {
        console.log(`  ${agents[type].displayName} (--agent ${type})`);
      }
      return;
    }
  }

  let totalServers = 0;

  for (const agentType of targetAgents) {
    const agent = agents[agentType];
    let hasOutput = false;

    // Global config
    if (!options.workspace) {
      const globalConfig = readGlobalConfig(agentType, options.verbose);
      if (globalConfig.config && Object.keys(globalConfig.config.mcpServers).length > 0) {
        if (!hasOutput) {
          console.log(`\n${BOLD}${agent.displayName}${RESET}`);
          hasOutput = true;
        }
        console.log(`  ${DIM}Global:${RESET} ${globalConfig.path}`);
        for (const [name, config] of Object.entries(globalConfig.config.mcpServers)) {
          console.log(`    ${formatServerConfig(name, config)}`);
          totalServers++;
        }
      }
    }

    // Project config
    if (!options.global) {
      const projectConfig = readProjectConfig(agentType, process.cwd(), options.verbose);
      if (projectConfig.config && Object.keys(projectConfig.config.mcpServers).length > 0) {
        if (!hasOutput) {
          console.log(`\n${BOLD}${agent.displayName}${RESET}`);
          hasOutput = true;
        }
        console.log(`  ${DIM}Project:${RESET} ${projectConfig.path}`);
        for (const [name, config] of Object.entries(projectConfig.config.mcpServers)) {
          console.log(`    ${formatServerConfig(name, config)}`);
          totalServers++;
        }
      }
    }
  }

  console.log();
  if (totalServers > 0) {
    console.log(`${GREEN}Total:${RESET} ${totalServers} MCP server(s)`);
  } else {
    info('No MCP servers configured');
  }
}
